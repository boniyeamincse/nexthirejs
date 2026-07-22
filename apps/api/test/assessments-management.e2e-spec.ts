import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { SessionService } from '../src/modules/auth/session.service';
import { randomUUID } from 'crypto';

describe('Assessment Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let sessionService: SessionService;
  
  let managerToken: string;
  let candidateToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    tokenService = app.get<TokenService>(TokenService);
    sessionService = app.get<SessionService>(SessionService);

    // Create Manager User
    const managerId = randomUUID();
    await prisma.user.create({
      data: {
        id: managerId,
        email: 'manager_test_e2e@example.com',
        passwordHash: 'hash',
        roles: {
          create: [{ role: { connect: { code: 'assessment_manager' } } }]
        }
      }
    });

    // Create Candidate User
    const candidateId = randomUUID();
    await prisma.user.create({
      data: {
        id: candidateId,
        email: 'candidate_test_e2e@example.com',
        passwordHash: 'hash',
        roles: {
          create: [{ role: { connect: { code: 'candidate' } } }]
        }
      }
    });

    // Create manager session and token
    const managerSession = await sessionService.createSession(managerId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    managerToken = tokenService.signAccessToken(managerId, managerSession.id, ['assessment_manager']).token;

    // Create candidate session and token
    const candidateSession = await sessionService.createSession(candidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    candidateToken = tokenService.signAccessToken(candidateId, candidateSession.id, ['candidate']).token;
  });

  afterAll(async () => {
    await prisma.assessmentQuestionOption.deleteMany({ where: { question: { category: { slug: 'backend-eng-test' } } } });
    await prisma.assessmentQuestion.deleteMany({ where: { category: { slug: 'backend-eng-test' } } });
    await prisma.assessmentCategory.deleteMany({ where: { slug: 'backend-eng-test' } });
    await prisma.userSession.deleteMany({
      where: {
        user: { email: { in: ['manager_test_e2e@example.com', 'candidate_test_e2e@example.com'] } }
      }
    });
    await prisma.userRole.deleteMany({
      where: {
        user: { email: { in: ['manager_test_e2e@example.com', 'candidate_test_e2e@example.com'] } }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['manager_test_e2e@example.com', 'candidate_test_e2e@example.com'] }
      }
    });
    await app.close();
  });

  describe('Category Management', () => {
    it('/v1/manage/assessments/categories (POST) - should create category', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/manage/assessments/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Backend Engineering Test',
          slug: 'backend-eng-test',
          description: 'Test category'
        })
        .expect(201);
      
      expect(res.body.name).toBe('Backend Engineering Test');
      expect(res.body.slug).toBe('backend-eng-test');
      categoryId = res.body.id;
    });

    it('/v1/manage/assessments/categories (POST) - should block non-manager', async () => {
      await request(app.getHttpServer())
        .post('/v1/manage/assessments/categories')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          name: 'Unauthorized',
          slug: 'unauth'
        })
        .expect(403);
    });

    it('/v1/manage/assessments/categories (GET) - should list categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/manage/assessments/categories')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].slug).toBeDefined();
    });
  });

  describe('Question Management', () => {
    let questionId: string;

    it('/v1/manage/assessments/questions (POST) - should create question', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/manage/assessments/questions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          categoryId,
          type: 'SINGLE_CHOICE',
          difficulty: 'INTERMEDIATE',
          prompt: 'What is dependency injection?',
          options: [
            { label: 'A design pattern', isCorrect: true, sortOrder: 1 },
            { label: 'A database index', isCorrect: false, sortOrder: 2 }
          ]
        })
        .expect(201);
      
      expect(res.body.prompt).toBe('What is dependency injection?');
      expect(res.body.options).toHaveLength(2);
      expect(res.body.status).toBe('DRAFT');
      questionId = res.body.id;
    });

    it('/v1/manage/assessments/questions/:id (PUT) - should update question', async () => {
      const res = await request(app.getHttpServer())
        .put(`/v1/manage/assessments/questions/${questionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'ACTIVE'
        })
        .expect(200);
      
      expect(res.body.status).toBe('ACTIVE');
    });

    it('/v1/manage/assessments/questions/:id/archive (POST) - should archive question', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/manage/assessments/questions/${questionId}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      
      expect(res.body.status).toBe('ARCHIVED');
    });
  });
});
