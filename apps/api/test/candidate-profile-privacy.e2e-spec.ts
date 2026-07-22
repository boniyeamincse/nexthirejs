import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateProfilePrivacyController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherUser: any;
  let otherAccessToken: string;

  let nonCandidateUser: any;
  let nonCandidateAccessToken: string;

  let suspendedUser: any;
  let suspendedAccessToken: string;

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

    await prisma.candidateProfilePrivacy.deleteMany({
      where: { user: { email: { startsWith: 'test-priv' } } },
    });
    await prisma.userSession.deleteMany({
      where: { user: { email: { startsWith: 'test-priv' } } },
    });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-priv' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-priv' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    const otherRole = await prisma.role.upsert({
      where: { code: 'admin' },
      update: {},
      create: { code: 'admin', name: 'Admin' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-priv1@example.com',
        passwordHash: 'hashed_password',
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
        refreshTokenHash: `hash-priv1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-priv2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = 'e0000000-0000-0000-0000-000000000002';
    const sid2 = 'f0000000-0000-0000-0000-000000000002';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-priv2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;

    nonCandidateUser = await prisma.user.create({
      data: {
        email: 'test-priv3@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: otherRole.id } },
      },
    });

    const tf3 = 'e0000000-0000-0000-0000-000000000003';
    const sid3 = 'f0000000-0000-0000-0000-000000000003';
    await prisma.userSession.create({
      data: {
        id: sid3,
        userId: nonCandidateUser.id,
        refreshTokenHash: `hash-priv3-${Date.now()}`,
        tokenFamilyId: tf3,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    nonCandidateAccessToken = tokenService.signAccessToken(nonCandidateUser.id, sid3, [
      'admin',
    ]).token;

    suspendedUser = await prisma.user.create({
      data: {
        email: 'test-priv4@example.com',
        passwordHash: 'hashed_password',
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
        refreshTokenHash: `hash-priv4-${Date.now()}`,
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

  const validSettings = {
    overallDiscoverability: 'PRIVATE',
    sections: {
      BASIC_PROFILE: 'PLATFORM_ONLY',
      LOCATION_AND_PREFERENCES: 'HIDDEN',
      EDUCATION: 'PLATFORM_ONLY',
      WORK_EXPERIENCE: 'PLATFORM_ONLY',
      SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
      CERTIFICATIONS_AND_TRAINING: 'PLATFORM_ONLY',
      ACHIEVEMENTS_AND_LINKS: 'PLATFORM_ONLY',
    },
  };

  describe('GET /api/v1/candidates/me/privacy', () => {
    it('returns 401 without auth', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/privacy').expect(401);
    });

    it('returns defaults when no row exists (source=DEFAULT)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.source).toBe('DEFAULT');
      expect(res.body.overallDiscoverability).toBe('PRIVATE');
      expect(res.body.sections.BASIC_PROFILE).toBe('PLATFORM_ONLY');
      expect(res.body.sections.LOCATION_AND_PREFERENCES).toBe('HIDDEN');
      expect(res.body.policyVersion).toBe('candidate-privacy-v1');
      expect(res.body.createdAt).toBeNull();
      expect(res.body.updatedAt).toBeNull();
      expect(res.body.id).toBeUndefined();
      expect(res.body.userId).toBeUndefined();
    });

    it('returns persisted settings after save', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send(validSettings)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.source).toBe('PERSISTED');
      expect(res.body.overallDiscoverability).toBe('PRIVATE');
      expect(res.body.createdAt).toBeTruthy();
      expect(res.body.updatedAt).toBeTruthy();
    });

    it('does not expose internal row or user IDs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(res.body.id).toBeUndefined();
      expect(res.body.userId).toBeUndefined();
    });
  });

  describe('PUT /api/v1/candidates/me/privacy', () => {
    it('saves valid settings and returns 200', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send(validSettings)
        .expect(200);

      expect(res.body.source).toBe('PERSISTED');
      expect(res.body.overallDiscoverability).toBe('PRIVATE');
      expect(res.body.policyVersion).toBe('candidate-privacy-v1');
    });

    it('is idempotent (same PUT twice returns 200)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send(validSettings)
        .expect(200);

      const res = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send(validSettings)
        .expect(200);

      expect(res.body.source).toBe('PERSISTED');
    });

    it('rejects invalid discoverability with 400', async () => {
      const invalid = {
        overallDiscoverability: 'INVALID',
        sections: validSettings.sections,
      };
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send(invalid)
        .expect(400);
    });

    it('rejects missing section with 400', async () => {
      const { EDUCATION, ...partialSections } = validSettings.sections;
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ overallDiscoverability: 'PRIVATE', sections: partialSections })
        .expect(400);
    });

    it('rejects unknown section with 400', async () => {
      const bad = {
        overallDiscoverability: 'PRIVATE',
        sections: {
          ...validSettings.sections,
          UNKNOWN_SECTION: 'PUBLIC',
        },
      };
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send(bad)
        .expect(400);
    });

    it('rejects non-candidate with 403', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${nonCandidateAccessToken}`)
        .send(validSettings)
        .expect(403);
    });

    it('rejects suspended account with 403', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${suspendedAccessToken}`)
        .send(validSettings)
        .expect(403);
    });

    it('does not alter profile data or completion', async () => {
      const profileBefore = await prisma.candidateProfile.findUnique({
        where: { userId: otherUser.id },
      });

      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({
          overallDiscoverability: 'PLATFORM_DISCOVERABLE',
          sections: {
            BASIC_PROFILE: 'PUBLIC',
            LOCATION_AND_PREFERENCES: 'PLATFORM_ONLY',
            EDUCATION: 'PUBLIC',
            WORK_EXPERIENCE: 'PUBLIC',
            SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
            CERTIFICATIONS_AND_TRAINING: 'HIDDEN',
            ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
          },
        })
        .expect(200);

      const profileAfter = await prisma.candidateProfile.findUnique({
        where: { userId: otherUser.id },
      });

      expect(profileBefore?.completionPercentage ?? null).toBe(
        profileAfter?.completionPercentage ?? null,
      );
    });

    it('returns cross-user independent settings', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          overallDiscoverability: 'LINK_ONLY',
          sections: {
            BASIC_PROFILE: 'PUBLIC',
            LOCATION_AND_PREFERENCES: 'HIDDEN',
            EDUCATION: 'PLATFORM_ONLY',
            WORK_EXPERIENCE: 'HIDDEN',
            SKILLS_AND_LANGUAGES: 'PLATFORM_ONLY',
            CERTIFICATIONS_AND_TRAINING: 'HIDDEN',
            ACHIEVEMENTS_AND_LINKS: 'PUBLIC',
          },
        })
        .expect(200);

      const resOther = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/privacy')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);

      expect(resOther.body.overallDiscoverability).toBe('PLATFORM_DISCOVERABLE');
    });
  });

  describe('Audit events', () => {
    it('records privacy.updated with safe metadata', async () => {
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'candidate.privacy.updated',
          actorUserId: candidateUser.id,
        },
        orderBy: { occurredAt: 'desc' },
      });

      expect(auditLog).toBeTruthy();
      expect(auditLog!.metadata).toBeTruthy();
      const meta = auditLog!.metadata as Record<string, unknown>;
      expect(meta.policyVersion).toBe('candidate-privacy-v1');
      expect(meta.changedSectionNames).toBeDefined();
      expect(meta.changedSectionCount).toBeDefined();
      expect(meta.oldDiscoverability).toBeDefined();
      expect(meta.newDiscoverability).toBeDefined();
      expect(meta.settingsSource).toBeDefined();
    });
  });
});
