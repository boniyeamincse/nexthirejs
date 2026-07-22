import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CandidateProfileController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/v1/candidates/me/profile (GET) - unauthorized', () => {
    return request(app.getHttpServer()).get('/v1/candidates/me/profile').expect(401);
  });

  it('/v1/candidates/me/profile (PUT) - unauthorized', () => {
    return request(app.getHttpServer())
      .put('/v1/candidates/me/profile')
      .send({ fullName: 'John Doe' })
      .expect(401);
  });
});
