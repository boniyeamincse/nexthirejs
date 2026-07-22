import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Route + guard coverage for the expert profile / application / review APIs.
 * These assert authentication and authorization boundaries without requiring
 * seeded authenticated state, matching the project's e2e smoke-test style.
 */
describe('Experts (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    it('GET /v1/experts/me/profile requires auth', () =>
      http().get('/v1/experts/me/profile').expect(401));

    it('PUT /v1/experts/me/profile requires auth', () =>
      http().put('/v1/experts/me/profile').send({}).expect(401));
  });

  describe('application', () => {
    it('GET /v1/experts/me/application requires auth', () =>
      http().get('/v1/experts/me/application').expect(401));

    it('POST /v1/experts/me/application requires auth', () =>
      http().post('/v1/experts/me/application').send({}).expect(401));

    it('GET /v1/experts/me/application/readiness requires auth', () =>
      http().get('/v1/experts/me/application/readiness').expect(401));

    it('POST /v1/experts/me/application/submit requires auth', () =>
      http().post('/v1/experts/me/application/submit').send({}).expect(401));

    it('POST /v1/experts/me/application/withdraw requires auth', () =>
      http().post('/v1/experts/me/application/withdraw').send({}).expect(401));
  });

  describe('documents', () => {
    it('GET documents requires auth', () =>
      http().get('/v1/experts/me/application/documents').expect(401));

    it('POST documents requires auth', () =>
      http().post('/v1/experts/me/application/documents').expect(401));

    it('DELETE document requires auth', () =>
      http().delete('/v1/experts/me/application/documents/some-id').expect(401));
  });

  describe('admin review', () => {
    it('GET queue requires auth', () => http().get('/v1/manage/experts/applications').expect(401));

    it('GET application detail requires auth', () =>
      http().get('/v1/manage/experts/applications/app-1').expect(401));

    it('POST approve requires auth', () =>
      http().post('/v1/manage/experts/applications/app-1/approve').send({}).expect(401));

    it('POST reject requires auth', () =>
      http().post('/v1/manage/experts/applications/app-1/reject').send({}).expect(401));

    it('POST request-changes requires auth', () =>
      http().post('/v1/manage/experts/applications/app-1/request-changes').send({}).expect(401));

    it('GET signed document endpoint requires auth', () =>
      http().get('/v1/manage/experts/documents?key=x&expires=1&signature=y').expect(401));
  });
});
