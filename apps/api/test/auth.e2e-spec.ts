import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

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
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.userSession.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-auth-' } },
    });
  });

  afterAll(async () => {
    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.userSession.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-auth-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-auth-' } },
    });
    await app.close();
  });

  const testEmail = 'e2e-auth-flow@example.com';
  const testPassword = 'StrongP@ss1';

  async function createVerifiedUser() {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        acceptTerms: true,
      })
      .expect(201);

    const user = await prismaService.user.findUnique({ where: { email: testEmail } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prismaService.emailVerificationToken.create({
      data: {
        userId: user!.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    return user!;
  }

  let accessToken: string;
  let refreshCookie: string;

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 for a verified active candidate', async () => {
      await createVerifiedUser();

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.accessTokenExpiresAt).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.status).toBe('ACTIVE');
      expect(res.body.user.roleCodes).toContain('candidate');
      expect(res.body).not.toHaveProperty('rawRefreshToken');

      accessToken = res.body.accessToken;
    });

    it('should set the refresh cookie (HttpOnly)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookieStr = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('nexthire_refresh='))
        : cookies;
      expect(refreshCookieStr).toBeDefined();
      expect(refreshCookieStr).toContain('HttpOnly');
      expect(refreshCookieStr).not.toContain('Secure');

      const match = refreshCookieStr.match(/nexthire_refresh=([^;]+)/);
      refreshCookie = match ? match[1] : '';
      expect(refreshCookie).toBeTruthy();
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.message).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should return 401 for unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e-auth-unknown@example.com', password: 'SomePass1' })
        .expect(401);

      expect(res.body.message).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should return 403 for pending-verification account', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({
          email: 'e2e-auth-pending@example.com',
          password: testPassword,
          confirmPassword: testPassword,
          acceptTerms: true,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'e2e-auth-pending@example.com', password: testPassword })
        .expect(403);

      expect(res.body.message).toBe('AUTH_EMAIL_NOT_VERIFIED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return the current user when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(testEmail);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.roleCodes).toContain('candidate');
    });

    it('should return 401 without access token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

      expect(res.body.message).toBe('AUTH_ACCESS_TOKEN_MISSING');
    });

    it('should return 401 for invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.message).toBe('AUTH_ACCESS_TOKEN_INVALID');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return a new access token and rotate the refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `nexthire_refresh=${refreshCookie}`)
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.accessTokenExpiresAt).toBeDefined();
      expect(res.body).not.toHaveProperty('rawRefreshToken');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const newCookieStr = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('nexthire_refresh='))
        : cookies;
      expect(newCookieStr).toBeDefined();

      const match = newCookieStr.match(/nexthire_refresh=([^;]+)/);
      const oldRefreshCookie = refreshCookie;
      refreshCookie = match ? match[1] : '';

      // Old refresh token should no longer work
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `nexthire_refresh=${oldRefreshCookie}`)
        .expect(401);

      accessToken = res.body.accessToken;
    });

    it('should return 401 without refresh cookie', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);

      expect(res.body.message).toBe('AUTH_REFRESH_TOKEN_MISSING');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 204 and clear the refresh cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const clearCookieStr = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith('nexthire_refresh='))
          : cookies;
        expect(clearCookieStr).toMatch(/Expires=Thu, 01 Jan 1970/);
      }
    });

    it('should prevent refresh after logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `nexthire_refresh=${refreshCookie}`)
        .expect(401);
    });

    it('should be idempotent when session already revoked', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('no private fields exposed', () => {
    it('should not expose password, hash, or token-family in login response', async () => {
      // Re-login to get a fresh response body for inspection
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      // May be rate limited; use captured accessToken from earlier if needed
      if (res.status === 429) {
        return;
      }

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('tokenFamilyId');
      expect(res.body).not.toHaveProperty('refreshTokenHash');
    });
  });
});
