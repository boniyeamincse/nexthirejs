import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { SessionService } from '../src/modules/auth/session.service';
import { randomUUID, createHash } from 'crypto';

describe('Assessment Retakes and Certificates (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let sessionService: SessionService;

  let managerToken: string;
  let candidateToken: string;
  let otherCandidateToken: string;
  let suspendedCandidateToken: string;

  const testSlug = `rc-e2e-${randomUUID().slice(0, 8)}`;
  let assessmentId: string;
  let categoryId: string;
  let managerId: string;
  let candidateId: string;
  let otherCandidateId: string;
  let suspendedCandidateId: string;

  const base = '/v1';

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

    managerId = randomUUID();
    candidateId = randomUUID();
    otherCandidateId = randomUUID();
    suspendedCandidateId = randomUUID();

    await prisma.role.upsert({ where: { code: 'assessment_publish' }, update: {}, create: { code: 'assessment_publish', name: 'Assessment Publisher' } });
    await prisma.role.upsert({ where: { code: 'assessment_manager' }, update: {}, create: { code: 'assessment_manager', name: 'Assessment Manager' } });
    await prisma.role.upsert({ where: { code: 'candidate' }, update: {}, create: { code: 'candidate', name: 'Candidate' } });

    await prisma.user.create({ data: { id: managerId, email: `mgr_rc_${testSlug}@example.com`, passwordHash: 'hash', status: 'ACTIVE', roles: { create: [{ role: { connect: { code: 'assessment_manager' } } }, { role: { connect: { code: 'assessment_publish' } } }] } } });
    await prisma.user.create({ data: { id: candidateId, email: `can_rc_${testSlug}@example.com`, passwordHash: 'hash', status: 'ACTIVE', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: otherCandidateId, email: `oth_rc_${testSlug}@example.com`, passwordHash: 'hash', status: 'ACTIVE', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: suspendedCandidateId, email: `sus_rc_${testSlug}@example.com`, passwordHash: 'hash', status: 'SUSPENDED', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });

    await prisma.candidateProfile.createMany({
      data: [
        { userId: candidateId, fullName: 'Retake Test Candidate' },
        { userId: otherCandidateId, fullName: 'Other Candidate' },
      ],
    });

    const managerSession = await sessionService.createSession(managerId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    managerToken = tokenService.signAccessToken(managerId, managerSession.id, ['assessment_manager', 'assessment_publish']).token;
    const candidateSession = await sessionService.createSession(candidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    candidateToken = tokenService.signAccessToken(candidateId, candidateSession.id, ['candidate']).token;
    const otherCandidateSession = await sessionService.createSession(otherCandidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    otherCandidateToken = tokenService.signAccessToken(otherCandidateId, otherCandidateSession.id, ['candidate']).token;
    const suspendedCandidateSession = await sessionService.createSession(suspendedCandidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    suspendedCandidateToken = tokenService.signAccessToken(suspendedCandidateId, suspendedCandidateSession.id, ['candidate']).token;

    // Create category
    const cat = await prisma.assessmentCategory.create({ data: { name: `RC Cat ${testSlug}`, slug: `${testSlug}-cat` } });
    categoryId = cat.id;

    // Create assessment with retake enabled
    const assessment = await prisma.assessment.create({
      data: {
        categoryId, title: 'RC Assessment', slug: testSlug, shortDescription: 'desc',
        instructions: 'Read carefully.',
        type: 'CERTIFICATION', difficulty: 'INTERMEDIATE', status: 'PUBLISHED',
        visibility: 'CANDIDATE_CATALOG', availability: 'AVAILABLE',
        estimatedDurationMinutes: 60, passingScorePercentage: 60,
        publicationVersion: 1, totalPoints: 10, questionCount: 1,
        retakeEnabled: true,
        maximumAttempts: 3,
        retakeCooldownHours: 0,
        certificateEnabled: true,
        certificateValidityDays: 365,
      },
    });
    assessmentId = assessment.id;

    // Create section and question so the assessment is "ready" for attempts
    const section = await prisma.assessmentSection.create({
      data: { assessmentId, title: 'Section 1', sortOrder: 1 },
    });
    const question = await prisma.assessmentQuestion.create({
      data: {
        categoryId, type: 'SHORT_TEXT', difficulty: 'INTERMEDIATE', status: 'ACTIVE',
        prompt: 'What is 2+2?', acceptedAnswers: ['4'],
        estimatedSeconds: 30,
      },
    });
    await prisma.assessmentQuestionAssignment.create({
      data: { assessmentId, sectionId: section.id, questionId: question.id, points: 10, sortOrder: 1 },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.assessmentCertificate.deleteMany({ where: { assessmentId } });
    await prisma.assessmentAttemptAnswer.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttemptQuestionOption.deleteMany({ where: { question: { attempt: { assessmentId } } } });
    await prisma.assessmentAttemptQuestion.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttemptSection.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttempt.deleteMany({ where: { assessmentId } });
    await prisma.assessmentQuestionAssignment.deleteMany({ where: { section: { assessmentId } } });
    await prisma.assessmentSection.deleteMany({ where: { assessmentId } });
    await prisma.assessmentQuestion.deleteMany({ where: { categoryId } });
    await prisma.assessment.deleteMany({ where: { id: assessmentId } });
    await prisma.assessmentCategory.deleteMany({ where: { id: categoryId } });
    await prisma.candidateProfile.deleteMany({ where: { userId: { in: [candidateId, otherCandidateId] } } });
    await prisma.userSession.deleteMany({ where: { user: { email: { contains: testSlug } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { contains: testSlug } } } });
    await prisma.user.deleteMany({ where: { email: { contains: testSlug } } });
    await app.close();
  });

  // --- Retake Eligibility ---

  it('GET retake-eligibility - unauthenticated returns 401', async () => {
    await request(app.getHttpServer())
      .get(`${base}/assessments/${testSlug}/retake-eligibility`)
      .expect(401);
  });

  it('GET retake-eligibility - non-candidate returns 403', async () => {
    await request(app.getHttpServer())
      .get(`${base}/assessments/${testSlug}/retake-eligibility`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(403);
  });

  it('GET retake-eligibility - first attempt available for new candidate', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/assessments/${testSlug}/retake-eligibility`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.eligible).toBe(true);
    expect(res.body.reason).toBe('FIRST_ATTEMPT_AVAILABLE');
    expect(res.body.attemptsUsed).toBe(0);
    expect(res.body.maximumAttempts).toBe(3);
    expect(res.body.attemptsRemaining).toBe(3);
  });

  let attemptIdForRetake: string;

  it('GET retake-eligibility - active attempt blocks retake', async () => {
    // Start an attempt
    const startRes = await request(app.getHttpServer())
      .post(`${base}/assessments/${testSlug}/attempts`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    attemptIdForRetake = startRes.body.attemptId;

    // Check eligibility should show active attempt
    const res = await request(app.getHttpServer())
      .get(`${base}/assessments/${testSlug}/retake-eligibility`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.eligible).toBe(false);
    expect(res.body.reason).toBe('ACTIVE_ATTEMPT_EXISTS');

    // Cancel the active attempt so we can proceed
    await prisma.assessmentAttempt.update({
      where: { id: attemptIdForRetake },
      data: { status: 'CANCELLED' },
    });
  });

  // --- Retake Policy Management ---

  it('PUT retake-certificate-policy - updates policy', async () => {
    const res = await request(app.getHttpServer())
      .put(`${base}/manage/assessments/${assessmentId}/retake-certificate-policy`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        retakeEnabled: true,
        maximumAttempts: 5,
        retakeCooldownHours: 48,
        certificateEnabled: true,
        certificateValidityDays: 730,
      })
      .expect(200);

    expect(res.body.retakeEnabled).toBe(true);
    expect(res.body.maximumAttempts).toBe(5);
    expect(res.body.retakeCooldownHours).toBe(48);
    expect(res.body.certificateEnabled).toBe(true);
    expect(res.body.certificateValidityDays).toBe(730);
  });

  it('PUT retake-certificate-policy - non-manager returns 403', async () => {
    await request(app.getHttpServer())
      .put(`${base}/manage/assessments/${assessmentId}/retake-certificate-policy`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ retakeEnabled: true })
      .expect(403);
  });

  // --- Certificate API ---

  it('GET my certificates - returns empty list', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/candidates/me/certificates`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.items).toEqual([]);
    expect(res.body.pagination.totalItems).toBe(0);
  });

  it('GET my certificates - unauthenticated returns 401', async () => {
    await request(app.getHttpServer())
      .get(`${base}/candidates/me/certificates`)
      .expect(401);
  });

  it('POST download - non-ready certificate returns 409', async () => {
    // Create a real attempt first so the FK constraint works
    const now = new Date();
    // Use attemptNumber: 2 since the retake test creates attempt 1 (then cancels it)
    const realAttempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId, candidateId, attemptNumber: 2,
        status: 'SUBMITTED',
        assessmentPublicationVersion: 1,
        assessmentTitleSnapshot: 'RC Assessment',
        assessmentSlugSnapshot: testSlug,
        durationMinutesSnapshot: 60,
        passingScoreSnapshot: 60,
        totalPointsSnapshot: 10,
        questionCountSnapshot: 1,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + 3600000),
        submittedAt: now,
      },
    });

    // Create a pending certificate referencing the real attempt
    const cert = await prisma.assessmentCertificate.create({
      data: {
        candidateId,
        assessmentId,
        attemptId: realAttempt.id,
        certificateNumber: `TEST-${randomUUID().slice(0, 8)}`,
        verificationCodeHash: createHash('sha256').update(randomUUID()).digest('hex'),
        verificationCodeHint: 'test...',
        status: 'PENDING',
        holderNameSnapshot: 'Test Holder',
        assessmentTitleSnapshot: 'RC Assessment',
        assessmentSlugSnapshot: testSlug,
        scorePercentageSnapshot: 85,
      },
    });

    await request(app.getHttpServer())
      .post(`${base}/candidates/me/certificates/${cert.id}/download`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(409);

    await prisma.assessmentCertificate.delete({ where: { id: cert.id } });
    await prisma.assessmentAttempt.delete({ where: { id: realAttempt.id } });
  });

  // --- Public Verification ---

  it('GET verify - invalid code returns not found', async () => {
    const res = await request(app.getHttpServer())
      .get(`${base}/public/certificates/verify/invalidcode123`)
      .expect(200);

    expect(res.body.valid).toBe(false);
    expect(res.body.status).toBe('NOT_FOUND');
  });
});
