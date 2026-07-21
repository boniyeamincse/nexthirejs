import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateLanguagesController (e2e)', () => {
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

    await prisma.candidateLanguage.deleteMany({ where: { user: { email: { startsWith: 'test-lang' } } } });
    await prisma.userSession.deleteMany({ where: { user: { email: { startsWith: 'test-lang' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-lang' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-lang' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-lang1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = '55555555-5555-5555-5555-555555555555';
    const sid1 = '50000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-lang1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, ['candidate']).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-lang2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = '66666666-6666-6666-6666-666666666666';
    const sid2 = '60000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-lang2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/candidates/me/languages', () => {
    it('returns empty list when no languages exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 when unauthenticated', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/languages')
        .expect(401);
    });
  });

  let languageId: string;

  describe('POST /api/v1/candidates/me/languages', () => {
    it('creates a new language', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'English',
          speaking: 'FLUENT',
          reading: 'NATIVE',
          writing: 'PROFESSIONAL',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.name).toBe('English');
          expect(res.body.record.speaking).toBe('FLUENT');
          languageId = res.body.record.id;
        });
    });

    it('rejects duplicate language case-insensitively', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'english',
          speaking: 'BASIC',
          reading: 'BASIC',
          writing: 'BASIC',
        })
        .expect(400);
    });

    it('rejects invalid proficiency value', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Spanish',
          speaking: 'INVALID',
          reading: 'BASIC',
          writing: 'BASIC',
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/languages/:id', () => {
    it('updates own language', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/languages/${languageId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ writing: 'NATIVE' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.writing).toBe('NATIVE');
        });
    });

    it('prevents updating another user language', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/languages/${languageId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ writing: 'BASIC' })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/languages/reorder', () => {
    let secondLanguageId: string;
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          name: 'Spanish',
          speaking: 'BASIC',
          reading: 'CONVERSATIONAL',
          writing: 'BASIC',
        });
      secondLanguageId = res.body.record.id;
    });

    it('reorders languages successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/languages/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ orderedIds: [secondLanguageId, languageId] })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondLanguageId);
      expect(listRes.body.records[1].id).toBe(languageId);
    });
  });

  describe('DELETE /api/v1/candidates/me/languages/:id', () => {
    it('prevents deleting another user language', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/languages/${languageId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own language', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/languages/${languageId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('deleted language no longer appears', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/languages')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);
      expect(res.body.records.find((r: any) => r.id === languageId)).toBeUndefined();
    });
  });
});
