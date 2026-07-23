import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Route + guard coverage for the expert profile / application / review APIs.
 * These assert authentication and authorization boundaries without requiring
 * seeded authenticated state, matching the project's e2e smoke-test style.
 *
 * Bootstrap must mirror `main.ts` exactly (global prefix + URI versioning) —
 * a prior version of this file omitted both, so it exercised bare `/v1/...`
 * paths that only existed in this artificially under-configured app. That
 * masked a real bug: `expert-application.controller.ts`,
 * `expert-application-admin.controller.ts`, and `expert-profile.controller.ts`
 * hardcoded a literal `v1/` segment in their `@Controller()` path on top of
 * Nest's auto-added version prefix, producing `/api/v1/v1/...` in production
 * while every frontend call targeted `/api/v1/...` — a 404 on every request.
 */
describe('Experts (e2e)', () => {
  let app: INestApplication;

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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('profile', () => {
    it('GET /api/v1/experts/me/profile requires auth', () =>
      http().get('/api/v1/experts/me/profile').expect(401));

    it('PUT /api/v1/experts/me/profile requires auth', () =>
      http().put('/api/v1/experts/me/profile').send({}).expect(401));

    it('PUT /api/v1/experts/me/profile/visibility requires auth', () =>
      http().put('/api/v1/experts/me/profile/visibility').send({}).expect(401));
  });

  describe('public directory', () => {
    it('GET /api/v1/expert/public is reachable without auth', () =>
      http().get('/api/v1/expert/public').expect(200));

    it('GET /api/v1/expert/public/:slug 404s for an unknown slug without auth', () =>
      http().get('/api/v1/expert/public/does-not-exist-00000000').expect(404));

    it('GET /api/v1/expert/public/:slug/reviews 404s for an unknown slug without auth', () =>
      http().get('/api/v1/expert/public/does-not-exist-00000000/reviews').expect(404));
  });

  describe('availability slot preview', () => {
    it('GET /api/v1/expert/availability/slots/preview requires auth', () =>
      http()
        .get('/api/v1/expert/availability/slots/preview?from=2026-08-01&to=2026-08-07')
        .expect(401));
  });

  describe('application', () => {
    it('GET /api/v1/experts/me/application requires auth', () =>
      http().get('/api/v1/experts/me/application').expect(401));

    it('POST /api/v1/experts/me/application requires auth', () =>
      http().post('/api/v1/experts/me/application').send({}).expect(401));

    it('GET /api/v1/experts/me/application/readiness requires auth', () =>
      http().get('/api/v1/experts/me/application/readiness').expect(401));

    it('POST /api/v1/experts/me/application/submit requires auth', () =>
      http().post('/api/v1/experts/me/application/submit').send({}).expect(401));

    it('POST /api/v1/experts/me/application/withdraw requires auth', () =>
      http().post('/api/v1/experts/me/application/withdraw').send({}).expect(401));
  });

  describe('documents', () => {
    it('GET documents requires auth', () =>
      http().get('/api/v1/experts/me/application/documents').expect(401));

    it('POST documents requires auth', () =>
      http().post('/api/v1/experts/me/application/documents').expect(401));

    it('DELETE document requires auth', () =>
      http().delete('/api/v1/experts/me/application/documents/some-id').expect(401));
  });

  describe('bookings (candidate)', () => {
    it('GET /api/v1/candidates/me/bookings requires auth', () =>
      http().get('/api/v1/candidates/me/bookings').expect(401));

    it('POST /api/v1/candidates/me/bookings requires auth', () =>
      http().post('/api/v1/candidates/me/bookings').send({}).expect(401));

    it('POST /api/v1/candidates/me/bookings/:id/confirm requires auth', () =>
      http().post('/api/v1/candidates/me/bookings/some-id/confirm').send({}).expect(401));

    it('DELETE /api/v1/candidates/me/bookings/:id requires auth', () =>
      http().delete('/api/v1/candidates/me/bookings/some-id').expect(401));
  });

  describe('bookings (expert)', () => {
    it('GET /api/v1/expert/bookings requires auth', () =>
      http().get('/api/v1/expert/bookings').expect(401));

    it('PATCH /api/v1/expert/bookings/:id requires auth', () =>
      http().patch('/api/v1/expert/bookings/some-id').send({}).expect(401));
  });

  describe('session evaluation (candidate view / expert submit)', () => {
    it('GET /api/v1/candidates/me/bookings/:id/evaluation requires auth', () =>
      http().get('/api/v1/candidates/me/bookings/some-id/evaluation').expect(401));

    it('GET /api/v1/expert/bookings/:id/evaluation requires auth', () =>
      http().get('/api/v1/expert/bookings/some-id/evaluation').expect(401));

    it('POST /api/v1/expert/bookings/:id/evaluation requires auth', () =>
      http().post('/api/v1/expert/bookings/some-id/evaluation').send({}).expect(401));
  });

  describe('reviews (candidate submit / expert view)', () => {
    it('GET /api/v1/candidates/me/bookings/:id/review requires auth', () =>
      http().get('/api/v1/candidates/me/bookings/some-id/review').expect(401));

    it('POST /api/v1/candidates/me/bookings/:id/review requires auth', () =>
      http().post('/api/v1/candidates/me/bookings/some-id/review').send({}).expect(401));

    it('GET /api/v1/expert/bookings/:id/review requires auth', () =>
      http().get('/api/v1/expert/bookings/some-id/review').expect(401));

    it('GET /api/v1/expert/reviews requires auth', () =>
      http().get('/api/v1/expert/reviews').expect(401));
  });

  describe('review moderation (admin)', () => {
    it('GET /api/v1/manage/experts/reviews requires auth', () =>
      http().get('/api/v1/manage/experts/reviews').expect(401));

    it('POST /api/v1/manage/experts/reviews/:id/hide requires auth', () =>
      http().post('/api/v1/manage/experts/reviews/some-id/hide').send({}).expect(401));

    it('POST /api/v1/manage/experts/reviews/:id/unhide requires auth', () =>
      http().post('/api/v1/manage/experts/reviews/some-id/unhide').send({}).expect(401));
  });

  describe('public service slot preview', () => {
    it('GET /api/v1/expert/public/:slug/services/:serviceId/slots 404s for an unknown slug without auth', () =>
      http()
        .get(
          '/api/v1/expert/public/does-not-exist-00000000/services/00000000-0000-0000-0000-000000000000/slots?from=2026-08-01&to=2026-08-07',
        )
        .expect(404));
  });

  describe('admin review', () => {
    it('GET queue requires auth', () =>
      http().get('/api/v1/manage/experts/applications').expect(401));

    it('GET application detail requires auth', () =>
      http().get('/api/v1/manage/experts/applications/app-1').expect(401));

    it('POST start-review requires auth', () =>
      http().post('/api/v1/manage/experts/applications/app-1/start-review').send({}).expect(401));

    it('POST approve requires auth', () =>
      http().post('/api/v1/manage/experts/applications/app-1/approve').send({}).expect(401));

    it('POST reject requires auth', () =>
      http().post('/api/v1/manage/experts/applications/app-1/reject').send({}).expect(401));

    it('POST request-changes requires auth', () =>
      http()
        .post('/api/v1/manage/experts/applications/app-1/request-changes')
        .send({})
        .expect(401));

    it('GET signed document endpoint requires auth', () =>
      http().get('/api/v1/manage/experts/documents?key=x&expires=1&signature=y').expect(401));
  });
});
