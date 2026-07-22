import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('Password Reset (e2e)', () => {
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

    // Normally you'd register the ZodValidationPipe or use ValidationPipe,
    // but our controllers instantiate the ZodValidationPipe directly on the body.

    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 202 even if email does not exist (prevent enumeration)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: `random${Date.now()}@example.com` });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 400 for invalid token', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({
        token: 'invalid-token-123',
        password: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid/i);
    });

    it('should return 400 for password mismatch', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({
        token: 'some-token',
        password: 'NewStrongPassword123!',
        confirmPassword: 'DifferentPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Passwords do not match');
    });
  });
});
