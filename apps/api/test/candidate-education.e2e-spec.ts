import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { EducationLevel } from '@nexthire/types';
import cookieParser from 'cookie-parser';

describe('CandidateEducationController (e2e)', () => {
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
    await prisma.educationRecord.deleteMany({
      where: { user: { email: { startsWith: 'test-edu' } } },
    });
    await prisma.userSession.deleteMany({ where: { user: { email: { startsWith: 'test-edu' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-edu' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-edu' } } });

    // Get or Create Candidate Role
    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: {
        code: 'candidate',
        name: 'Candidate',
      },
    });

    // Create Candidate User 1
    candidateUser = await prisma.user.create({
      data: {
        email: 'test-edu1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: {
          create: { roleId: candidateRole.id },
        },
      },
    });

    const tokenFamily1 = '11111111-1111-1111-1111-111111111111';
    const sessionId1 = '10000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sessionId1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-edu1-${Date.now()}`,
        tokenFamilyId: tokenFamily1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sessionId1, [
      'candidate',
    ]).token;

    // Create Candidate User 2
    otherUser = await prisma.user.create({
      data: {
        email: 'test-edu2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: {
          create: { roleId: candidateRole.id },
        },
      },
    });

    const tokenFamily2 = '22222222-2222-2222-2222-222222222222';
    const sessionId2 = '20000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sessionId2,
        userId: otherUser.id,
        refreshTokenHash: `hash-edu2-${Date.now()}`,
        tokenFamilyId: tokenFamily2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sessionId2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/candidates/me/education', () => {
    it('returns empty list if no records exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });
  });

  let createdRecordId: string;

  describe('POST /api/v1/candidates/me/education', () => {
    it('creates a new education record', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          educationLevel: EducationLevel.BACHELOR,
          institutionName: 'University of Test',
          qualification: 'BSc Computer Science',
          startDate: '2015-09-01T00:00:00.000Z',
          endDate: '2019-05-01T00:00:00.000Z',
          currentlyStudying: false,
          grade: 'A',
          description: 'Graduated with honors',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.institutionName).toBe('University of Test');
          expect(res.body.completion.percentage).toBeGreaterThan(0);
          createdRecordId = res.body.record.id;
        });
    });

    it('rejects future start date', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          educationLevel: EducationLevel.BACHELOR,
          institutionName: 'University of Test',
          qualification: 'BSc Computer Science',
          startDate: '2050-09-01T00:00:00.000Z',
          currentlyStudying: true,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/education/:id', () => {
    it('updates an existing record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/education/${createdRecordId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          grade: 'A+',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.grade).toBe('A+');
        });
    });

    it('prevents updating another users record', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/education/${createdRecordId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({
          grade: 'B',
        })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/education/reorder', () => {
    let secondRecordId: string;
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          educationLevel: EducationLevel.MASTER,
          institutionName: 'Another University',
          qualification: 'MSc Data Science',
          startDate: '2020-09-01T00:00:00.000Z',
          currentlyStudying: true,
        });
      secondRecordId = res.body.record.id;
    });

    it('reorders records successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/education/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          orderedIds: [secondRecordId, createdRecordId],
        })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondRecordId);
      expect(listRes.body.records[1].id).toBe(createdRecordId);
    });
  });

  describe('DELETE /api/v1/candidates/me/education/:id', () => {
    it('prevents deleting another users record', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/education/${createdRecordId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own record successfully', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/education/${createdRecordId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });
  });
});
