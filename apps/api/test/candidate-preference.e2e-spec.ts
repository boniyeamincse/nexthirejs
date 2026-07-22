import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

describe('CandidatePreferencesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let candidateToken: string;
  let testUserId: string;

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
    prisma = app.get<PrismaService>(PrismaService);
    tokenService = app.get<TokenService>(TokenService);
    await app.init();

    // Create a candidate user for testing
    const candidateRole = await prisma.role.findUnique({ where: { code: 'candidate' } });
    const passwordHash = await argon2.hash('TestPass123!');

    const user = await prisma.user.create({
      data: {
        email: `test-pref-${Date.now()}@example.com`,
        passwordHash,
        status: 'ACTIVE',
        roles: {
          create: {
            roleId: candidateRole!.id,
          },
        },
      },
    });

    testUserId = user.id;

    // Generate token
    const tokenFamilyId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenFamilyId,
        refreshTokenHash: crypto.randomUUID(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const tokenResponse = tokenService.signAccessToken(user.id, sessionId, ['candidate']);
    candidateToken = tokenResponse.token;
  });

  afterAll(async () => {
    await prisma.candidatePreference.deleteMany({ where: { userId: testUserId } });
    await prisma.candidateProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await app.close();
  });

  describe('GET /api/api/v1/candidates/me/preferences', () => {
    it('should return 401 if unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/candidates/me/preferences').expect(401);
    });

    it('should return empty state for candidate without preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/candidates/me/preferences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('preferences', null);
      expect(response.body).toHaveProperty('availableOptions');
      expect(response.body.availableOptions.workModes).toBeDefined();
    });
  });

  describe('PUT /api/api/v1/candidates/me/preferences', () => {
    it('should return 400 for unsupported country', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/candidates/me/preferences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          countryCode: 'XX',
          currentCity: 'Dhaka',
          preferredJobRoles: ['Engineer'],
          preferredWorkModes: ['REMOTE'],
          preferredEmploymentTypes: ['FULL_TIME'],
        })
        .expect(400);
    });

    it('should return 200 on valid upsert and calculate completion correctly', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/preferences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          countryCode: 'BD',
          currentCity: 'Dhaka',
          preferredJobRoles: ['Engineer', 'Developer'],
          preferredWorkModes: ['REMOTE', 'HYBRID'],
          preferredEmploymentTypes: ['FULL_TIME'],
        })
        .expect(200);

      expect(response.body.currentCity).toBe('Dhaka');
      expect(response.body.country.code).toBe('BD');
      expect(response.body.preferredJobRoles).toContain('Engineer');
      expect(response.body.completion.percentage).toBeGreaterThan(0);
      expect(response.body.completion.version).toBe('candidate-profile-v5');

      // Update modifying the same row
      const updateResponse = await request(app.getHttpServer())
        .put('/api/v1/candidates/me/preferences')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          countryCode: 'BD',
          currentCity: 'Chittagong',
          preferredJobRoles: ['Engineer', 'Manager'],
          preferredWorkModes: ['REMOTE'],
          preferredEmploymentTypes: ['FULL_TIME'],
        })
        .expect(200);

      expect(updateResponse.body.currentCity).toBe('Chittagong');
      expect(updateResponse.body.preferredJobRoles).toContain('Manager');
      expect(updateResponse.body.id).toBe(response.body.id);
    });
  });
});
