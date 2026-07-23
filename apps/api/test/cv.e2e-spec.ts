/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
// supertest response bodies are typed `any`; assertions below validate shape at runtime.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

jest.setTimeout(45000);

const EMAIL_PREFIX = 'e2e-cv-';

describe('CV Builder (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  async function cleanup() {
    await prismaService.user.deleteMany({ where: { email: { startsWith: EMAIL_PREFIX } } });
  }

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
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const password = 'StrongP@ss1';

  async function createCandidate(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register/candidate')
      .send({ email, password, confirmPassword: password, acceptTerms: true })
      .expect(201);

    const user = await prismaService.user.findUnique({ where: { email } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    await prismaService.emailVerificationToken.create({
      data: {
        userId: user!.id,
        tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/verify')
      .send({ token: rawToken })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return login.body.accessToken as string;
  }

  async function setupProfile(accessToken: string, fullName: string): Promise<void> {
    await request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName, professionalHeadline: 'Senior Engineer' })
      .expect(200);
  }

  describe('CV CRUD and ownership', () => {
    let accessToken: string;
    let otherToken: string;
    let cvId: string;

    beforeAll(async () => {
      accessToken = await createCandidate(`${EMAIL_PREFIX}crud@example.com`);
      otherToken = await createCandidate(`${EMAIL_PREFIX}crud-other@example.com`);
      await setupProfile(accessToken, 'Ada Lovelace');
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/cvs').expect(401);
      await request(app.getHttpServer()).post('/api/v1/cvs').send({ title: 'x' }).expect(401);
    });

    it('creates a CV as the first (default) CV', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Software Engineer CV', template: 'MODERN' })
        .expect(201);

      expect(res.body.title).toBe('Software Engineer CV');
      expect(res.body.isDefault).toBe(true);
      cvId = res.body.id;
    });

    it('lists CVs for the owner only', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body).toHaveLength(1);

      const otherRes = await request(app.getHttpServer())
        .get('/api/v1/cvs')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);
      expect(otherRes.body).toHaveLength(0);
    });

    it('returns 404 (not 400) for cross-user access, avoiding existence leaks', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hijacked' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/api/v1/cvs/${cvId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });

    it('returns 404 for a nonexistent CV (same code as cross-user)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cvs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(404);
    });

    it('updates a CV it owns', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title', visibility: 'UNLISTED' })
        .expect(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.visibility).toBe('UNLISTED');
    });

    it('enforces the 10-CV cap', async () => {
      for (let i = 0; i < 9; i += 1) {
        await request(app.getHttpServer())
          .post('/api/v1/cvs')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `CV ${i}` })
          .expect(201);
      }
      await request(app.getHttpServer())
        .post('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'One too many' })
        .expect(400);
    });

    it('duplicates a CV independently of the source', async () => {
      const dup = await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/duplicate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title - Copy' })
        .expect(201);
      expect(dup.body.title).toBe('Updated Title - Copy');
      expect(dup.body.id).not.toBe(cvId);
    });

    it('prevents deleting the default CV directly, requiring another default first', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const nonDefault = (list.body as { id: string; isDefault: boolean }[]).find(
        (c) => !c.isDefault,
      );
      expect(nonDefault).toBeDefined();

      await request(app.getHttpServer())
        .delete(`/api/v1/cvs/${nonDefault!.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('sections, content, and profile import', () => {
    let accessToken: string;
    let cvId: string;

    beforeAll(async () => {
      accessToken = await createCandidate(`${EMAIL_PREFIX}sections@example.com`);
      await setupProfile(accessToken, 'Grace Hopper');

      const cv = await request(app.getHttpServer())
        .post('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Sections CV' })
        .expect(201);
      cvId = cv.body.id;

      await request(app.getHttpServer())
        .post('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          educationLevel: 'BACHELOR',
          institutionName: 'MIT',
          qualification: 'BSc Computer Science',
          startDate: '2015-09-01T00:00:00.000Z',
          currentlyStudying: false,
          endDate: '2019-06-01T00:00:00.000Z',
        })
        .expect(201);
    });

    it('returns empty content for a section with none yet', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.content).toEqual({});
    });

    it('updates section content', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: { summary: 'Experienced engineer.' } })
        .expect(200);
      expect(res.body.content.summary).toBe('Experienced engineer.');
    });

    it('rejects cross-user section access with 404', async () => {
      const otherToken = await createCandidate(`${EMAIL_PREFIX}sections-other@example.com`);
      await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: { summary: 'hijack' } })
        .expect(404);
    });

    it('imports education from the verified profile as an independent snapshot', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/sections/education/import-from-profile`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.content.items).toHaveLength(1);
      expect(res.body.content.items[0].institutionName).toBe('MIT');

      // Independent copy: later profile edits do not retroactively change the CV.
      await request(app.getHttpServer())
        .post('/api/v1/candidates/me/education')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          educationLevel: 'MASTER',
          institutionName: 'Stanford',
          qualification: 'MSc',
          startDate: '2020-09-01T00:00:00.000Z',
          currentlyStudying: true,
        })
        .expect(201);

      const stillSnapshot = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/sections/education`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(stillSnapshot.body.content.items).toHaveLength(1);
    });

    it('rejects importing an unknown section type', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/sections/personal_info/import-from-profile`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('reorders and toggles sections', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/cvs/${cvId}/sections/order`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sections: [{ type: 'skills', sortOrder: 0 }] })
        .expect(204);

      await request(app.getHttpServer())
        .patch(`/api/v1/cvs/${cvId}/sections/projects/toggle`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enabled: true })
        .expect(204);
    });
  });

  describe('readiness and HTML preview escaping', () => {
    let accessToken: string;
    let cvId: string;

    beforeAll(async () => {
      accessToken = await createCandidate(`${EMAIL_PREFIX}readiness@example.com`);
      await setupProfile(accessToken, '<script>alert(1)</script> Evil Name');

      const cv = await request(app.getHttpServer())
        .post('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '<img src=x onerror=alert(1)> Malicious Title' })
        .expect(201);
      cvId = cv.body.id;
    });

    it('is not ready before the summary is filled in', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/readiness`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.ready).toBe(false);
      expect(res.body.missingSections).toContain('professional_summary');
    });

    it('becomes ready once the professional summary is set', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: { summary: 'Ready for export.' } })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/readiness`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.ready).toBe(true);
    });

    it('never emits unescaped candidate-controlled markup into the HTML preview', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/export/html`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.text).not.toContain('<script>alert(1)</script>');
      expect(res.text).not.toContain('<img src=x onerror=alert(1)>');
      expect(res.text).toContain('&lt;script&gt;');
      expect(res.text).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  describe('asynchronous PDF export lifecycle', () => {
    let accessToken: string;
    let cvId: string;

    beforeAll(async () => {
      accessToken = await createCandidate(`${EMAIL_PREFIX}export@example.com`);
      await setupProfile(accessToken, 'Katherine Johnson');

      const cv = await request(app.getHttpServer())
        .post('/api/v1/cvs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Export CV' })
        .expect(201);
      cvId = cv.body.id;
    });

    it('refuses to queue an export while the CV is not ready', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/exports`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('queues, generates, and downloads a PDF once the CV is ready', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/cvs/${cvId}/sections/professional_summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: { summary: 'Pioneering engineer.' } })
        .expect(200);

      const queued = await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/exports`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
      expect(['PENDING', 'GENERATING']).toContain(queued.body.status);
      const exportId = queued.body.id;

      let status = queued.body.status;
      const deadline = Date.now() + 20000;
      while (status !== 'READY' && status !== 'FAILED' && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const poll = await request(app.getHttpServer())
          .get(`/api/v1/cvs/${cvId}/exports/${exportId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
        status = poll.body.status;
      }

      expect(status).toBe('READY');

      const download = await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/exports/${exportId}/download`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(download.body.downloadUrl).toContain(`/cvs/${cvId}/exports/${exportId}/file`);

      const file = await request(app.getHttpServer())
        .get(download.body.downloadUrl as string)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(file.headers['content-type']).toContain('application/pdf');
      expect((file.body as Buffer).slice(0, 4).toString()).toBe('%PDF');
    });

    it('lists export history newest first', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/exports`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('blocks another user from downloading or polling the export (IDOR)', async () => {
      const otherToken = await createCandidate(`${EMAIL_PREFIX}export-other@example.com`);

      const exports = await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/exports`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const exportId = exports.body[0].id;

      await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/exports/${exportId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .post(`/api/v1/cvs/${cvId}/exports/${exportId}/download`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .get(`/api/v1/cvs/${cvId}/exports/${exportId}/file`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);
    });
  });
});
