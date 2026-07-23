import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('CandidateProfileController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/candidates/me/profile (GET) - unauthorized', () => {
    return request(app.getHttpServer()).get('/api/v1/candidates/me/profile').expect(401);
  });

  it('/api/v1/candidates/me/profile (PUT) - unauthorized', () => {
    return request(app.getHttpServer())
      .put('/api/v1/candidates/me/profile')
      .send({ fullName: 'John Doe' })
      .expect(401);
  });
});
