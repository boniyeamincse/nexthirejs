import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateSkillsController (e2e)', () => {
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

    await prisma.candidateSkill.deleteMany({
      where: { user: { email: { startsWith: 'test-skill' } } },
    });
    await prisma.userSession.deleteMany({
      where: { user: { email: { startsWith: 'test-skill' } } },
    });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-skill' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-skill' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-skill1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = '33333333-3333-3333-3333-333333333333';
    const sid1 = '30000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-skill1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-skill2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = '44444444-4444-4444-4444-444444444444';
    const sid2 = '40000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-skill2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/candidates/me/skills', () => {
    it('returns empty list when no skills exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 when unauthenticated', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/skills').expect(401);
    });
  });

  let skillId: string;

  describe('POST /api/v1/candidates/me/skills', () => {
    it('creates a new skill', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'TypeScript', level: 'ADVANCED', yearsOfExperience: 5 })
        .expect(201)
        .expect((res) => {
          expect(res.body.record).toBeDefined();
          expect(res.body.record.name).toBe('TypeScript');
          expect(res.body.record.level).toBe('ADVANCED');
          expect(res.body.completion.percentage).toBeDefined();
          skillId = res.body.record.id;
        });
    });

    it('rejects duplicate skill case-insensitively', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'typescript', level: 'INTERMEDIATE' })
        .expect(400);
    });

    it('rejects invalid skill level', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'Python', level: 'INVALID' })
        .expect(400);
    });

    it('rejects negative years of experience', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'Python', level: 'INTERMEDIATE', yearsOfExperience: -1 })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/skills/:id', () => {
    it('updates own skill', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/skills/${skillId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ level: 'EXPERT' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.level).toBe('EXPERT');
        });
    });

    it('prevents updating another user skill', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/skills/${skillId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ level: 'BEGINNER' })
        .expect(404);
    });
  });

  describe('PUT /api/v1/candidates/me/skills/reorder', () => {
    let secondSkillId: string;
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ name: 'Python', level: 'INTERMEDIATE' });
      secondSkillId = res.body.record.id;
    });

    it('reorders skills successfully', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/skills/reorder')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ orderedIds: [secondSkillId, skillId] })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);

      expect(listRes.body.records[0].id).toBe(secondSkillId);
      expect(listRes.body.records[1].id).toBe(skillId);
    });
  });

  describe('DELETE /api/v1/candidates/me/skills/:id', () => {
    it('prevents deleting another user skill', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/skills/${skillId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(404);
    });

    it('deletes own skill', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/skills/${skillId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('deleted skill no longer appears', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/skills')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200);
      expect(res.body.records.find((r: any) => r.id === skillId)).toBeUndefined();
    });
  });
});
