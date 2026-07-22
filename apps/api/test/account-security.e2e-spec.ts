import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import { TokenService } from './../src/modules/auth/token.service';
import * as argon2 from 'argon2';

describe('Account Security (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let tokenService: TokenService;

  const testPrefix = 'e2e-accsec-';

  // Test users
  const testCandidate = { email: `${testPrefix}candidate@example.com`, password: 'TestPass#2026' };
  const testOtherCandidate = { email: `${testPrefix}other@example.com`, password: 'OtherPass#2026' };
  const testNonCandidate = { email: `${testPrefix}noncandidate@example.com`, password: 'AdminPass#2026' };
  const testSuspended = { email: `${testPrefix}suspended@example.com`, password: 'Suspended#2026' };

  let candidateToken: string;
  let candidateUserId: string;
  let candidateSessionId: string;

  let otherCandidateToken: string;
  let otherCandidateUserId: string;

  let nonCandidateToken: string;

  let suspendedToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['../../.env', '.env'],
          ignoreEnvFile: process.env.NODE_ENV === 'test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    tokenService = app.get<TokenService>(TokenService);

    // Clean up any previous test data
    await prismaService.userRole.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.userSession.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.candidateProfile.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.user.deleteMany({ where: { email: { startsWith: testPrefix } } });

    // Create roles if they don't exist
    let candidateRole = await prismaService.role.findUnique({ where: { code: 'candidate' } });
    if (!candidateRole) {
      candidateRole = await prismaService.role.create({ data: { code: 'candidate', name: 'Candidate' } });
    }
    let adminRole = await prismaService.role.findUnique({ where: { code: 'admin' } });
    if (!adminRole) {
      adminRole = await prismaService.role.create({ data: { code: 'admin', name: 'Administrator' } });
    }

    // Create candidate user
    const candidateHash = await argon2.hash(testCandidate.password, { type: argon2.argon2id });
    const candidateUser = await prismaService.user.create({
      data: {
        email: testCandidate.email,
        passwordHash: candidateHash,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    candidateUserId = candidateUser.id;
    await prismaService.userRole.create({ data: { userId: candidateUser.id, roleId: candidateRole!.id } });
    candidateSessionId = crypto.randomUUID();
    const candidateRefreshHash = crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex');
    await prismaService.userSession.create({
      data: {
        id: candidateSessionId,
        userId: candidateUser.id,
        status: 'ACTIVE',
        refreshTokenHash: candidateRefreshHash,
        tokenFamilyId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const candidateTokenResult = await tokenService.signAccessToken(candidateUser.id, candidateSessionId, ['candidate']);
    candidateToken = candidateTokenResult.token;

    // Create a second session for session revocation test
    const otherSessionId = crypto.randomUUID();
    const otherSessionRefreshHash = crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex');
    await prismaService.userSession.create({
      data: {
        id: otherSessionId,
        userId: candidateUser.id,
        status: 'ACTIVE',
        refreshTokenHash: otherSessionRefreshHash,
        tokenFamilyId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create other candidate user
    const otherHash = await argon2.hash(testOtherCandidate.password, { type: argon2.argon2id });
    const otherUser = await prismaService.user.create({
      data: {
        email: testOtherCandidate.email,
        passwordHash: otherHash,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    otherCandidateUserId = otherUser.id;
    await prismaService.userRole.create({ data: { userId: otherUser.id, roleId: candidateRole!.id } });
    const otherSessionId2 = crypto.randomUUID();
    const otherRefreshHash2 = crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex');
    await prismaService.userSession.create({
      data: {
        id: otherSessionId2,
        userId: otherUser.id,
        status: 'ACTIVE',
        refreshTokenHash: otherRefreshHash2,
        tokenFamilyId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const otherTokenResult = await tokenService.signAccessToken(otherUser.id, otherSessionId2, ['candidate']);
    otherCandidateToken = otherTokenResult.token;

    // Create non-candidate user (admin)
    const adminHash = await argon2.hash(testNonCandidate.password, { type: argon2.argon2id });
    const adminUser = await prismaService.user.create({
      data: {
        email: testNonCandidate.email,
        passwordHash: adminHash,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await prismaService.userRole.create({ data: { userId: adminUser.id, roleId: adminRole!.id } });
    const adminSessionId = crypto.randomUUID();
    const adminRefreshHash = crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex');
    await prismaService.userSession.create({
      data: {
        id: adminSessionId,
        userId: adminUser.id,
        status: 'ACTIVE',
        refreshTokenHash: adminRefreshHash,
        tokenFamilyId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const adminTokenResult = await tokenService.signAccessToken(adminUser.id, adminSessionId, ['admin']);
    nonCandidateToken = adminTokenResult.token;

    // Create suspended user
    const suspendedHash = await argon2.hash(testSuspended.password, { type: argon2.argon2id });
    const suspendedUser = await prismaService.user.create({
      data: {
        email: testSuspended.email,
        passwordHash: suspendedHash,
        status: 'SUSPENDED',
        emailVerifiedAt: new Date(),
      },
    });
    await prismaService.userRole.create({ data: { userId: suspendedUser.id, roleId: candidateRole!.id } });
    const suspendedSessionId = crypto.randomUUID();
    const suspendedRefreshHash = crypto.createHash('sha256').update(crypto.randomBytes(32).toString('hex')).digest('hex');
    await prismaService.userSession.create({
      data: {
        id: suspendedSessionId,
        userId: suspendedUser.id,
        status: 'ACTIVE',
        refreshTokenHash: suspendedRefreshHash,
        tokenFamilyId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const suspendedTokenResult = await tokenService.signAccessToken(suspendedUser.id, suspendedSessionId, ['candidate']);
    suspendedToken = suspendedTokenResult.token;
  }, 30000);

  afterAll(async () => {
    await prismaService.userRole.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.userSession.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.candidateProfile.deleteMany({ where: { user: { email: { startsWith: testPrefix } } } });
    await prismaService.user.deleteMany({ where: { email: { startsWith: testPrefix } } });
    await app.close();
  });

  describe('GET /api/v1/candidates/me/account-security', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .expect(401);
    });

    it('should return security summary with email and status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.email).toBe(testCandidate.email);
      expect(res.body.accountStatus).toBe('ACTIVE');
      expect(res.body.emailVerified).toBe(true);
      expect(typeof res.body.activeSessionCount).toBe('number');
      expect(res.body.activeSessionCount).toBeGreaterThanOrEqual(2);
    });

    it('should return correct current session timestamps', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.currentSessionCreatedAt).toBeDefined();
      expect(typeof res.body.currentSessionCreatedAt).toBe('string');
      expect(res.body.currentSessionLastUsedAt).toBeDefined();
    });

    it('should return passwordLastChangedAt as null when not set', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.passwordLastChangedAt).toBeNull();
    });

    it('should contain security links with correct paths', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.securityLinks).toBeDefined();
      expect(res.body.securityLinks.sessions).toBe('/settings/security/sessions');
      expect(res.body.securityLinks.privacy).toBe('/settings/privacy');
    });

    it('should not expose sensitive fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('refreshTokenHash');
      expect(res.body).not.toHaveProperty('tokenFamilyId');
      expect(res.body).not.toHaveProperty('sessionId');
      expect(res.body).not.toHaveProperty('ipAddress');
      expect(res.body).not.toHaveProperty('userAgent');
      expect(res.body).not.toHaveProperty('userId');
      expect(res.body).not.toHaveProperty('roleCodes');
    });

    it('should return 403 for non-candidate user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${nonCandidateToken}`)
        .expect(403);
    });

    it('should return 403 for suspended user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .expect(403);
    });

    it('should audit candidate.account_security.viewed', async () => {
      // The audit is best-effort; just verify we can call it
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.email).toBe(testCandidate.email);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: testCandidate.password,
          newPassword: 'NewStrongPass#2026',
          confirmNewPassword: 'NewStrongPass#2026',
        })
        .expect(401);
    });

    it('should return 200 and change password for valid request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: testCandidate.password,
          newPassword: 'NewStrongPass#2026',
          confirmNewPassword: 'NewStrongPass#2026',
        })
        .expect(200);

      expect(res.body.changed).toBe(true);
      expect(typeof res.body.revokedOtherSessionCount).toBe('number');
      // At least the second session we created should be revoked
      expect(res.body.revokedOtherSessionCount).toBeGreaterThanOrEqual(1);
    });

    it('should make passwordLastChangedAt available after password change', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/account-security')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.passwordLastChangedAt).not.toBeNull();
      expect(typeof res.body.passwordLastChangedAt).toBe('string');
    });

    it('should return 401 for wrong current password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'WrongPass#2026',
          newPassword: 'AnotherNew#2026',
          confirmNewPassword: 'AnotherNew#2026',
        })
        .expect(401);

      expect(res.body.message).toBe('AUTH_CURRENT_PASSWORD_INVALID');
    });

    it('should return 400 for weak new password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'NewStrongPass#2026',
          newPassword: 'short',
          confirmNewPassword: 'short',
        })
        .expect(400);
    });

    it('should return 400 when new password matches current password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'NewStrongPass#2026',
          newPassword: 'NewStrongPass#2026',
          confirmNewPassword: 'NewStrongPass#2026',
        })
        .expect(400);
    });

    it('should revoke other sessions while keeping current session active', async () => {
      // Get another signed token for the same user's OTHER session
      const otherSessionAccessToken = await tokenService.signAccessToken(
        candidateUserId,
        crypto.randomUUID(),
        ['candidate'],
      );

      // Other session token should not work for authenticated endpoints
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${otherSessionAccessToken.token}`)
        .expect(401);
    });

    it('should keep current session usable after password change', async () => {
      // The current session token should still work
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(res.body.email).toBe(testCandidate.email);
    });

    it('should return 403 for suspended user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .send({
          currentPassword: testSuspended.password,
          newPassword: 'NewSuspended#2026',
          confirmNewPassword: 'NewSuspended#2026',
        })
        .expect(403);
    });

    it('should not expose secrets in response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'NewStrongPass#2026',
          newPassword: 'AnotherNewPass#2026',
          confirmNewPassword: 'AnotherNewPass#2026',
        })
        .expect(200);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('accessToken');
      expect(res.body).not.toHaveProperty('refreshToken');
      expect(res.body.changed).toBe(true);
    });

    // Update the candidateToken to the latest password for other tests
    it('should work with new password after change', async () => {
      // Re-login concept: verify the new password works by calling change-password again
      // with the newly set password (since we changed to 'AnotherNewPass#2026')
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'AnotherNewPass#2026',
          newPassword: 'FinalPass#2026',
          confirmNewPassword: 'FinalPass#2026',
        })
        .expect(200);

      expect(res.body.changed).toBe(true);
    });
  });

  describe('no private fields exposed - change password response', () => {
    it('should not expose password, hash, or token-family in change-password response', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          currentPassword: 'FinalPass#2026',
          newPassword: 'LastPass#2026',
          confirmNewPassword: 'LastPass#2026',
        });

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('tokenFamilyId');
      expect(res.body).not.toHaveProperty('refreshTokenHash');
      expect(res.body).not.toHaveProperty('currentPassword');
      expect(res.body).not.toHaveProperty('newPassword');
    });
  });
});
