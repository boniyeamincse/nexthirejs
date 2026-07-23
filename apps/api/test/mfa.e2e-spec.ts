/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
// supertest response bodies are typed `any`; assertions below validate shape at runtime.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { authenticator } from 'otplib';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

jest.setTimeout(30000);

const EMAIL_PREFIX = 'e2e-mfa-';

describe('MFA (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  async function cleanup() {
    await prismaService.user.deleteMany({
      where: { email: { startsWith: EMAIL_PREFIX } },
    });
  }

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
    })
      // This suite exercises many logins across several users; per-route rate
      // limiting is covered by dedicated assertions in other suites.
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
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
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const password = 'StrongP@ss1';

  async function createVerifiedUser(email: string) {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email, password, confirmPassword: password, acceptTerms: true })
      .expect(201);

    const user = await prismaService.user.findUnique({ where: { email } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    await prismaService.emailVerificationToken.create({
      data: {
        userId: user!.id,
        tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    return user!;
  }

  async function loginForToken(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    return res.body.accessToken as string;
  }

  describe('enrollment', () => {
    const email = `${EMAIL_PREFIX}enroll@example.com`;
    let accessToken: string;
    let manualSecret: string;
    let recoveryCodes: string[];

    beforeAll(async () => {
      await createVerifiedUser(email);
      accessToken = await loginForToken(email);
    });

    it('rejects unauthenticated status requests', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/mfa/status').expect(401);
    });

    it('reports DISABLED status with optional policy for candidates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.status).toBe('DISABLED');
      expect(res.body.requiredByPolicy).toBe(false);
      expect(res.body.recoveryCodesRemaining).toBe(0);
    });

    it('rejects enrollment with a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'WrongP@ss99' })
        .expect(401);
    });

    it('begins enrollment and returns QR plus manual secret', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: password })
        .expect(200);

      expect(res.body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(res.body.manualSecret).toBeDefined();
      expect(res.body.enrollmentExpiresAt).toBeDefined();
      manualSecret = res.body.manualSecret;

      const status = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(status.body.status).toBe('PENDING');
    });

    it('does not persist the plaintext secret', async () => {
      const user = await prismaService.user.findUnique({ where: { email } });
      const mfa = await prismaService.userMfa.findUnique({ where: { userId: user!.id } });
      expect(mfa!.encryptedTotpSecret).toBeDefined();
      expect(mfa!.encryptedTotpSecret).not.toContain(manualSecret);
    });

    it('rejects confirmation with an invalid code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '000000' })
        .expect(401);
    });

    it('confirms enrollment with a valid TOTP and returns 10 recovery codes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(manualSecret) })
        .expect(200);

      expect(res.body.recoveryCodes).toHaveLength(10);
      expect(res.body.enabledAt).toBeDefined();
      recoveryCodes = res.body.recoveryCodes;

      const status = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(status.body.status).toBe('ENABLED');
      expect(status.body.recoveryCodesRemaining).toBe(10);
    });

    it('stores recovery codes only as hashes', async () => {
      const user = await prismaService.user.findUnique({ where: { email } });
      const stored = await prismaService.mfaRecoveryCode.findMany({
        where: { userId: user!.id },
      });
      expect(stored).toHaveLength(10);
      for (const code of recoveryCodes) {
        expect(stored.some((row) => row.codeHash === code)).toBe(false);
      }
    });

    it('rejects a second enrollment while enabled', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: password })
        .expect(409);
    });
  });

  describe('login challenge', () => {
    const email = `${EMAIL_PREFIX}challenge@example.com`;
    let manualSecret: string;
    let recoveryCodes: string[];

    beforeAll(async () => {
      await createVerifiedUser(email);
      const accessToken = await loginForToken(email);

      const enroll = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: password })
        .expect(200);
      manualSecret = enroll.body.manualSecret;

      const confirm = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(manualSecret) })
        .expect(200);
      recoveryCodes = confirm.body.recoveryCodes;
    });

    async function startChallenge(): Promise<string> {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      expect(res.body.mfaRequired).toBe(true);
      expect(res.body.challengeToken).toBeDefined();
      expect(res.body.accessToken).toBeUndefined();
      return res.body.challengeToken as string;
    }

    it('returns a challenge instead of tokens once MFA is enabled', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      expect(res.body.mfaRequired).toBe(true);
      expect(res.body.allowedMethods).toContain('TOTP');
      expect(res.body.allowedMethods).toContain('RECOVERY_CODE');
      expect(res.body.accessToken).toBeUndefined();
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('rejects an unknown challenge token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken: 'f'.repeat(64), method: 'TOTP', code: '123456' })
        .expect(401);
    });

    it('completes login with a valid TOTP and rejects challenge reuse', async () => {
      const challengeToken = await startChallenge();

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken, method: 'TOTP', code: authenticator.generate(manualSecret) })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(email);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((cookie) => cookie.startsWith('nexthire_refresh='))).toBe(true);

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken, method: 'TOTP', code: authenticator.generate(manualSecret) })
        .expect(401);
    });

    it('revokes a challenge after 5 failed attempts', async () => {
      const challengeToken = await startChallenge();

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/mfa/challenge/verify')
          .send({ challengeToken, method: 'TOTP', code: '000000' })
          .expect(401);
      }

      const fifth = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken, method: 'TOTP', code: '000000' })
        .expect(401);
      expect(fifth.body.message).toBe('MFA_CHALLENGE_ATTEMPTS_EXCEEDED');

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken, method: 'TOTP', code: authenticator.generate(manualSecret) })
        .expect(401);
    });

    it('accepts a recovery code exactly once', async () => {
      const challengeToken = await startChallenge();
      const recoveryCode = recoveryCodes[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken, method: 'RECOVERY_CODE', code: recoveryCode })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();

      const secondChallenge = await startChallenge();
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({ challengeToken: secondChallenge, method: 'RECOVERY_CODE', code: recoveryCode })
        .expect(401);
    });
  });

  describe('trusted devices', () => {
    const email = `${EMAIL_PREFIX}trusted@example.com`;
    let manualSecret: string;
    let trustCookie: string;
    let accessToken: string;

    beforeAll(async () => {
      await createVerifiedUser(email);
      const token = await loginForToken(email);

      const enroll = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: password })
        .expect(200);
      manualSecret = enroll.body.manualSecret;

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: authenticator.generate(manualSecret) })
        .expect(200);
    });

    it('sets a trust cookie when the user opts in', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({
          challengeToken: login.body.challengeToken,
          method: 'TOTP',
          code: authenticator.generate(manualSecret),
          trustDevice: true,
          deviceName: 'E2E test laptop',
        })
        .expect(200);

      accessToken = res.body.accessToken;
      const cookies = res.headers['set-cookie'] as unknown as string[];
      const trust = cookies.find((cookie) => cookie.startsWith('nexthire_mfa_trust='));
      expect(trust).toBeDefined();
      trustCookie = trust!.split(';')[0] ?? '';
    });

    it('skips the challenge when the trust cookie is presented', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Cookie', trustCookie)
        .send({ email, password })
        .expect(200);

      expect(res.body.mfaRequired).toBeUndefined();
      expect(res.body.accessToken).toBeDefined();
    });

    it('lists the trusted device with its name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/trusted-devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.devices).toHaveLength(1);
      expect(res.body.devices[0].deviceName).toBe('E2E test laptop');
      expect(res.body.devices[0].id).toBeDefined();
    });

    it('blocks another user from revoking the device (IDOR)', async () => {
      const otherEmail = `${EMAIL_PREFIX}idor@example.com`;
      await createVerifiedUser(otherEmail);
      const otherToken = await loginForToken(otherEmail);

      const list = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/trusted-devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const deviceId = list.body.devices[0].id as string;

      await request(app.getHttpServer())
        .delete(`/api/v1/auth/mfa/trusted-devices/${deviceId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('lets the owner revoke the device, requiring a challenge again', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/trusted-devices')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const deviceId = list.body.devices[0].id as string;

      await request(app.getHttpServer())
        .delete(`/api/v1/auth/mfa/trusted-devices/${deviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Cookie', trustCookie)
        .send({ email, password })
        .expect(200);
      expect(res.body.mfaRequired).toBe(true);
    });
  });

  describe('recovery code regeneration and disable', () => {
    const email = `${EMAIL_PREFIX}manage@example.com`;
    let manualSecret: string;
    let accessToken: string;
    let originalRecoveryCodes: string[];

    beforeAll(async () => {
      await createVerifiedUser(email);
      accessToken = await loginForToken(email);

      const enroll = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: password })
        .expect(200);
      manualSecret = enroll.body.manualSecret;

      const confirm = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/enrollment/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(manualSecret) })
        .expect(200);
      originalRecoveryCodes = confirm.body.recoveryCodes;
    });

    it('regenerates recovery codes and invalidates the previous set', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/recovery-codes/regenerate')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(manualSecret) })
        .expect(200);

      expect(res.body.recoveryCodes).toHaveLength(10);
      expect(res.body.recoveryCodes).not.toEqual(originalRecoveryCodes);

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/challenge/verify')
        .send({
          challengeToken: login.body.challengeToken,
          method: 'RECOVERY_CODE',
          code: originalRecoveryCodes[0],
        })
        .expect(401);
    });

    it('rejects disable with a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'WrongP@ss99', code: authenticator.generate(manualSecret) })
        .expect(401);
    });

    it('disables MFA and restores password-only login', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: password, code: authenticator.generate(manualSecret) })
        .expect(204);

      const user = await prismaService.user.findUnique({ where: { email } });
      const mfa = await prismaService.userMfa.findUnique({ where: { userId: user!.id } });
      expect(mfa!.status).toBe('DISABLED');
      expect(mfa!.encryptedTotpSecret).toBeNull();
      expect(await prismaService.mfaRecoveryCode.count({ where: { userId: user!.id } })).toBe(0);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.mfaRequired).toBeUndefined();
    });
  });

  describe('mandatory MFA policy', () => {
    const email = `${EMAIL_PREFIX}policy@example.com`;

    it('reports requiredByPolicy for MFA-mandatory roles and enforces the guard', async () => {
      const user = await createVerifiedUser(email);

      const reviewerRole = await prismaService.role.upsert({
        where: { code: 'expert_application_reviewer' },
        update: {},
        create: {
          code: 'expert_application_reviewer',
          name: 'Expert Application Reviewer',
          description: 'Reviews expert applications',
          isSystem: true,
        },
      });
      await prismaService.userRole.create({
        data: { userId: user.id, roleId: reviewerRole.id },
      });

      const accessToken = await loginForToken(email);

      const status = await request(app.getHttpServer())
        .get('/api/v1/auth/mfa/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(status.body.requiredByPolicy).toBe(true);

      const guarded = await request(app.getHttpServer())
        .get('/api/v1/v1/manage/experts/applications')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(guarded.status).toBe(403);
      expect(guarded.body.message).toBe('MFA_REQUIRED_BY_POLICY');
    });
  });
});
