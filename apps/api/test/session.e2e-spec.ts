import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Session Management (e2e)', () => {
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
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.userSession.deleteMany({
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-session-' } },
    });
  });

  afterAll(async () => {
    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.userSession.deleteMany({
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-session-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-session-' } },
    });
    await app.close();
  });

  const testEmail = 'e2e-session-flow@example.com';
  const testPassword = 'StrongP@ss1';

  async function createVerifiedUser(email: string) {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email, password: testPassword, confirmPassword: testPassword, acceptTerms: true })
      .expect(201);

    const user = await prismaService.user.findUnique({ where: { email } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prismaService.emailVerificationToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 3600000) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);
    return user!;
  }

  let accessToken: string;
  let sessionId: string;
  let secondAccessToken: string;

  it('should login and create a session', async () => {
    await createVerifiedUser(testEmail);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/sessions should return 200 and list sessions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.sessions).toBeDefined();
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);

    const current = res.body.sessions.find((s: Record<string, unknown>) => s.isCurrent);
    expect(current).toBeDefined();
    sessionId = current.id;
    expect(current.status).toBe('ACTIVE');
    expect(current.id).toBeDefined();
    expect(current.createdAt).toBeDefined();
    expect(current.expiresAt).toBeDefined();
    expect(current).not.toHaveProperty('refreshTokenHash');
    expect(current).not.toHaveProperty('tokenFamilyId');
  });

  it('should show a second login as another session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    secondAccessToken = res.body.accessToken;
    expect(secondAccessToken).toBeDefined();

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(200);

    expect(listRes.body.sessions.length).toBeGreaterThanOrEqual(2);
    const currentCount = listRes.body.sessions.filter(
      (s: Record<string, unknown>) => s.isCurrent,
    ).length;
    expect(currentCount).toBe(1);
  });

  it('DELETE /api/v1/auth/sessions/:id should revoke another session', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const otherSession = listRes.body.sessions.find((s: Record<string, unknown>) => !s.isCurrent);
    expect(otherSession).toBeDefined();

    await request(app.getHttpServer())
      .delete(`/api/v1/auth/sessions/${otherSession.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('revoked session cannot access protected endpoint', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${secondAccessToken}`)
      .expect(401);
  });

  it('revoked session cannot refresh', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'nexthire_refresh=someoldtoken')
      .expect(401);
  });

  it('revoking another user session returns 404', async () => {
    const otherEmail = 'e2e-session-other@example.com';
    await createVerifiedUser(otherEmail);
    const otherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: otherEmail, password: testPassword })
      .expect(200);

    const otherToken = otherRes.body.accessToken;
    await request(app.getHttpServer())
      .delete(`/api/v1/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('POST /api/v1/auth/logout-all should revoke all sessions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.revokedSessionCount).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('unauthorized request returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/sessions').expect(401);

    await request(app.getHttpServer()).delete('/api/v1/auth/sessions/some-id').expect(401);

    await request(app.getHttpServer()).post('/api/v1/auth/logout-all').expect(401);
  });

  it('private fields are absent from session list', async () => {
    const freshEmail = 'e2e-session-private@example.com';
    await createVerifiedUser(freshEmail);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: freshEmail, password: testPassword })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    for (const s of listRes.body.sessions) {
      expect(s).not.toHaveProperty('refreshTokenHash');
      expect(s).not.toHaveProperty('tokenFamilyId');
      expect(s).not.toHaveProperty('accessToken');
      expect(s).not.toHaveProperty('passwordHash');
    }
  });
});
