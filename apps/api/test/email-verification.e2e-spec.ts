import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Email Verification (e2e)', () => {
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

    // Clean up test users
    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-verify-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-verify-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-verify-' } },
    });
  });

  afterAll(async () => {
    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-verify-' } } },
    });
    await prismaService.emailVerificationToken.deleteMany({
      where: { user: { email: { startsWith: 'e2e-verify-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-verify-' } },
    });
    await app.close();
  });

  const testEmail = 'e2e-verify-flow@example.com';
  const validPayload = {
    email: testEmail,
    password: 'StrongP@ss1',
    confirmPassword: 'StrongP@ss1',
    acceptTerms: true,
  };

  describe('POST /api/v1/auth/email-verification/verify', () => {
    it('should return 400 for invalid token format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/verify')
        .send({ token: 'short' })
        .expect(400);
    });

    it('should return 400 for non-existent token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/verify')
        .send({ token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/email-verification/resend', () => {
    it('should return 200 and resend for a registered pending user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({ ...validPayload, email: 'e2e-verify-resend@example.com' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/resend')
        .send({ email: 'e2e-verify-resend@example.com' })
        .expect(200);

      expect(res.body.message).toBe('Verification email sent');
    });
  });

  describe('full verify flow', () => {
    it('should verify a user end-to-end via token', async () => {
      // Register
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({ ...validPayload, email: 'e2e-verify-full@example.com' })
        .expect(201);

      // Retrieve the token from DB (in real flow user clicks email link)
      const user = await prismaService.user.findUnique({
        where: { email: 'e2e-verify-full@example.com' },
      });
      expect(user).toBeDefined();
      expect(user!.status).toBe('PENDING_VERIFICATION');

      const tokenRecord = await prismaService.emailVerificationToken.findFirst({
        where: { userId: user!.id, consumedAt: null },
      });
      expect(tokenRecord).toBeDefined();

      // We can't get the raw token from DB (it's hashed), so create one directly
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Clean the auto-generated token so our manually created one will be used
      if (tokenRecord) {
        await prismaService.emailVerificationToken.update({
          where: { id: tokenRecord.id },
          data: { consumedAt: new Date() },
        });
      }

      await prismaService.emailVerificationToken.create({
        data: {
          userId: user!.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Verify with the raw token
      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/verify')
        .send({ token: rawToken })
        .expect(200);

      expect(verifyRes.body.userId).toBe(user!.id);
      expect(verifyRes.body.email).toBe('e2e-verify-full@example.com');
      expect(verifyRes.body.verifiedAt).toBeDefined();

      // Check user is now active
      const updatedUser = await prismaService.user.findUnique({
        where: { id: user!.id },
      });
      expect(updatedUser!.status).toBe('ACTIVE');
      expect(updatedUser!.emailVerifiedAt).toBeDefined();

      // Confirm token is consumed
      const consumed = await prismaService.emailVerificationToken.findFirst({
        where: { userId: user!.id, consumedAt: null },
      });
      expect(consumed).toBeNull();
    });
  });
});
