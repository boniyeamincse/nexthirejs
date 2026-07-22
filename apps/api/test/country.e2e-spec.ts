import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ConfigurationModule - Countries (e2e)', () => {
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
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/config/countries', () => {
    it('should return 200 and a list of active countries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/config/countries')
        .expect(200);

      expect(response.body).toHaveProperty('countries');
      expect(Array.isArray(response.body.countries)).toBe(true);

      const bd = response.body.countries.find((c: any) => c.code === 'BD');
      expect(bd).toBeDefined();
      expect(bd.name).toBe('Bangladesh');
      expect(bd.phoneCode).toBe('+880');
      expect(bd.defaultCurrency).toBe('BDT');
    });
  });
});
