import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateAchievementsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherUser: any;
  let otherAccessToken: string;

  let achievementId: string;

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

    await prisma.candidateAchievement.deleteMany({
      where: { user: { email: { startsWith: 'test-ach' } } },
    });
    await prisma.userSession.deleteMany({ where: { user: { email: { startsWith: 'test-ach' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-ach' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-ach' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-ach1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const sid1 = 'a0000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-ach1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, [
      'candidate',
    ]).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-ach2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const sid2 = 'b0000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-ach2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  }, 30000);

  describe('GET /api/v1/candidates/me/achievements', () => {
    it('returns empty list when no achievements exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/achievements')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 without auth', () => {
      return request(app.getHttpServer()).get('/api/v1/candidates/me/achievements').expect(401);
    });
  });

  describe('POST /api/v1/candidates/me/achievements', () => {
    it('creates an achievement', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/achievements')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'Employee of the Year',
          issuer: 'Google',
          achievedAt: '2024-06-15T00:00:00.000Z',
          description: 'Awarded for outstanding performance',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.record.title).toBe('Employee of the Year');
          expect(res.body.record.issuer).toBe('Google');
          expect(res.body.record.id).toBeDefined();
          expect(res.body.completion.percentage).toBeDefined();
          achievementId = res.body.record.id;
        });
    });

    it('rejects empty title', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/achievements')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ title: '' })
        .expect(400);
    });

    it('rejects unsafe URL scheme', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/achievements')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({
          title: 'Test Achievement',
          referenceUrl: 'javascript:alert(1)',
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/candidates/me/achievements/:id', () => {
    it('updates an achievement', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ title: 'Updated Achievement', issuer: 'Updated Issuer' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.title).toBe('Updated Achievement');
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 404 for non-existent achievement', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/achievements/${crypto.randomUUID()}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ title: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/candidates/me/achievements/:id', () => {
    it('deletes an achievement', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('returns 404 for already deleted achievement', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(404);
    });
  });

  describe('Cross-user isolation', () => {
    it('prevents other user cross-access', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/achievements')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);
      expect(res.body.records).toEqual([]);
    });
  });
});
