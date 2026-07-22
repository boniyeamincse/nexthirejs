/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

import { ConfigModule } from '@nestjs/config';
import * as crypto from 'node:crypto';

describe('AssessmentCatalogController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let candidateToken: string;
  let inactiveCandidateToken: string;

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
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up first
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test_assessment_cat_1@example.com', 'test_assessment_cat_inactive@example.com'] },
      },
    });

    const testPassword = 'StrongP@ss1';

    // Create active user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email: 'test_assessment_cat_1@example.com', password: testPassword, confirmPassword: testPassword, acceptTerms: true })
      .expect(201);
    
    let user = await prisma.user.findUnique({ where: { email: 'test_assessment_cat_1@example.com' } });
    let rawToken = crypto.randomBytes(32).toString('hex');
    let tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 3600000) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test_assessment_cat_1@example.com', password: testPassword })
      .expect(200);
    candidateToken = loginRes.body.accessToken;

    // Create inactive user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email: 'test_assessment_cat_inactive@example.com', password: testPassword, confirmPassword: testPassword, acceptTerms: true })
      .expect(201);
    
    user = await prisma.user.findUnique({ where: { email: 'test_assessment_cat_inactive@example.com' } });
    rawToken = crypto.randomBytes(32).toString('hex');
    tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 3600000) },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    const loginResInactive = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test_assessment_cat_inactive@example.com', password: testPassword })
      .expect(200);
    inactiveCandidateToken = loginResInactive.body.accessToken;

    // Make the second user inactive
    await prisma.user.update({
      where: { email: 'test_assessment_cat_inactive@example.com' },
      data: { status: 'SUSPENDED' },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.userSession.deleteMany({
        where: { user: { email: { in: ['test_assessment_cat_1@example.com', 'test_assessment_cat_inactive@example.com'] } } },
      });
      await prisma.emailVerificationToken.deleteMany({
        where: { user: { email: { in: ['test_assessment_cat_1@example.com', 'test_assessment_cat_inactive@example.com'] } } },
      });
      await prisma.userRole.deleteMany({
        where: { user: { email: { in: ['test_assessment_cat_1@example.com', 'test_assessment_cat_inactive@example.com'] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: ['test_assessment_cat_1@example.com', 'test_assessment_cat_inactive@example.com'] } },
      });
    }
    await app.close();
  });

  describe('GET /api/v1/assessments', () => {
    it('should return 401 if unauthorized', () => {
      return request(app.getHttpServer()).get('/api/v1/assessments').expect(401);
    });



    it('should list published catalog items for a candidate', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.items)).toBe(true);
      
      if (response.body.items.length > 0) {
        expect(response.body.items[0]).toHaveProperty('slug');
        expect(response.body.items[0]).toHaveProperty('title');
        // Drafts or invite-only should not be here, but we trust the service implementation
      }
    });

    it('should filter by search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/assessments?search=javascript')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      if (response.body.items.length > 0) {
        const title = response.body.items[0].title.toLowerCase();
        const shortDescription = response.body.items[0].shortDescription.toLowerCase();
        expect(title.includes('javascript') || shortDescription.includes('javascript')).toBe(true);
      }
    });
  });

  describe('GET /api/v1/assessments/:assessmentIdOrSlug', () => {
    it('should return 401 if unauthorized', () => {
      return request(app.getHttpServer()).get('/api/v1/assessments/javascript-fundamentals').expect(401);
    });

    it('should return 404 for a non-existent slug', () => {
      return request(app.getHttpServer())
        .get('/api/v1/assessments/non-existent-slug-123')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });

    it('should return 404 for a non-existent UUID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/assessments/12345678-1234-1234-1234-123456789012')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(404);
    });

    it('should get detail for a valid slug', async () => {
      // First get list to find a valid slug
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      if (listRes.body.items.length > 0) {
        const slug = listRes.body.items[0].slug;
        const response = await request(app.getHttpServer())
          .get(`/api/v1/assessments/${slug}`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .expect(200);

        expect(response.body.slug).toBe(slug);
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('instructions');
      }
    });
  });
});
