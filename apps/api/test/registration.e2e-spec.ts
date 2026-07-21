import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Registration (e2e)', () => {
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
      where: { user: { email: { startsWith: 'e2e-registration-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-registration-' } },
    });
  });

  afterAll(async () => {
    await prismaService.userRole.deleteMany({
      where: { user: { email: { startsWith: 'e2e-registration-' } } },
    });
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'e2e-registration-' } },
    });
    await app.close();
  });

  const validPayload = {
    email: 'e2e-registration-test@example.com',
    password: 'StrongP@ss1',
    confirmPassword: 'StrongP@ss1',
    acceptTerms: true,
  };

  describe('POST /api/v1/auth/register/candidate', () => {
    it('should return 201 for valid registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send(validPayload)
        .expect(201);

      expect(res.body.userId).toBeDefined();
      expect(res.body.email).toBe('e2e-registration-test@example.com');
      expect(res.body.status).toBe('PENDING_VERIFICATION');
      expect(res.body.emailVerificationRequired).toBe(true);
      expect(res.body.createdAt).toBeDefined();
    });

    it('should create a user row in the database', async () => {
      const user = await prismaService.user.findUnique({
        where: { email: 'e2e-registration-test@example.com' },
        include: { roles: true },
      });

      expect(user).toBeDefined();
      expect(user!.status).toBe('PENDING_VERIFICATION');
    });

    it('should assign the candidate role', async () => {
      const user = await prismaService.user.findUnique({
        where: { email: 'e2e-registration-test@example.com' },
        include: { roles: { include: { role: true } } },
      });

      expect(user!.roles.length).toBeGreaterThanOrEqual(1);
      expect(user!.roles[0]?.role?.code).toBe('candidate');
    });

    it('should store password hash different from input', async () => {
      const user = await prismaService.user.findUnique({
        where: { email: 'e2e-registration-test@example.com' },
      });

      expect(user!.passwordHash).not.toBe('StrongP@ss1');
      expect(user!.passwordHash).toContain('$argon2');
    });

    it('should return 409 for duplicate email with different case', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({ ...validPayload, email: 'E2E-REGISTRATION-TEST@EXAMPLE.COM' })
        .expect(409);

      expect(res.body.message).toContain('AUTH_EMAIL_ALREADY_REGISTERED');
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({
          email: 'not-valid',
          password: 'short',
          confirmPassword: 'short',
          acceptTerms: true,
        })
        .expect(400);
    });

    it('should return 400 when terms are not accepted', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({ ...validPayload, email: 'e2e-registration-terms@example.com', acceptTerms: false })
        .expect(400);
    });

    it('should return a response without tokens or password fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register/candidate')
        .send({ ...validPayload, email: 'e2e-registration-clean@example.com' })
        .expect(201);

      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('accessToken');
      expect(res.body).not.toHaveProperty('refreshToken');
    });

    it('should create an audit record without sensitive metadata', async () => {
      const auditRecord = await prismaService.auditLog.findFirst({
        where: {
          action: 'auth.candidate.registered',
          targetId: (
            await prismaService.user.findUnique({
              where: { email: 'e2e-registration-test@example.com' },
            })
          )?.id,
        },
      });

      expect(auditRecord).toBeDefined();
      expect(auditRecord!.actorType).toBe('USER');

      const metadata = auditRecord!.metadata as Record<string, unknown> | null;
      expect(metadata).toBeDefined();
      expect(metadata).not.toHaveProperty('email');
      expect(metadata).not.toHaveProperty('password');
    });
  });
});
