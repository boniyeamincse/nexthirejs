import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import cookieParser from 'cookie-parser';

describe('CandidateProfessionalLinksController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;

  let candidateUser: any;
  let candidateAccessToken: string;

  let otherUser: any;
  let otherAccessToken: string;

  let linkId: string;

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

    await prisma.candidateProfessionalLink.deleteMany({ where: { user: { email: { startsWith: 'test-link' } } } });
    await prisma.userSession.deleteMany({ where: { user: { email: { startsWith: 'test-link' } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: 'test-link' } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-link' } } });

    const candidateRole = await prisma.role.upsert({
      where: { code: 'candidate' },
      update: {},
      create: { code: 'candidate', name: 'Candidate' },
    });

    candidateUser = await prisma.user.create({
      data: {
        email: 'test-link1@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf1 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const sid1 = 'c0000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid1,
        userId: candidateUser.id,
        refreshTokenHash: `hash-link1-${Date.now()}`,
        tokenFamilyId: tf1,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    candidateAccessToken = tokenService.signAccessToken(candidateUser.id, sid1, ['candidate']).token;

    otherUser = await prisma.user.create({
      data: {
        email: 'test-link2@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
        roles: { create: { roleId: candidateRole.id } },
      },
    });

    const tf2 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const sid2 = 'd0000000-0000-0000-0000-000000000000';
    await prisma.userSession.create({
      data: {
        id: sid2,
        userId: otherUser.id,
        refreshTokenHash: `hash-link2-${Date.now()}`,
        tokenFamilyId: tf2,
        expiresAt: new Date(Date.now() + 1000000),
      },
    });

    otherAccessToken = tokenService.signAccessToken(otherUser.id, sid2, ['candidate']).token;
  });

  afterAll(async () => {
    await app.close();
  }, 30000);

  describe('GET /api/v1/candidates/me/professional-links', () => {
    it('returns empty list when no links exist', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.records).toEqual([]);
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/candidates/me/professional-links')
        .expect(401);
    });
  });

  describe('POST /api/v1/candidates/me/professional-links', () => {
    it('creates a professional link', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ type: 'LINKEDIN', url: 'https://linkedin.com/in/testuser' })
        .expect(201)
        .expect((res) => {
          expect(res.body.record.type).toBe('LINKEDIN');
          expect(res.body.record.url).toContain('linkedin.com');
          expect(res.body.record.id).toBeDefined();
          expect(res.body.completion.percentage).toBeDefined();
          linkId = res.body.record.id;
        });
    });

    it('rejects missing type', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ url: 'https://example.com' })
        .expect(400);
    });

    it('rejects unsafe URL scheme', () => {
      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ type: 'GITHUB', url: 'javascript:alert(1)' })
        .expect(400);
    });

    it('blocks duplicate normalized URL', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ type: 'GITHUB', url: 'https://github.com/testuser' })
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ type: 'GITHUB', url: 'https://GITHUB.com/testuser' })
        .expect(409);
    });
  });

  describe('PUT /api/v1/candidates/me/professional-links/:id', () => {
    it('updates a professional link', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/professional-links/${linkId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ label: 'My LinkedIn', url: 'https://linkedin.com/in/testuser-updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body.record.label).toBe('My LinkedIn');
          expect(res.body.record.url).toContain('testuser-updated');
          expect(res.body.completion.percentage).toBeDefined();
        });
    });

    it('returns 404 for non-existent link', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/candidates/me/professional-links/${crypto.randomUUID()}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .send({ type: 'GITHUB', url: 'https://github.com/test' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/candidates/me/professional-links/:id', () => {
    it('deletes a professional link', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/professional-links/${linkId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(204);
    });

    it('returns 404 for already deleted link', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/candidates/me/professional-links/${linkId}`)
        .set('Authorization', `Bearer ${candidateAccessToken}`)
        .expect(404);
    });
  });

  describe('Cross-user isolation', () => {
    it('prevents other user cross-access', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/professional-links')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);
      expect(res.body.records).toEqual([]);
    });
  });
});
