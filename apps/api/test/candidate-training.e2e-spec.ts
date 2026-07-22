import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateTrainingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherUser: any;
  let otherAccessToken: string;

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

    await prisma.candidateTraining.deleteMany({
      where: { user: { email: { startsWith: 'test-train' } } },
    });
    await prisma.candidateCertification.deleteMany({
      where: { user: { email: { startsWith: 'test-train' } } },
    });
    await prisma.userSession.deleteMany({
      where: { user: { email: { startsWith: 'test-train' } } },
    });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-train' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-train' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-train1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = '77777777-7777-7777-7777-777777777777';
    const sid1 = '70000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-train1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-train2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = '88888888-8888-8888-8888-888888888888';
    const sid2 = '80000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-train2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  }, 30000);

  describe('GET /api/v1/candidates/me/training', () => {
    it('returns empty list when no training records exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 when unauthenticated', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/training').expect(401);
    });
  });

  let trainingId: string;

  describe('POST /api/v1/candidates/me/training', () => {
    it('creates a new training record', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'Advanced TypeScript',
          provider: 'Udemy',
          completionDate: new Date('2024-03-01').toISOString(),
          durationHours: 12.5,
          description: 'In-depth TypeScript course covering advanced types and patterns.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.title).toBe('Advanced TypeScript');
          expect(res.body.record.provider).toBe('Udemy');
          expect(res.body.record.durationHours).toBe(12.5);
          expect(res.body.record.description).toBe(
            'In-depth TypeScript course covering advanced types and patterns.',
          );
          expect(res.body.completion.percentage).toBeDefined();
          expect(res.body.completion.version).toBe('candidate-profile-v6');
          trainingId = res.body.record.id;
        });
    });

    it('rejects future completion date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'Future Training',
          provider: 'Test',
          completionDate: futureDate.toISOString(),
        })
        .expect(400);
    });

    it('rejects negative duration', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'Bad Duration',
          provider: 'Test',
          completionDate: new Date().toISOString(),
          durationHours: -1,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/training/:id', () => {
    it('updates own training record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/training/${trainingId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ title: 'Advanced TypeScript Patterns' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.title).toBe('Advanced TypeScript Patterns');
        });
    });

    it('prevents updating another user training record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/training/${trainingId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ title: 'Hacked Title' })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/training/reorder', () => {
    let secondTrainingId: string;
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'React Fundamentals',
          provider: 'Pluralsight',
          completionDate: new Date('2024-02-01').toISOString(),
        });
      secondTrainingId = res.body.record.id;
    });

    it('reorders training records successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/training/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ orderedIds: [secondTrainingId, trainingId] })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondTrainingId);
      expect(listRes.body.records[1].id).toBe(trainingId);
    });
  });

  describe('DELETE /api/v1/candidates/me/training/:id', () => {
    it('prevents deleting another user training record', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/training/${trainingId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own training record', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/training/${trainingId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('deleted training record no longer appears', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/training')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);
      expect(res.body.records.find((r: any) => r.id === trainingId)).toBeUndefined();
    });
  });
});
