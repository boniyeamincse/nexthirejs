import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateCertificationsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherUser: any;
  let otherAccessToken: string;

  const today = new Date().toISOString().split('T')[0];

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

    await prisma.candidateCertification.deleteMany({
      where: { user: { email: { startsWith: 'test-cert' } } },
    });
    await prisma.candidateTraining.deleteMany({
      where: { user: { email: { startsWith: 'test-cert' } } },
    });
    await prisma.userSession.deleteMany({
      where: { user: { email: { startsWith: 'test-cert' } } },
    });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-cert' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-cert' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-cert1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = crypto.randomUUID();
    const sid1 = crypto.randomUUID();
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-cert1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-cert2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = crypto.randomUUID();
    const sid2 = crypto.randomUUID();
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-cert2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  }, 30000);

  describe('GET /api/v1/candidates/me/certifications', () => {
    it('returns empty list when no certifications exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 when unauthenticated', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/certifications').expect(401);
    });
  });

  let certificationId: string;

  describe('POST /api/v1/candidates/me/certifications', () => {
    it('creates a new certification', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'AWS Solutions Architect',
          issuer: 'Amazon Web Services',
          issueDate: new Date('2023-06-15').toISOString(),
          doesNotExpire: false,
          expiryDate: new Date('2026-06-15').toISOString(),
          credentialId: 'AWS-12345',
          credentialUrl: 'https://aws.amazon.com/verify/12345',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.name).toBe('AWS Solutions Architect');
          expect(res.body.record.issuer).toBe('Amazon Web Services');
          expect(res.body.record.doesNotExpire).toBe(false);
          expect(res.body.record.credentialId).toBe('AWS-12345');
          expect(res.body.record.credentialUrl).toBe('https://aws.amazon.com/verify/12345');
          expect(res.body.completion.percentage).toBeDefined();
          expect(res.body.completion.version).toBe('candidate-profile-v7');
          certificationId = res.body.record.id;
        });
    });

    it('rejects invalid credential URL', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Invalid URL Cert',
          issuer: 'Test',
          issueDate: new Date().toISOString(),
          doesNotExpire: false,
          credentialUrl: 'not-a-url',
        })
        .expect(400);
    });

    it('rejects future issue date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Future Cert',
          issuer: 'Test',
          issueDate: futureDate.toISOString(),
          doesNotExpire: false,
        })
        .expect(400);
    });

    it('rejects expiry before issue date', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Bad Dates',
          issuer: 'Test',
          issueDate: new Date('2024-01-01').toISOString(),
          doesNotExpire: false,
          expiryDate: new Date('2023-01-01').toISOString(),
        })
        .expect(400);
    });

    it('rejects expiry date when doesNotExpire is true', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Conflicting',
          issuer: 'Test',
          issueDate: new Date().toISOString(),
          doesNotExpire: true,
          expiryDate: new Date('2026-01-01').toISOString(),
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/certifications/:id', () => {
    it('updates own certification', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/certifications/${certificationId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'AWS Solutions Architect Associate' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.name).toBe('AWS Solutions Architect Associate');
        });
    });

    it('prevents updating another user certification', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/certifications/${certificationId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ name: 'Hacked Name' })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/certifications/reorder', () => {
    let secondCertId: string;
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Google Cloud Professional',
          issuer: 'Google Cloud',
          issueDate: new Date('2024-01-01').toISOString(),
          doesNotExpire: true,
        });
      secondCertId = res.body.record.id;
    });

    it('reorders certifications successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/certifications/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ orderedIds: [secondCertId, certificationId] })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondCertId);
      expect(listRes.body.records[1].id).toBe(certificationId);
    });
  });

  describe('DELETE /api/v1/candidates/me/certifications/:id', () => {
    it('prevents deleting another user certification', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/certifications/${certificationId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own certification', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/certifications/${certificationId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('deleted certification no longer appears', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/certifications')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);
      expect(res.body.records.find((r: any) => r.id === certificationId)).toBeUndefined();
    });
  });
});
