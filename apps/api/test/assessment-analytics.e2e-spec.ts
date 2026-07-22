import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { SessionService } from '../src/modules/auth/session.service';
import { randomUUID } from 'crypto';

describe('Assessment Analytics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let sessionService: SessionService;

  let managerToken: string;
  let candidateToken: string;
  let otherCandidateToken: string;
  let suspendedCandidateToken: string;

  const testSlug = `analytics-e2e-${randomUUID().slice(0, 8)}`;
  let assessmentId: string;
  let attemptId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    tokenService = app.get<TokenService>(TokenService);
    sessionService = app.get<SessionService>(SessionService);

    const managerId = randomUUID();
    const candidateId = randomUUID();
    const otherCandidateId = randomUUID();
    const suspendedCandidateId = randomUUID();

    await prisma.role.upsert({ where: { code: 'assessment_publish' }, update: {}, create: { code: 'assessment_publish', name: 'Assessment Publisher' } });
    await prisma.role.upsert({ where: { code: 'assessment_manager' }, update: {}, create: { code: 'assessment_manager', name: 'Assessment Manager' } });
    await prisma.role.upsert({ where: { code: 'candidate' }, update: {}, create: { code: 'candidate', name: 'Candidate' } });

    await prisma.user.create({ data: { id: managerId, email: `mgr2_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'assessment_manager' } } }, { role: { connect: { code: 'assessment_publish' } } }] } } });
    await prisma.user.create({ data: { id: candidateId, email: `can2_${testSlug}@example.com`, passwordHash: 'hash', status: 'ACTIVE', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: otherCandidateId, email: `oth2_${testSlug}@example.com`, passwordHash: 'hash', status: 'ACTIVE', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: suspendedCandidateId, email: `sus2_${testSlug}@example.com`, passwordHash: 'hash', status: 'SUSPENDED', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });

    // Setup candidate profile and privacy with leaderboard participation
    await prisma.candidateProfile.create({ data: { userId: candidateId, fullName: 'Analytics Test Candidate' } });
    await prisma.candidateProfile.create({ data: { userId: otherCandidateId, fullName: 'Other Candidate' } });
    await prisma.candidateProfilePrivacy.create({ data: { userId: candidateId, policyVersion: 'v1', leaderboardParticipationEnabled: true, leaderboardDisplayName: 'TestCandidate' } });
    await prisma.candidateProfilePrivacy.create({ data: { userId: otherCandidateId, policyVersion: 'v1', leaderboardParticipationEnabled: true } });

    const managerSession = await sessionService.createSession(managerId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    managerToken = tokenService.signAccessToken(managerId, managerSession.id, ['assessment_manager', 'assessment_publish']).token;
    const candidateSession = await sessionService.createSession(candidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    candidateToken = tokenService.signAccessToken(candidateId, candidateSession.id, ['candidate']).token;
    const otherCandidateSession = await sessionService.createSession(otherCandidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    otherCandidateToken = tokenService.signAccessToken(otherCandidateId, otherCandidateSession.id, ['candidate']).token;
    const suspendedCandidateSession = await sessionService.createSession(suspendedCandidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    suspendedCandidateToken = tokenService.signAccessToken(suspendedCandidateId, suspendedCandidateSession.id, ['candidate']).token;

    // Create category
    const cat = await prisma.assessmentCategory.create({ data: { name: 'Analytics Cat', slug: `${testSlug}-cat` } });
    categoryId = cat.id;

    // Create and publish assessment
    const assessment = await prisma.assessment.create({
      data: {
        categoryId, title: 'Analytics Assessment', slug: testSlug, shortDescription: 'desc',
        type: 'PRACTICE', difficulty: 'INTERMEDIATE', status: 'PUBLISHED',
        visibility: 'CANDIDATE_CATALOG', availability: 'AVAILABLE',
        estimatedDurationMinutes: 30, passingScorePercentage: 60,
        publicationVersion: 1,
      },
    });
    assessmentId = assessment.id;

    // Create attempt for the main candidate
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId, candidateId,
        assessmentPublicationVersion: 1,
        assessmentTitleSnapshot: 'Analytics Assessment', assessmentSlugSnapshot: testSlug,
        durationMinutesSnapshot: 30, passingScoreSnapshot: 60,
        totalPointsSnapshot: 100, questionCountSnapshot: 1,
        status: 'SUBMITTED', finalizationReason: 'CANDIDATE_SUBMITTED',
        scoreEarned: 80, scorePossible: 100, scorePercentage: 80,
        resultStatus: 'PASSED', correctCount: 1, incorrectCount: 0, unansweredCount: 0,
        scoringVersion: 1, scoringCompletedAt: new Date(),
        startedAt: new Date(Date.now() - 3600000), deadlineAt: new Date(Date.now() + 3600000),
        submittedAt: new Date(),
      },
    });
    attemptId = attempt.id;

    // Create attempt for other candidate
    await prisma.assessmentAttempt.create({
      data: {
        assessmentId, candidateId: otherCandidateId,
        assessmentPublicationVersion: 1,
        assessmentTitleSnapshot: 'Analytics Assessment', assessmentSlugSnapshot: testSlug,
        durationMinutesSnapshot: 30, passingScoreSnapshot: 60,
        totalPointsSnapshot: 100, questionCountSnapshot: 1,
        status: 'SUBMITTED', finalizationReason: 'CANDIDATE_SUBMITTED',
        scoreEarned: 90, scorePossible: 100, scorePercentage: 90,
        resultStatus: 'PASSED', correctCount: 1, incorrectCount: 0, unansweredCount: 0,
        scoringVersion: 1, scoringCompletedAt: new Date(),
        startedAt: new Date(Date.now() - 7200000), deadlineAt: new Date(Date.now()),
        submittedAt: new Date(Date.now() - 1800000),
      },
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // --- Performance Report ---

  it('GET /v1/candidates/me/assessment-performance - unauthenticated returns 401', async () => {
    await request(app.getHttpServer())
      .get('/v1/candidates/me/assessment-performance')
      .expect(401);
  });

  it('GET /v1/candidates/me/assessment-performance - non-candidate returns 403', async () => {
    await request(app.getHttpServer())
      .get('/v1/candidates/me/assessment-performance')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });

  it('GET /v1/candidates/me/assessment-performance - active candidate receives own report', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/candidates/me/assessment-performance')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('trend');
    expect(res.body).toHaveProperty('byCategory');
    expect(res.body).toHaveProperty('byType');
    expect(res.body).toHaveProperty('byDifficulty');
    expect(res.body).toHaveProperty('recentActivity');
    expect(res.body.summary.totalFinalizedAttempts).toBe(1);
    expect(res.body.summary.averagePercentage).toBe(80);
  });

  it('GET /v1/candidates/me/assessment-performance - filters work', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/candidates/me/assessment-performance?assessmentType=PRACTICE')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.summary.totalFinalizedAttempts).toBe(1);
  });

  it('GET /v1/candidates/me/assessment-performance - suspended candidate sees empty report', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/candidates/me/assessment-performance')
      .set('Authorization', `Bearer ${suspendedCandidateToken}`)
      .expect(200);

    expect(res.body.summary.totalFinalizedAttempts).toBe(0);
    expect(res.body.trend).toHaveLength(0);
    expect(res.body.byCategory).toHaveLength(0);
    expect(res.body.byType).toHaveLength(0);
    expect(res.body.byDifficulty).toHaveLength(0);
  });

  // --- Leaderboard Settings ---

  it('GET /v1/candidates/me/leaderboard-settings - settings read works', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/candidates/me/leaderboard-settings')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('enabled');
    expect(res.body.enabled).toBe(true);
    expect(res.body.displayName).toBe('TestCandidate');
  });

  it('PUT /v1/candidates/me/leaderboard-settings - settings update works', async () => {
    const res = await request(app.getHttpServer())
      .put('/v1/candidates/me/leaderboard-settings')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ enabled: false })
      .expect(200);

    expect(res.body.enabled).toBe(false);
  });

  it('PUT /v1/candidates/me/leaderboard-settings - re-enable with alias', async () => {
    const res = await request(app.getHttpServer())
      .put('/v1/candidates/me/leaderboard-settings')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ enabled: true, displayName: 'UpdatedAlias' })
      .expect(200);

    expect(res.body.enabled).toBe(true);
    expect(res.body.displayName).toBe('UpdatedAlias');
  });

  // --- Assessment Leaderboard ---

  it('GET /v1/assessment-leaderboards/assessments/:idOrSlug - assessment leaderboard works', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-leaderboards/assessments/${testSlug}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('assessmentTitle');
    expect(res.body).toHaveProperty('entries');
    expect(res.body).toHaveProperty('myRank');
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);
    expect(res.body.myRank.eligible).toBe(true);
  });

  it('GET /v1/assessment-leaderboards/assessments/:idOrSlug - disabled candidate excluded', async () => {
    // First disable participation for the candidate
    await request(app.getHttpServer())
      .put('/v1/candidates/me/leaderboard-settings')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ enabled: false })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-leaderboards/assessments/${testSlug}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    // Candidate should still be able to view but their rank eligibility should be false
    expect(res.body.myRank.eligible).toBe(false);

    // Re-enable
    await request(app.getHttpServer())
      .put('/v1/candidates/me/leaderboard-settings')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ enabled: true, displayName: 'TestCandidate' })
      .expect(200);
  });

  // --- Category Leaderboard ---

  it('GET /v1/assessment-leaderboards/categories/:idOrSlug - category leaderboard works', async () => {
    const catSlug = `${testSlug}-cat`;
    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-leaderboards/categories/${catSlug}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('categoryName');
    expect(res.body).toHaveProperty('entries');
    expect(res.body).toHaveProperty('myRank');
  });

  // --- Private fields absent ---

  it('leaderboard response excludes private fields', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-leaderboards/assessments/${testSlug}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    for (const entry of res.body.entries) {
      expect(entry).not.toHaveProperty('email');
      expect(entry).not.toHaveProperty('phone');
      expect(entry).not.toHaveProperty('candidateId');
      expect(entry).not.toHaveProperty('userId');
      expect(entry).not.toHaveProperty('dateOfBirth');
      expect(entry).toHaveProperty('displayName');
    }
  });
});
