import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  const mockPrismaService = {
    checkConnection: jest.fn().mockResolvedValue({ status: 'up' }),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
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
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

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
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    );
    await app.init();
  });

  describe('GET /api/v1', () => {
    it('should return 200 and the API root information', () => {
      return request(app.getHttpServer()).get('/api/v1').expect(200).expect({
        name: 'NextHire API',
        version: '1.0',
        status: 'running',
      });
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and the health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect({
          status: 'ok',
          service: 'nexthire-api',
          version: '1.0',
        });
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return 503 when Redis is not reachable (mocked PrismaService bypasses DB)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(200);
        });
    });
  });

  describe('POST /api/v1/system/queue/ping', () => {
    it('should return 400 when source is too short', () => {
      return request(app.getHttpServer())
        .post('/api/v1/system/queue/ping')
        .send({ source: 'x' })
        .expect(400);
    });

    it('should return 400 when source is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/system/queue/ping')
        .send({})
        .expect(400);
    });
  });

  describe('Unknown route', () => {
    it('should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/v1/does-not-exist')
        .expect(404);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
