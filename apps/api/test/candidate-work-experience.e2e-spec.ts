import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateWorkExperienceController (e2e)', () => {
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

    // Clean up specific test data
    await prisma.workExperienceRecord.deleteMany({ where: { user: { email: { startsWith: 'test-exp' } } } });
    await prisma.userSession.deleteMany({ where: { user: { email: { startsWith: 'test-exp' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-exp' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-exp' } } });

    // Get or Create Candidate Role
    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    // Create Candidate User 1
    candidateUser = await prisma.user.create({
      data: {
        email: 'test-exp1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tokenFamily1 = '31111111-1111-1111-1111-111111111111';
    const sessionId1 = '30000000-0000-0000-0000-000000000001';
    await prisma.userSession.create({
      data: {
        id: sessionId1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-exp1-${Date.now()}`,
        tokenFamilyId: tokenFamily1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sessionId1, ['candidate']).token;

    // Create Candidate User 2
    otherUser = await prisma.user.create({
      data: {
        email: 'test-exp2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tokenFamily2 = '32222222-2222-2222-2222-222222222222';
    const sessionId2 = '30000000-0000-0000-0000-000000000002';
    await prisma.userSession.create({
      data: {
        id: sessionId2,
        userId: otherUser.id,
        refreshTokenHash: `hash-exp2-${Date.now()}`,
        tokenFamilyId: tokenFamily2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sessionId2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/candidates/me/experience', () => {
    it('returns 401 if unauthenticated', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/experience')
        .expect(401);
    });

    it('returns empty list for new candidate', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
          expect(res.body.completion.version).toBe('candidate-profile-v4');
        });
    });
  });

  let createdRecordId: string;

  describe('POST /api/v1/candidates/me/experience', () => {
    it('creates a new work experience record', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          companyName: 'Acme Corp',
          jobTitle: 'Software Engineer',
          employmentType: 'FULL_TIME',
          location: 'Dhaka, BD',
          isRemote: false,
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2023-01-01T00:00:00.000Z',
          currentlyWorking: false,
          responsibilities: 'Built scalable systems',
          achievements: 'Led team of 5',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.companyName).toBe('Acme Corp');
          expect(res.body.record.jobTitle).toBe('Software Engineer');
          expect(res.body.completion.percentage).toBeGreaterThan(0);
          createdRecordId = res.body.record.id;
        });
    });

    it('rejects future start date', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          companyName: 'Future Corp',
          jobTitle: 'Engineer',
          employmentType: 'FULL_TIME',
          isRemote: false,
          startDate: '2050-01-01T00:00:00.000Z',
          currentlyWorking: true,
        })
        .expect(400);
    });

    it('rejects missing end date when not currently working', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          companyName: 'Past Corp',
          jobTitle: 'Engineer',
          employmentType: 'FULL_TIME',
          isRemote: false,
          startDate: '2020-01-01T00:00:00.000Z',
          currentlyWorking: false,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/experience/:id', () => {
    it('updates an existing record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/experience/${createdRecordId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ jobTitle: 'Senior Software Engineer' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.jobTitle).toBe('Senior Software Engineer');
        });
    });

    it('prevents updating another users record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/experience/${createdRecordId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ jobTitle: 'Hacker' })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/experience/reorder', () => {
    let secondRecordId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          companyName: 'Beta Corp',
          jobTitle: 'Lead Developer',
          employmentType: 'CONTRACT',
          isRemote: true,
          startDate: '2023-06-01T00:00:00.000Z',
          currentlyWorking: true,
        });
      secondRecordId = res.body.record.id;
    });

    it('reorders records successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/experience/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ orderedIds: [secondRecordId, createdRecordId] })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/experience')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondRecordId);
      expect(listRes.body.records[1].id).toBe(createdRecordId);
    });
  });

  describe('DELETE /api/v1/candidates/me/experience/:id', () => {
    it('prevents deleting another users record', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/experience/${createdRecordId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own record and returns 204', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/experience/${createdRecordId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });
  });
});
