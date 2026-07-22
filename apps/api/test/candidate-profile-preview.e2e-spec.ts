import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';

describe('CandidateProfilePreviewController (e2e)', () => {
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

  let country: any;

  const testEmailPrefix = 'test-prev';

  const SESSION_IDS = [
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000004',
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
        email: 'test-prev1@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = 'e0000000-0000-0000-0000-000000000001';
    const sid1 = 'f0000000-0000-0000-0000-000000000001';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-prev1-${Date.now()}`,
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
        fullName: 'John Preview',
        professionalHeadline: 'Full Stack Developer',
        professionalSummary: 'Experienced developer with 5 years in full-stack development.',
        dateOfBirth: new Date('1995-06-15'),
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
        url: 'https://linkedin.com/in/johnpreview',
        normalizedUrl: 'https://linkedin.com/in/johnpreview',
        sortOrder: 0,
      },
    });

    otherCandidate = await prisma.user.create({
      data: {
        email: 'test-prev2@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = 'e0000000-0000-0000-0000-000000000002';
    const sid2 = 'f0000000-0000-0000-0000-000000000002';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherCandidate.id,
        refreshTokenHash: `hash-prev2-${Date.now()}`,
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
        email: 'test-prev3@nexthire.dev',
        passwordHash: 'hashed',
        status: 'ACTIVE',
        roles: { create: { roleId: adminRole.id } },
      },
    });

    const tf3 = 'e0000000-0000-0000-0000-000000000003';
    const sid3 = 'f0000000-0000-0000-0000-000000000003';
    await prisma.userSession.create({
      data: {
        id: sid3,
        userId: nonCandidateUser.id,
        refreshTokenHash: `hash-prev3-${Date.now()}`,
        tokenFamilyId: tf3,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    nonCandidateAccessToken = tokenService.signAccessToken(nonCandidateUser.id, sid3, [
      'admin',
    ]).token;

    suspendedUser = await prisma.user.create({
      data: {
        email: 'test-prev4@nexthire.dev',
        passwordHash: 'hashed',
        status: 'SUSPENDED',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf4 = 'e0000000-0000-0000-0000-000000000004';
    const sid4 = 'f0000000-0000-0000-0000-000000000004';
    await prisma.userSession.create({
      data: {
        id: sid4,
        userId: suspendedUser.id,
        refreshTokenHash: `hash-prev4-${Date.now()}`,
        tokenFamilyId: tf4,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });
    suspendedAccessToken = tokenService.signAccessToken(suspendedUser.id, sid4, [
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

  describe('GET /api/v1/candidates/me/profile-preview', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/profile-preview').expect(401);
    });

    it('returns owner preview with privacy summary and completion (200)', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-preview')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.displayName).toBe('John Preview');
      expect(res.body.profile.professionalHeadline).toBe('Full Stack Developer');
      expect(res.body.profile.professionalSummary).toBe(
        'Experienced developer with 5 years in full-stack development.',
      );
      expect(res.body.profile.education).toHaveLength(1);
      expect(res.body.profile.experience).toHaveLength(1);

      expect(res.body.privacySummary).toBeDefined();
      expect(res.body.privacySummary.overallVisibility).toBe('PLATFORM_DISCOVERABLE');
      expect(res.body.privacySummary.sectionVisibility).toBeDefined();
      expect(res.body.privacySummary.sectionVisibility.BASIC_PROFILE).toBeDefined();
      expect(res.body.privacySummary.shareLinkEnabled).toBeDefined();
      expect(typeof res.body.privacySummary.shareLinkEnabled).toBe('boolean');

      expect(res.body.completion).toBeDefined();
      expect(res.body.completion.percentage).toBeGreaterThanOrEqual(0);
      expect(res.body.completion.version).toBe('candidate-profile-v7');
    });

    it('returns hidden-section indicators for private sections', async () => {
      const sections = {
        BASIC_PROFILE: 'PUBLIC',
        LOCATION_AND_PREFERENCES: 'HIDDEN',
        EDUCATION: 'PUBLIC',
        WORK_EXPERIENCE: 'HIDDEN',
        SKILLS_AND_LANGUAGES: 'PUBLIC',
        CERTIFICATIONS_AND_TRAINING: 'PUBLIC',
        ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
      };
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE', sections);

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-preview')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.privacySummary.sectionVisibility.LOCATION_AND_PREFERENCES).toBe('HIDDEN');
      expect(res.body.privacySummary.sectionVisibility.WORK_EXPERIENCE).toBe('HIDDEN');
      expect(res.body.privacySummary.sectionVisibility.BASIC_PROFILE).toBe('PUBLIC');

      expect(res.body.profile.displayName).toBe('John Preview');
      expect(res.body.profile.location).toBeDefined();
      expect(res.body.profile.experience).toHaveLength(1);
    });

    it('returns 403 for non-candidate user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-preview')
        .set('Authorization', `Bearer ${nonCandidateAccessToken}`)
        .expect(403);
    });

    it('returns 403 for suspended user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-preview')
        .set('Authorization', `Bearer ${suspendedAccessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/public/candidates/:publicId', () => {
    it('returns 404 for non-existent public ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/candidates/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 404 for private profile', async () => {
      await setPrivacy(candidateUser.id, 'PRIVATE');

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(404);
    });

    it('returns profile with visible sections when platform-discoverable', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(200);

      expect(res.body.displayName).toBe('John Preview');
      expect(res.body.professionalHeadline).toBe('Full Stack Developer');
      expect(res.body.professionalSummary).toBe(
        'Experienced developer with 5 years in full-stack development.',
      );
      expect(res.body.education).toHaveLength(1);
      expect(res.body.experience).toHaveLength(1);
      expect(res.body.skills).toHaveLength(3);
      expect(res.body.languages).toHaveLength(1);
      expect(res.body.certifications).toHaveLength(1);
      expect(res.body.training).toHaveLength(1);
      expect(res.body.achievements).toHaveLength(1);
      expect(res.body.professionalLinks).toHaveLength(1);
      expect(res.body.location).toBeDefined();
      expect(res.body.location.city).toBe('New York');
      expect(res.body.visibleSections).toBeDefined();
      expect(res.body.visibleSections.length).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeDefined();
    });

    it('hidden sections are absent from JSON', async () => {
      const sections = {
        BASIC_PROFILE: 'PUBLIC',
        LOCATION_AND_PREFERENCES: 'HIDDEN',
        EDUCATION: 'PUBLIC',
        WORK_EXPERIENCE: 'PUBLIC',
        SKILLS_AND_LANGUAGES: 'PUBLIC',
        CERTIFICATIONS_AND_TRAINING: 'PUBLIC',
        ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
      };
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE', sections);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(200);

      expect(res.body.location).toBeNull();
      expect(res.body.visibleSections).not.toContain('LOCATION_AND_PREFERENCES');
      expect(res.body.displayName).toBe('John Preview');
    });

    it('sensitive fields (email, dateOfBirth) are absent from response', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('dateOfBirth');
      expect(res.body).not.toHaveProperty('userId');
    });

    it('completion score is absent from external response', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('completion');
      expect(res.body).not.toHaveProperty('completionPercentage');
    });
  });

  describe('GET /api/v1/public/candidate-profile?token=...', () => {
    it('returns 404 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/candidate-profile?token=invalid-token-123')
        .expect(404);
    });

    it('returns 404 for disabled share link', async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');

      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: hash,
          enabled: false,
        },
        update: {
          tokenHash: hash,
          enabled: false,
          rotatedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${raw}`)
        .expect(404);

      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });

    it('returns profile with valid share token', async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');

      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: hash,
          enabled: true,
        },
        update: {
          tokenHash: hash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${raw}`)
        .expect(200);

      expect(res.body.displayName).toBe('John Preview');
      expect(res.body.professionalHeadline).toBe('Full Stack Developer');
      expect(res.body.education).toHaveLength(1);
      expect(res.body.experience).toHaveLength(1);
      expect(res.body.visibleSections).toBeDefined();
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('dateOfBirth');
      expect(res.body).not.toHaveProperty('completion');

      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });

    it('returns 404 after token rotation (old link stops working)', async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');

      const oldRaw = crypto.randomBytes(32).toString('hex');
      const oldHash = crypto.createHash('sha256').update(oldRaw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: oldHash,
          enabled: true,
        },
        update: {
          tokenHash: oldHash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });

      const newRaw = crypto.randomBytes(32).toString('hex');
      const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: newHash,
          enabled: true,
        },
        update: {
          tokenHash: newHash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${oldRaw}`)
        .expect(404);

      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });

    it('returns only externally allowed sections', async () => {
      const sections = {
        BASIC_PROFILE: 'PUBLIC',
        LOCATION_AND_PREFERENCES: 'HIDDEN',
        EDUCATION: 'PUBLIC',
        WORK_EXPERIENCE: 'PUBLIC',
        SKILLS_AND_LANGUAGES: 'PUBLIC',
        CERTIFICATIONS_AND_TRAINING: 'HIDDEN',
        ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
      };
      await setPrivacy(candidateUser.id, 'LINK_ONLY', sections);

      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: hash,
          enabled: true,
        },
        update: {
          tokenHash: hash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${raw}`)
        .expect(200);

      expect(res.body.location).toBeNull();
      expect(res.body.visibleSections).not.toContain('LOCATION_AND_PREFERENCES');
      expect(res.body.certifications).toHaveLength(0);
      expect(res.body.training).toHaveLength(0);
      expect(res.body.visibleSections).not.toContain('CERTIFICATIONS');
      expect(res.body.visibleSections).not.toContain('TRAINING');

      expect(res.body.education).toHaveLength(1);
      expect(res.body.visibleSections).toContain('EDUCATION');
      expect(res.body.visibleSections).toContain('SKILLS');

      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });
  });

  describe('Share Link Management', () => {
    let initialRawToken: string;

    beforeEach(async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');
      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: hash,
          enabled: true,
        },
        update: {
          tokenHash: hash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });
      initialRawToken = raw;
    });

    afterEach(async () => {
      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });

    it('rotates and returns new shareUrl and rotatedAt (POST /api/v1/candidates/me/profile-share-link/rotate)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/profile-share-link/rotate')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(201);

      expect(res.body.shareUrl).toBeDefined();
      expect(res.body.shareUrl).toContain('https://app.nexthire.com/shared-profile/');
      expect(res.body.rotatedAt).toBeDefined();
      expect(new Date(res.body.rotatedAt).getTime()).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${initialRawToken}`)
        .expect(404);
    });

    it('disables link-only access (PUT /api/v1/candidates/me/profile-share-link with enabled:false)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/profile-share-link')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(res.body.enabled).toBe(false);

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${initialRawToken}`)
        .expect(404);
    });

    it('enables restores link-only access', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/profile-share-link')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ enabled: false })
        .expect(200);

      const res = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/profile-share-link')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ enabled: true })
        .expect(200);

      expect(res.body.enabled).toBe(true);

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${initialRawToken}`)
        .expect(200);
    });

    it('returns share link status (GET /api/v1/candidates/me/profile-share-link/status)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-share-link/status')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.enabled).toBeDefined();
      expect(typeof res.body.enabled).toBe('boolean');
      expect(res.body.rotatedAt).toBeDefined();
    });
  });

  describe('Audit Events', () => {
    it('profile_preview.viewed is recorded', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/profile-preview')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.profile_preview.viewed',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.actorType).toBe('USER');
      expect(auditLog!.targetType).toBe('CandidateProfile');
      const meta = auditLog!.metadata as Record<string, unknown>;
      expect(meta.viewerContext).toBe('OWNER');
    });

    it('public_profile.viewed is recorded for discoverable access', async () => {
      await setPrivacy(candidateUser.id, 'PLATFORM_DISCOVERABLE');

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidates/${candidateUser.id}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'candidate.public_profile.viewed' },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.actorType).toBe('ANONYMOUS');
      const meta = auditLog!.metadata as Record<string, unknown>;
      expect(meta.viewerContext).toBe('PLATFORM_AUTHENTICATED');
    });

    it('public_profile.viewed is recorded for link-only access', async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');
      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await prisma.candidateProfileShareToken.upsert({
        where: { userId: candidateUser.id },
        create: {
          userId: candidateUser.id,
          tokenHash: hash,
          enabled: true,
        },
        update: {
          tokenHash: hash,
          enabled: true,
          rotatedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/public/candidate-profile?token=${raw}`)
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'candidate.public_profile.viewed' },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.actorType).toBe('ANONYMOUS');
      const meta = auditLog!.metadata as Record<string, unknown>;
      expect(meta.viewerContext).toBe('LINK_HOLDER');

      await prisma.candidateProfileShareToken.deleteMany({
        where: { userId: candidateUser.id },
      });
    });

    it('profile_share_link.rotated is recorded', async () => {
      await setPrivacy(candidateUser.id, 'LINK_ONLY');

      await request(app.getHttpServer())
        .post('/api/v1/candidates/me/profile-share-link/rotate')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(201);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.profile_share_link.rotated',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.actorType).toBe('USER');
      expect(auditLog!.targetType).toBe('CandidateProfileShareToken');
    });

    it('profile_share_link.enabled/disabled are recorded', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/profile-share-link')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ enabled: false })
        .expect(200);

      let auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.profile_share_link.disabled',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();

      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/profile-share-link')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ enabled: true })
        .expect(200);

      auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.profile_share_link.enabled',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
    });

    it('audit metadata contains no token or profile content', async () => {
      const auditLogs = await prisma.auditLog.findMany({
        where: { actorUserId: candidateUser.id },
        orderBy: { occurredAt: 'desc' },
        take: 20,
      });

      for (const log of auditLogs) {
        if (log.metadata) {
          const metaStr = JSON.stringify(log.metadata).toLowerCase();
          expect(metaStr).not.toContain('rawtoken');
          expect(metaStr).not.toContain('tokenhash');
          expect(metaStr).not.toContain('password');
          expect(metaStr).not.toContain('fullname');
          expect(metaStr).not.toContain('dateofbirth');
        }
      }
    });
  });
});
