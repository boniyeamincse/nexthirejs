import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { TokenService } from '../src/modules/auth/token.service';
import { SessionService } from '../src/modules/auth/session.service';
import { randomUUID } from 'crypto';

describe('Assessment Attempts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let sessionService: SessionService;
  let candidateUserId: string;
  let otherCandidateUserId: string;

  let managerToken: string;
  let candidateToken: string;
  let otherCandidateToken: string;
  let deadlineCandidateEmail: string | null = null;

  const testSlug = `attempt-e2e-${randomUUID().slice(0, 8)}`;
  let assessmentId: string;

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
    candidateUserId = randomUUID();
    otherCandidateUserId = randomUUID();

    // Ensure roles exist
    await prisma.role.upsert({ where: { code: 'assessment_publish' }, update: {}, create: { code: 'assessment_publish', name: 'Assessment Publisher' } });
    await prisma.role.upsert({ where: { code: 'assessment_manager' }, update: {}, create: { code: 'assessment_manager', name: 'Assessment Manager' } });
    await prisma.role.upsert({ where: { code: 'candidate' }, update: {}, create: { code: 'candidate', name: 'Candidate' } });

    await prisma.user.create({ data: { id: managerId, email: `manager_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'assessment_manager' } } }, { role: { connect: { code: 'assessment_publish' } } }] } } });
    await prisma.user.create({ data: { id: candidateUserId, email: `candidate_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: otherCandidateUserId, email: `other_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });

    const managerSession = await sessionService.createSession(managerId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    managerToken = tokenService.signAccessToken(managerId, managerSession.id, ['assessment_manager', 'assessment_publish']).token;

    const candidateSession = await sessionService.createSession(candidateUserId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    candidateToken = tokenService.signAccessToken(candidateUserId, candidateSession.id, ['candidate']).token;

    const otherCandidateSession = await sessionService.createSession(otherCandidateUserId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    otherCandidateToken = tokenService.signAccessToken(otherCandidateUserId, otherCandidateSession.id, ['candidate']).token;

    const base = '/v1';

    // Create category
    const catRes = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/categories`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: `Attempt E2E ${testSlug}`, slug: testSlug, description: 'Test category' })
      .expect(201);
    const categoryId = catRes.body.id;

    // Create questions
    const q1Res = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/questions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ categoryId, type: 'SINGLE_CHOICE', difficulty: 'INTERMEDIATE', prompt: 'Test question 1?', options: [
        { label: 'Option A', isCorrect: true, sortOrder: 1 },
        { label: 'Option B', isCorrect: false, sortOrder: 2 },
      ]}).expect(201);
    const questionId1 = q1Res.body.id;

    const q2Res = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/questions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ categoryId, type: 'MULTIPLE_CHOICE', difficulty: 'BEGINNER', prompt: 'Test question 2?', options: [
        { label: 'Option X', isCorrect: true, sortOrder: 1 },
        { label: 'Option Y', isCorrect: true, sortOrder: 2 },
        { label: 'Option Z', isCorrect: false, sortOrder: 3 },
      ]}).expect(201);
    const questionId2 = q2Res.body.id;

    const q3Res = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/questions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ categoryId, type: 'TRUE_FALSE', difficulty: 'BEGINNER', prompt: 'The earth orbits the sun.', options: [
        { label: 'True', isCorrect: true, sortOrder: 1 },
        { label: 'False', isCorrect: false, sortOrder: 2 },
      ]}).expect(201);
    const questionId3 = q3Res.body.id;

    const q4Res = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/questions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ categoryId, type: 'SHORT_TEXT', difficulty: 'BEGINNER', prompt: 'Type the word "banana".', acceptedAnswers: ['banana'] }).expect(201);
    const questionId4 = q4Res.body.id;

    // Activate questions
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId1}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId2}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId3}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId4}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);

    // Create assessment
    const asmRes = await request(app.getHttpServer())
      .post(`${base}/manage/assessments`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ categoryId, title: `Attempt Test ${testSlug}`, slug: `${testSlug}-asm`, shortDescription: 'Test assessment for attempt e2e', description: 'A test assessment', instructions: 'Read each question carefully.', type: 'PRACTICE', difficulty: 'INTERMEDIATE', estimatedDurationMinutes: 60, passingScorePercentage: 70, visibility: 'CANDIDATE_CATALOG', availability: 'AVAILABLE' })
      .expect(201);
    assessmentId = asmRes.body.id;

    // Add section
    const secRes = await request(app.getHttpServer())
      .post(`${base}/manage/assessments/${assessmentId}/sections`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ title: 'Section 1', isRequired: true })
      .expect(201);
    const sectionId = secRes.body.id;

    // Assign questions
    await request(app.getHttpServer()).post(`${base}/manage/assessments/${assessmentId}/questions/assign`).set('Authorization', `Bearer ${managerToken}`).send({ sectionId, questionIds: [questionId1], points: 10, isRequired: true }).expect(204);
    await request(app.getHttpServer()).post(`${base}/manage/assessments/${assessmentId}/questions/assign`).set('Authorization', `Bearer ${managerToken}`).send({ sectionId, questionIds: [questionId2], points: 20, isRequired: true }).expect(204);
    await request(app.getHttpServer()).post(`${base}/manage/assessments/${assessmentId}/questions/assign`).set('Authorization', `Bearer ${managerToken}`).send({ sectionId, questionIds: [questionId3], points: 5, isRequired: true }).expect(204);
    await request(app.getHttpServer()).post(`${base}/manage/assessments/${assessmentId}/questions/assign`).set('Authorization', `Bearer ${managerToken}`).send({ sectionId, questionIds: [questionId4], points: 15, isRequired: true }).expect(204);

    // Publish
    const pubRes = await request(app.getHttpServer()).post(`${base}/manage/assessments/${assessmentId}/publish`).set('Authorization', `Bearer ${managerToken}`);
    if (pubRes.status !== 201) console.log('Publish error:', pubRes.status, JSON.stringify(pubRes.body));
    expect(pubRes.status).toBe(201);
    console.log('Assessment published:', assessmentId);
  });

  afterAll(async () => {
    await prisma.assessmentAttemptAnswer.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttemptQuestionOption.deleteMany({ where: { question: { attempt: { assessmentId } } } });
    await prisma.assessmentAttemptQuestion.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttemptSection.deleteMany({ where: { attempt: { assessmentId } } });
    await prisma.assessmentAttempt.deleteMany({ where: { assessmentId } });
    await prisma.assessmentQuestionAssignment.deleteMany({ where: { section: { assessment: { id: assessmentId } } } });
    await prisma.assessmentSection.deleteMany({ where: { assessmentId } });
    await prisma.assessment.deleteMany({ where: { id: assessmentId } });
    await prisma.assessmentQuestionOption.deleteMany({ where: { question: { category: { slug: testSlug } } } });
    await prisma.assessmentQuestion.deleteMany({ where: { category: { slug: testSlug } } });
    await prisma.assessmentCategory.deleteMany({ where: { slug: testSlug } });
    const userEmails = [
      `manager_${testSlug}@example.com`,
      `candidate_${testSlug}@example.com`,
      `other_${testSlug}@example.com`,
      ...(deadlineCandidateEmail ? [deadlineCandidateEmail] : []),
    ];
    await prisma.userSession.deleteMany({ where: { user: { email: { in: userEmails } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { in: userEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: userEmails } } });
    await app.close();
  });

  it('POST /v1/assessments/:id/attempts - unauthenticated returns 401', async () => {
    await request(app.getHttpServer())
      .post(`/v1/assessments/${assessmentId}/attempts`)
      .expect(401);
  });

  it('POST /v1/assessments/:id/attempts - active candidate starts an attempt', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/assessments/${assessmentId}/attempts`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.attemptId).toBeDefined();
    expect(res.body.created).toBe(true);
    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.deadlineAt).toBeDefined();
  });

  it('POST /v1/assessments/:id/attempts - start is idempotent (returns existing)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/assessments/${assessmentId}/attempts`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.created).toBe(false);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('GET /v1/assessments/:id/attempts/active - returns active attempt', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.attemptId).toBeDefined();
  });

  it('GET /v1/assessment-attempts/:id - workspace returns safe snapshot', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const attemptId = activeRes.body.attemptId;

    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.attempt.id).toBe(attemptId);
    expect(res.body.attempt.title).toBe(`Attempt Test ${testSlug}`);
    expect(res.body.attempt.publicationVersion).toBeDefined();
    expect(res.body.attempt.startedAt).toBeDefined();
    expect(res.body.attempt.deadlineAt).toBeDefined();
    expect(res.body.attempt.serverNow).toBeDefined();
    expect(res.body.attempt.remainingSeconds).toBeDefined();
    expect(res.body.attempt.questionCount).toBe(4);
    expect(res.body.sections).toHaveLength(1);
    expect(res.body.sections[0].questions).toHaveLength(4);
    expect(res.body.progress).toBeDefined();
    expect(res.body.progress.total).toBe(4);
  });

  it('GET /v1/assessment-attempts/:id - correctness and explanation not exposed', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${activeRes.body.attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    for (const section of res.body.sections) {
      for (const q of section.questions) {
        expect(q.isCorrect).toBeUndefined();
        expect(q.explanation).toBeUndefined();
        expect(q.acceptedAnswers).toBeUndefined();
        for (const opt of q.options) {
          expect(opt.isCorrect).toBeUndefined();
        }
      }
    }
  });

  it('GET /v1/assessment-attempts/:id - cross-user attempt access denied', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${activeRes.body.attemptId}`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .expect(404);
  });

  it('PUT /v1/assessment-attempts/:id/questions/:qId/answer - saves single-choice', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    const attemptId = activeRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const q1 = workspace.body.sections[0].questions[0];

    const res = await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${q1.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [q1.options[0].id], shortTextAnswer: null })
      .expect(200);

    expect(res.body.progress.answered).toBe(1);
    expect(res.body.progress.total).toBe(4);
    expect(res.body.savedAnswer.selectedOptionIds).toEqual([q1.options[0].id]);
  });

  it('PUT /v1/assessment-attempts/:id/questions/:qId/answer - validates option ownership', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    const attemptId = activeRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const q1 = workspace.body.sections[0].questions[0];

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${q1.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [randomUUID()], shortTextAnswer: null })
      .expect(400);
  });

  it('DELETE /v1/assessment-attempts/:id/questions/:qId/answer - clears answer', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    const attemptId = activeRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const q1 = workspace.body.sections[0].questions[0];

    await request(app.getHttpServer())
      .delete(`/v1/assessment-attempts/${attemptId}/questions/${q1.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(204);
  });

  it('progress is authoritative', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    const attemptId = activeRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(workspace.body.progress.total).toBe(4);
    expect(workspace.body.progress.answered).toBeGreaterThanOrEqual(0);
    expect(workspace.body.progress.unanswered).toBeGreaterThanOrEqual(0);
    expect(workspace.body.progress.answered + workspace.body.progress.unanswered).toBe(4);
  });

  it('POST /v1/assessment-attempts/:id/submit - rejects invalid confirmation', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/v1/assessment-attempts/${activeRes.body.attemptId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ confirmation: 'NOPE' })
      .expect(400);
  });

  it('POST /v1/assessment-attempts/:id/submit - scores all supported question types deterministically', async () => {
    const activeRes = await request(app.getHttpServer())
      .get(`/v1/assessments/${assessmentId}/attempts/active`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);
    const attemptId = activeRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const [singleChoice, multipleChoice, trueFalse, shortText] = workspace.body.sections[0].questions;

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${singleChoice.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [singleChoice.options[0].id], shortTextAnswer: null })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${multipleChoice.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [multipleChoice.options[0].id], shortTextAnswer: null })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${trueFalse.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [trueFalse.options[0].id], shortTextAnswer: null })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${shortText.id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [], shortTextAnswer: '  BANANA  ' })
      .expect(200);

    const submitRes = await request(app.getHttpServer())
      .post(`/v1/assessment-attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ confirmation: 'SUBMIT' })
      .expect(200);

    expect(submitRes.body.attemptId).toBe(attemptId);
    expect(submitRes.body.status).toBe('SUBMITTED');
    expect(submitRes.body.finalizationReason).toBe('CANDIDATE_SUBMITTED');
    expect(submitRes.body.result).toMatchObject({
      scoreEarned: 30,
      scorePossible: 50,
      percentage: 60,
      resultStatus: 'FAILED',
      correctCount: 3,
      incorrectCount: 1,
      unansweredCount: 0,
      questionCount: 4,
    });

    const persistedAttempt = await prisma.assessmentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { answers: true },
    });
    expect(persistedAttempt.status).toBe('SUBMITTED');
    expect(persistedAttempt.scoreEarned?.toNumber()).toBe(30);
    expect(persistedAttempt.scorePossible?.toNumber()).toBe(50);
    expect(persistedAttempt.scorePercentage?.toNumber()).toBe(60);
    expect(persistedAttempt.resultStatus).toBe('FAILED');
    expect(persistedAttempt.correctCount).toBe(3);
    expect(persistedAttempt.incorrectCount).toBe(1);
    expect(persistedAttempt.unansweredCount).toBe(0);
    expect(persistedAttempt.scoringVersion).toBe(1);
    expect(persistedAttempt.scoringCompletedAt).toBeTruthy();
    expect(persistedAttempt.answers).toHaveLength(4);
  });

  it('POST /v1/assessment-attempts/:id/submit - repeated submit returns stored result', async () => {
    const attemptId = (
      await prisma.assessmentAttempt.findFirstOrThrow({
        where: { assessmentId, candidateId: candidateUserId },
        select: { id: true },
      })
    ).id;

    const res = await request(app.getHttpServer())
      .post(`/v1/assessment-attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ confirmation: 'SUBMIT' })
      .expect(200);

    expect(res.body.attemptId).toBe(attemptId);
    expect(res.body.result.scoreEarned).toBe(30);
    expect(res.body.result.correctCount).toBe(3);
  });

  it('GET /v1/assessment-attempts/:id/submission-summary - owner can read safe summary only', async () => {
    const attemptId = (
      await prisma.assessmentAttempt.findFirstOrThrow({
        where: { assessmentId, candidateId: candidateUserId },
        select: { id: true },
      })
    ).id;

    const res = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}/submission-summary`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    expect(res.body.result.scoreEarned).toBe(30);
    expect(res.body.result.correctOptionIds).toBeUndefined();
    expect(res.body.result.acceptedAnswers).toBeUndefined();
  });

  it('GET /v1/assessment-attempts/:id/submission-summary - cross-user access is denied', async () => {
    const attemptId = (
      await prisma.assessmentAttempt.findFirstOrThrow({
        where: { assessmentId, candidateId: candidateUserId },
        select: { id: true },
      })
    ).id;

    await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}/submission-summary`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .expect(404);
  });

  it('PUT /v1/assessment-attempts/:id/questions/:qId/answer - submitted attempts are read-only', async () => {
    const attemptId = (
      await prisma.assessmentAttempt.findFirstOrThrow({
        where: { assessmentId, candidateId: candidateUserId },
        select: { id: true },
      })
    ).id;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${workspace.body.sections[0].questions[0].id}/answer`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ selectedOptionIds: [], shortTextAnswer: null })
      .expect(403);
  });

  it('POST /v1/assessment-attempts/:id/submit - concurrent submissions produce one persisted result', async () => {
    const startRes = await request(app.getHttpServer())
      .post(`/v1/assessments/${assessmentId}/attempts`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .expect(200);
    const attemptId = startRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .expect(200);

    const [singleChoice, multipleChoice, trueFalse, shortText] = workspace.body.sections[0].questions;

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${singleChoice.id}/answer`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .send({ selectedOptionIds: [singleChoice.options[0].id], shortTextAnswer: null })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${multipleChoice.id}/answer`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .send({ selectedOptionIds: [multipleChoice.options[0].id, multipleChoice.options[1].id], shortTextAnswer: null })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${trueFalse.id}/answer`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .send({ selectedOptionIds: [trueFalse.options[0].id], shortTextAnswer: null })
      .expect(200);
    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${shortText.id}/answer`)
      .set('Authorization', `Bearer ${otherCandidateToken}`)
      .send({ selectedOptionIds: [], shortTextAnswer: 'banana' })
      .expect(200);

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/v1/assessment-attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({ confirmation: 'SUBMIT' }),
      request(app.getHttpServer())
        .post(`/v1/assessment-attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${otherCandidateToken}`)
        .send({ confirmation: 'SUBMIT' }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.result).toEqual(second.body.result);

    const persistedAttempt = await prisma.assessmentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });
    expect(persistedAttempt.status).toBe('SUBMITTED');
    expect(persistedAttempt.scoreEarned?.toNumber()).toBe(50);
    expect(persistedAttempt.correctCount).toBe(4);
  });

  it('GET /v1/assessment-attempts/:id - overdue attempts finalize according to deadline policy', async () => {
    const managerCandidateId = randomUUID();
    deadlineCandidateEmail = `deadline_${testSlug}@example.com`;
    await prisma.user.create({
      data: {
        id: managerCandidateId,
        email: deadlineCandidateEmail,
        passwordHash: 'hash',
        roles: { create: [{ role: { connect: { code: 'candidate' } } }] },
      },
    });
    const deadlineSession = await sessionService.createSession(managerCandidateId, {
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });
    const deadlineToken = tokenService.signAccessToken(
      managerCandidateId,
      deadlineSession.id,
      ['candidate'],
    ).token;

    const startRes = await request(app.getHttpServer())
      .post(`/v1/assessments/${assessmentId}/attempts`)
      .set('Authorization', `Bearer ${deadlineToken}`)
      .expect(200);
    const attemptId = startRes.body.attemptId;

    const workspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${deadlineToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${workspace.body.sections[0].questions[0].id}/answer`)
      .set('Authorization', `Bearer ${deadlineToken}`)
      .send({ selectedOptionIds: [workspace.body.sections[0].questions[0].options[0].id], shortTextAnswer: null })
      .expect(200);

    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        deadlineAt: new Date(Date.now() - 60_000),
      },
    });

    const finalizedWorkspace = await request(app.getHttpServer())
      .get(`/v1/assessment-attempts/${attemptId}`)
      .set('Authorization', `Bearer ${deadlineToken}`)
      .expect(200);

    expect(finalizedWorkspace.body.attempt.status).toBe('EXPIRED');
    expect(finalizedWorkspace.body.attempt.finalizationReason).toBe('DEADLINE_REACHED');
    expect(finalizedWorkspace.body.submissionSummary.result.scoreEarned).toBe(10);
    expect(finalizedWorkspace.body.submissionSummary.result.unansweredCount).toBe(3);

    await request(app.getHttpServer())
      .put(`/v1/assessment-attempts/${attemptId}/questions/${workspace.body.sections[0].questions[1].id}/answer`)
      .set('Authorization', `Bearer ${deadlineToken}`)
      .send({ selectedOptionIds: [], shortTextAnswer: null })
      .expect(403);
  });
});
