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

  let managerToken: string;
  let candidateToken: string;
  let otherCandidateToken: string;

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
    const candidateId = randomUUID();
    const otherCandidateId = randomUUID();

    // Ensure roles exist
    await prisma.role.upsert({ where: { code: 'assessment_publish' }, update: {}, create: { code: 'assessment_publish', name: 'Assessment Publisher' } });
    await prisma.role.upsert({ where: { code: 'assessment_manager' }, update: {}, create: { code: 'assessment_manager', name: 'Assessment Manager' } });
    await prisma.role.upsert({ where: { code: 'candidate' }, update: {}, create: { code: 'candidate', name: 'Candidate' } });

    await prisma.user.create({ data: { id: managerId, email: `manager_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'assessment_manager' } } }, { role: { connect: { code: 'assessment_publish' } } }] } } });
    await prisma.user.create({ data: { id: candidateId, email: `candidate_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });
    await prisma.user.create({ data: { id: otherCandidateId, email: `other_${testSlug}@example.com`, passwordHash: 'hash', roles: { create: [{ role: { connect: { code: 'candidate' } } }] } } });

    const managerSession = await sessionService.createSession(managerId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    managerToken = tokenService.signAccessToken(managerId, managerSession.id, ['assessment_manager', 'assessment_publish']).token;

    const candidateSession = await sessionService.createSession(candidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    candidateToken = tokenService.signAccessToken(candidateId, candidateSession.id, ['candidate']).token;

    const otherCandidateSession = await sessionService.createSession(otherCandidateId, { ipAddress: '127.0.0.1', userAgent: 'test' });
    otherCandidateToken = tokenService.signAccessToken(otherCandidateId, otherCandidateSession.id, ['candidate']).token;

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

    // Activate questions
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId1}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);
    await request(app.getHttpServer()).put(`${base}/manage/assessments/questions/${questionId2}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'ACTIVE' }).expect(200);

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
    await prisma.userSession.deleteMany({ where: { user: { email: { in: [`manager_${testSlug}@example.com`, `candidate_${testSlug}@example.com`, `other_${testSlug}@example.com`] } } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { in: [`manager_${testSlug}@example.com`, `candidate_${testSlug}@example.com`, `other_${testSlug}@example.com`] } } } });
    await prisma.user.deleteMany({ where: { email: { in: [`manager_${testSlug}@example.com`, `candidate_${testSlug}@example.com`, `other_${testSlug}@example.com`] } } });
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
    expect(res.body.attempt.questionCount).toBe(2);
    expect(res.body.sections).toHaveLength(1);
    expect(res.body.sections[0].questions).toHaveLength(2);
    expect(res.body.progress).toBeDefined();
    expect(res.body.progress.total).toBe(2);
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
    expect(res.body.progress.total).toBe(2);
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

    expect(workspace.body.progress.total).toBe(2);
    expect(workspace.body.progress.answered).toBeGreaterThanOrEqual(0);
    expect(workspace.body.progress.unanswered).toBeGreaterThanOrEqual(0);
    expect(workspace.body.progress.answered + workspace.body.progress.unanswered).toBe(2);
  });
});
