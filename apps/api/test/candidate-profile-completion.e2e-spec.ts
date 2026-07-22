import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';

describe('CandidateProfileCompletionController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherCandidate: any;
  let otherCandidateAccessToken: string;

  let nonCandidateUser: any;
  let nonCandidateAccessToken: string;

  let suspendedUser: any;
  let suspendedAccessToken: string;

  let emptyProfileUser: any;
  let emptyProfileAccessToken: string;

  let country: any;

  const testEmailPrefix = 'test-comp';

  const SESSION_IDS = [
    'f0000000-0000-0000-0000-000000000011',
    'f0000000-0000-0000-0000-000000000012',
    'f0000000-0000-0000-0000-000000000013',
    'f0000000-0000-0000-0000-000000000014',
    'f0000000-0000-0000-0000-000000000015',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    tokenService = app.get<TokenService>(TokenService);

    const testUserIds = (
      await prisma.user.findMany({
        where: { email: { startsWith: testEmailPrefix } },
        select: { id: true },
      })
    ).map((u) => u.id);

    await prisma.auditLog.deleteMany({
      where: {
        actorUserId: {
          in: testUserIds.length > 0 ? testUserIds : ['00000000-0000-0000-0000-000000000000'],
        },
      },
    });
    await prisma.candidateProfileShareToken.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.userSession.deleteMany({ where: { id: { in: SESSION_IDS } } });
    await prisma.candidateProfilePrivacy.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateProfessionalLink.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateAchievement.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateTraining.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateCertification.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateLanguage.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateSkill.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.workExperienceRecord.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.educationRecord.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidatePreference.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.candidateProfile.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.userSession.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.userRole.deleteMany({
      where: { user: { email: { startsWith: testEmailPrefix } } },
    });
    await prisma.user.deleteMany({ where: { email: { startsWith: testEmailPrefix } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    const adminRole = await prisma.role.upsert({
      where: { code: 'admin' },
      update: {},
      create: { code: 'admin', name: 'Admin' },
    });

    country = await prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        code: 'US',
        name: 'United States',
        phoneCode: '+1',
        defaultCurrency: 'USD',
        defaultTimezone: 'America/New_York',
        supportedLanguages: ['en'],
      },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-comp1@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = 'e0000000-0000-0000-0000-000000000011';
    const sid1 = 'f0000000-0000-0000-0000-000000000011';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-comp1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    await prisma.candidateProfile.create({
      data: {
        userId: candidateUser.id,
        fullName: 'John Completion',
        professionalHeadline: 'Full Stack Developer',
        completionPercentage: 0,
      },
    });

    await prisma.candidatePreference.create({
      data: {
        userId: candidateUser.id,
        countryId: country.id,
        currentCity: 'New York',
        preferredJobRoles: ['Software Engineer'],
        preferredWorkModes: ['HYBRID'],
        preferredEmploymentTypes: ['FULL_TIME'],
      },
    });

    await prisma.educationRecord.create({
      data: {
        userId: candidateUser.id,
        educationLevel: 'BACHELOR',
        institutionName: 'MIT',
        qualification: 'B.Sc. Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2013-09-01'),
        endDate: new Date('2017-06-01'),
        grade: '3.8 GPA',
        sortOrder: 0,
      },
    });

    await prisma.educationRecord.create({
      data: {
        userId: candidateUser.id,
        educationLevel: 'MASTER',
        institutionName: 'Stanford',
        qualification: 'M.Sc. Computer Science',
        fieldOfStudy: 'Artificial Intelligence',
        startDate: new Date('2017-09-01'),
        endDate: new Date('2019-06-01'),
        grade: '4.0 GPA',
        sortOrder: 1,
      },
    });

    await prisma.workExperienceRecord.create({
      data: {
        userId: candidateUser.id,
        companyName: 'Tech Corp',
        jobTitle: 'Senior Developer',
        employmentType: 'FULL_TIME',
        location: 'New York, NY',
        isRemote: false,
        startDate: new Date('2019-01-01'),
        currentlyWorking: true,
        responsibilities: 'Led frontend team.',
        sortOrder: 0,
      },
    });

    await prisma.workExperienceRecord.create({
      data: {
        userId: candidateUser.id,
        companyName: 'Startup Inc',
        jobTitle: 'Junior Developer',
        employmentType: 'FULL_TIME',
        location: 'San Francisco, CA',
        isRemote: false,
        startDate: new Date('2017-07-01'),
        endDate: new Date('2018-12-31'),
        responsibilities: 'Built REST APIs.',
        sortOrder: 1,
      },
    });

    await prisma.candidateSkill.create({
      data: {
        userId: candidateUser.id,
        name: 'TypeScript',
        normalizedName: 'typescript',
        level: 'ADVANCED',
        yearsOfExperience: 4,
        sortOrder: 0,
      },
    });

    await prisma.candidateSkill.create({
      data: {
        userId: candidateUser.id,
        name: 'Node.js',
        normalizedName: 'node.js',
        level: 'ADVANCED',
        yearsOfExperience: 5,
        sortOrder: 1,
      },
    });

    await prisma.candidateSkill.create({
      data: {
        userId: candidateUser.id,
        name: 'React',
        normalizedName: 'react',
        level: 'INTERMEDIATE',
        yearsOfExperience: 3,
        sortOrder: 2,
      },
    });

    await prisma.candidateLanguage.create({
      data: {
        userId: candidateUser.id,
        name: 'English',
        normalizedName: 'english',
        speaking: 'NATIVE',
        reading: 'NATIVE',
        writing: 'NATIVE',
        sortOrder: 0,
      },
    });

    await prisma.candidateLanguage.create({
      data: {
        userId: candidateUser.id,
        name: 'Spanish',
        normalizedName: 'spanish',
        speaking: 'PROFESSIONAL',
        reading: 'PROFESSIONAL',
        writing: 'CONVERSATIONAL',
        sortOrder: 1,
      },
    });

    await prisma.candidateCertification.create({
      data: {
        userId: candidateUser.id,
        name: 'AWS Solutions Architect',
        issuer: 'Amazon',
        issueDate: new Date('2022-03-01'),
        doesNotExpire: false,
        expiryDate: new Date('2025-03-01'),
        credentialUrl: 'https://aws.amazon.com/verify',
        sortOrder: 0,
      },
    });

    await prisma.candidateTraining.create({
      data: {
        userId: candidateUser.id,
        title: 'Advanced Node.js',
        provider: 'Udemy',
        completionDate: new Date('2023-06-01'),
        durationHours: 40,
        description: 'In-depth Node.js course',
        sortOrder: 0,
      },
    });

    await prisma.candidateAchievement.create({
      data: {
        userId: candidateUser.id,
        title: 'Employee of the Month',
        issuer: 'Tech Corp',
        achievedAt: new Date('2023-01-01'),
        description: 'Recognized for outstanding performance.',
        sortOrder: 0,
      },
    });

    await prisma.candidateProfessionalLink.create({
      data: {
        userId: candidateUser.id,
        type: 'LINKEDIN',
        label: 'LinkedIn',
        url: 'https://linkedin.com/in/johncompletion',
        normalizedUrl: 'https://linkedin.com/in/johncompletion',
        sortOrder: 0,
      },
    });

    await prisma.candidateProfessionalLink.create({
      data: {
        userId: candidateUser.id,
        type: 'GITHUB',
        label: 'GitHub',
        url: 'https://github.com/johncompletion',
        normalizedUrl: 'https://github.com/johncompletion',
        sortOrder: 1,
      },
    });

    otherCandidate = await prisma.user.create({
      data: {
        email: 'test-comp2@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = 'e0000000-0000-0000-0000-000000000012';
    const sid2 = 'f0000000-0000-0000-0000-000000000012';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherCandidate.id,
        refreshTokenHash: `hash-comp2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    otherCandidateAccessToken = tokenService.signAccessToken(otherCandidate.id, sid2, [
      'candidate',
    ]).token;

    await prisma.candidateProfile.create({
      data: {
        userId: otherCandidate.id,
        fullName: 'Jane Other',
        professionalHeadline: 'Backend Developer',
        completionPercentage: 30,
      },
    });

    await prisma.candidatePreference.create({
      data: {
        userId: otherCandidate.id,
        countryId: country.id,
        currentCity: 'San Francisco',
        preferredJobRoles: ['Backend Engineer'],
        preferredWorkModes: ['REMOTE'],
        preferredEmploymentTypes: ['FULL_TIME'],
      },
    });

    nonCandidateUser = await prisma.user.create({
      data: {
        email: 'test-comp3@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: adminRole.id } },
      },
    });

    const tf3 = 'e0000000-0000-0000-0000-000000000013';
    const sid3 = 'f0000000-0000-0000-0000-000000000013';
    await prisma.userSession.create({
      data: {
        id: sid3,
        userId: nonCandidateUser.id,
        refreshTokenHash: `hash-comp3-${Date.now()}`,
        tokenFamilyId: tf3,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    nonCandidateAccessToken = tokenService.signAccessToken(nonCandidateUser.id, sid3, [
      'admin',
    ]).token;

    suspendedUser = await prisma.user.create({
      data: {
        email: 'test-comp4@nexthire.dev',
        passwordHash: 'hashed',
        status: 'SUSPENDED',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf4 = 'e0000000-0000-0000-0000-000000000014';
    const sid4 = 'f0000000-0000-0000-0000-000000000014';
    await prisma.userSession.create({
      data: {
        id: sid4,
        userId: suspendedUser.id,
        refreshTokenHash: `hash-comp4-${Date.now()}`,
        tokenFamilyId: tf4,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    suspendedAccessToken = tokenService.signAccessToken(suspendedUser.id, sid4, [
      'candidate',
    ]).token;

    emptyProfileUser = await prisma.user.create({
      data: {
        email: 'test-comp5@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf5 = 'e0000000-0000-0000-0000-000000000015';
    const sid5 = 'f0000000-0000-0000-0000-000000000015';
    await prisma.userSession.create({
      data: {
        id: sid5,
        userId: emptyProfileUser.id,
        refreshTokenHash: `hash-comp5-${Date.now()}`,
        tokenFamilyId: tf5,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    emptyProfileAccessToken = tokenService.signAccessToken(emptyProfileUser.id, sid5, [
      'candidate',
    ]).token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function setPrivacy(
    userId: string,
    discoverability: string,
    sections?: Record<string, string>,
  ) {
    const defaultSections: Record<string, string> = {
      BASIC_PROFILE: 'PUBLIC',
      LOCATION_AND_PREFERENCES: 'PLATFORM_ONLY',
      EDUCATION: 'PUBLIC',
      WORK_EXPERIENCE: 'PUBLIC',
      SKILLS_AND_LANGUAGES: 'PUBLIC',
      CERTIFICATIONS_AND_TRAINING: 'PUBLIC',
      ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
    };

    const finalSections = sections ?? defaultSections;

    await prisma.candidateProfilePrivacy.upsert({
      where: { userId },
      create: {
        userId,
        overallDiscoverability: discoverability as any,
        basicProfile: finalSections.BASIC_PROFILE as any,
        locationAndPreferences: finalSections.LOCATION_AND_PREFERENCES as any,
        education: finalSections.EDUCATION as any,
        workExperience: finalSections.WORK_EXPERIENCE as any,
        skillsAndLanguages: finalSections.SKILLS_AND_LANGUAGES as any,
        certificationsAndTraining: finalSections.CERTIFICATIONS_AND_TRAINING as any,
        achievementsAndLinks: finalSections.ACHIEVEMENTS_AND_LINKS as any,
        policyVersion: 'candidate-privacy-v1',
      },
      update: {
        overallDiscoverability: discoverability as any,
        basicProfile: finalSections.BASIC_PROFILE as any,
        locationAndPreferences: finalSections.LOCATION_AND_PREFERENCES as any,
        education: finalSections.EDUCATION as any,
        workExperience: finalSections.WORK_EXPERIENCE as any,
        skillsAndLanguages: finalSections.SKILLS_AND_LANGUAGES as any,
        certificationsAndTraining: finalSections.CERTIFICATIONS_AND_TRAINING as any,
        achievementsAndLinks: finalSections.ACHIEVEMENTS_AND_LINKS as any,
      },
    });
  }

  describe('GET /api/v1/candidates/me/profile-completion', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .expect(401);
    });

    it('returns completion dashboard with sections and actions (200)', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.completion).toBeDefined();
      expect(res.body.completion.percentage).toBeGreaterThanOrEqual(0);
      expect(res.body.completion.percentage).toBeLessThanOrEqual(100);
      expect(res.body.completion.earnedPoints).toBeGreaterThan(0);
      expect(res.body.completion.totalPoints).toBe(100);
      expect(res.body.completion.version).toBe('candidate-profile-v7');
      expect(res.body.completion.updatedAt).toBeDefined();

      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalSections).toBe(11);
      expect(typeof res.body.summary.completedSections).toBe('number');
      expect(typeof res.body.summary.inProgressSections).toBe('number');
      expect(typeof res.body.summary.notStartedSections).toBe('number');

      expect(res.body.sections).toBeDefined();
      expect(Array.isArray(res.body.sections)).toBe(true);
      expect(res.body.sections.length).toBe(11);

      expect(res.body.nextActions).toBeDefined();
      expect(Array.isArray(res.body.nextActions)).toBe(true);
    });

    it('section earned points reconcile with overall percentage', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const totalEarned = res.body.sections.reduce(
        (sum: number, s: any) => sum + s.earnedPoints,
        0,
      );
      expect(totalEarned).toBe(res.body.completion.earnedPoints);
      expect(res.body.completion.percentage).toBe(
        Math.round((totalEarned / res.body.completion.totalPoints) * 100),
      );
    });

    it('section possible points total 100', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const totalPossible = res.body.sections.reduce(
        (sum: number, s: any) => sum + s.possiblePoints,
        0,
      );
      expect(totalPossible).toBe(100);
    });

    it('completed sections show COMPLETED status', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const completedSections = res.body.sections.filter((s: any) => s.status === 'COMPLETED');
      expect(completedSections.length).toBeGreaterThan(0);

      for (const section of completedSections) {
        expect(section.earnedPoints).toBe(section.possiblePoints);
      }
    });

    it('empty profile candidate returns valid zero state', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${emptyProfileAccessToken}`)
        .expect(200);

      expect(res.body.completion.percentage).toBe(0);
      expect(res.body.completion.earnedPoints).toBe(0);
      expect(res.body.completion.totalPoints).toBe(100);

      expect(res.body.summary.completedSections).toBe(0);
      expect(res.body.summary.notStartedSections).toBeGreaterThan(0);

      expect(res.body.sections).toBeDefined();
      for (const section of res.body.sections) {
        if (section.section !== 'PRIVACY_AND_SHARING') {
          expect(section.earnedPoints).toBe(0);
        }
        expect(section.missingItems).toBeDefined();
      }

      expect(res.body.nextActions).toBeDefined();
      expect(res.body.nextActions.length).toBeGreaterThan(0);
    });

    it('returns 403 for non-candidate user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${nonCandidateAccessToken}`)
        .expect(403);
    });

    it('returns 403 for suspended user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${suspendedAccessToken}`)
        .expect(403);
    });

    it('response excludes private/auth fields (no email, userId, password, token)', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(candidateUser.email);
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('userId');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('token');

      for (const section of res.body.sections) {
        expect(section).not.toHaveProperty('email');
        expect(section).not.toHaveProperty('userId');
      }
    });

    it('privacy changes do not alter completion score', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res1 = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const scoreBefore = res1.body.completion.percentage;

      await setPrivacy(candidateUser.id, 'PRIVATE');

      const res2 = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const scoreAfter = res2.body.completion.percentage;
      expect(scoreAfter).toBe(scoreBefore);

      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');
    });

    it('audit event candidate.profile_completion.viewed is recorded with safe metadata', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-completion')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.profile_completion.viewed',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.actorType).toBe('USER');
      expect(auditLog!.targetType).toBe('CandidateProfile');

      const meta = auditLog!.metadata as Record<string, unknown>;
      expect(meta.viewerContext).toBe('OWNER');

      const metaStr = JSON.stringify(meta).toLowerCase();
      expect(metaStr).not.toContain('fullname');
      expect(metaStr).not.toContain('professionalheadline');
      expect(metaStr).not.toContain('professionalSummary');
      expect(metaStr).not.toContain('dateofbirth');
      expect(metaStr).not.toContain('email');
      expect(metaStr).not.toContain('password');
      expect(metaStr).not.toContain('token');
    });
  });
});
