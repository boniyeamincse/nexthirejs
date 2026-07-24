import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Route + guard coverage for the company profile / application / review APIs
 * (NH-M19). Asserts authentication boundaries without requiring seeded
 * authenticated state, matching the project's e2e smoke-test style. Bootstrap
 * mirrors `main.ts` exactly (global prefix + URI versioning) — see
 * experts.e2e-spec.ts for the historical bug this convention guards against.
 */
describe('Companies (e2e)', () => {
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
    it('GET /api/v1/companies/me/profile requires auth', () =>
      http().get('/api/v1/companies/me/profile').expect(401));

    it('PUT /api/v1/companies/me/profile requires auth', () =>
      http().put('/api/v1/companies/me/profile').send({}).expect(401));
  });

  describe('application', () => {
    it('GET /api/v1/companies/me/application requires auth', () =>
      http().get('/api/v1/companies/me/application').expect(401));

    it('POST /api/v1/companies/me/application requires auth', () =>
      http().post('/api/v1/companies/me/application').send({}).expect(401));

    it('GET /api/v1/companies/me/application/readiness requires auth', () =>
      http().get('/api/v1/companies/me/application/readiness').expect(401));

    it('POST /api/v1/companies/me/application/submit requires auth', () =>
      http().post('/api/v1/companies/me/application/submit').send({}).expect(401));

    it('POST /api/v1/companies/me/application/withdraw requires auth', () =>
      http().post('/api/v1/companies/me/application/withdraw').send({}).expect(401));
  });

  describe('documents', () => {
    it('GET documents requires auth', () =>
      http().get('/api/v1/companies/me/application/documents').expect(401));

    it('POST documents requires auth', () =>
      http().post('/api/v1/companies/me/application/documents').expect(401));

    it('DELETE document requires auth', () =>
      http().delete('/api/v1/companies/me/application/documents/some-id').expect(401));
  });

  describe('admin review', () => {
    it('GET queue requires auth', () =>
      http().get('/api/v1/manage/companies/applications').expect(401));

    it('GET application detail requires auth', () =>
      http().get('/api/v1/manage/companies/applications/app-1').expect(401));

    it('POST start-review requires auth', () =>
      http().post('/api/v1/manage/companies/applications/app-1/start-review').send({}).expect(401));

    it('POST approve requires auth', () =>
      http().post('/api/v1/manage/companies/applications/app-1/approve').send({}).expect(401));

    it('POST reject requires auth', () =>
      http().post('/api/v1/manage/companies/applications/app-1/reject').send({}).expect(401));

    it('POST request-changes requires auth', () =>
      http()
        .post('/api/v1/manage/companies/applications/app-1/request-changes')
        .send({})
        .expect(401));

    it('GET signed document endpoint requires auth', () =>
      http().get('/api/v1/manage/companies/documents?key=x&expires=1&signature=y').expect(401));
  });

  describe('team (NH-M20)', () => {
    it('GET my role requires auth', () => http().get('/api/v1/companies/me/team/role').expect(401));

    it('GET team roster requires auth', () => http().get('/api/v1/companies/me/team').expect(401));

    it('PATCH member role requires auth', () =>
      http().patch('/api/v1/companies/me/team/members/some-id').send({}).expect(401));

    it('DELETE member requires auth', () =>
      http().delete('/api/v1/companies/me/team/members/some-id').expect(401));

    it('GET invitations requires auth', () =>
      http().get('/api/v1/companies/me/team/invitations').expect(401));

    it('POST invitation requires auth', () =>
      http().post('/api/v1/companies/me/team/invitations').send({}).expect(401));

    it('DELETE invitation requires auth', () =>
      http().delete('/api/v1/companies/me/team/invitations/some-id').expect(401));
  });

  describe('invitations addressed to me (NH-M20)', () => {
    it('GET my invitations requires auth', () =>
      http().get('/api/v1/companies/invitations/me').expect(401));

    it('POST accept requires auth', () =>
      http().post('/api/v1/companies/invitations/some-id/accept').send({}).expect(401));

    it('POST decline requires auth', () =>
      http().post('/api/v1/companies/invitations/some-id/decline').send({}).expect(401));
  });
});
