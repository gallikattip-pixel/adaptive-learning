/**
 * Hardened Test Suite for Diagnostic Backend Service & Endpoints
 * Stage C1.5
 *
 * Verifies all 40+ required test specifications across authentication boundaries,
 * attempt lifecycle, server-side grading, timing telemetry, security, and data integrity.
 * Strictly maintains ZERO mutations to the live Firebase database.
 */

import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendDir, '.env') });

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runHardenedTests() {
  console.log('================================================================');
  console.log('STAGE C1.5 — HARDENED DIAGNOSTIC BACKEND TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`[PASS] Case ${total.toString().padStart(2, '0')}: ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${total.toString().padStart(2, '0')}: ${desc}`);
    }
  }

  // Load modules from compiled dist
  const distDir = path.join(backendDir, 'dist');
  const { auth, db } = await import(pathToFileURL(path.join(distDir, 'config/firebase.js')).href);
  const { DiagnosticService, DiagnosticError } = await import(pathToFileURL(path.join(distDir, 'services/diagnosticService.js')).href);
  const { assessmentRepository } = await import(pathToFileURL(path.join(distDir, 'repositories/assessmentRepository.js')).href);

  // ---------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & ROUTE BOUNDARIES (LIVE SERVER)
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 1: AUTHENTICATION BOUNDARY TESTS ---');

  // 1. Unauthenticated start -> 401
  const res1 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/start',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {});
  assert('Start without authentication returns 401 Unauthorized', res1.status === 401);

  // 2. Unauthenticated submit -> 401
  const res2 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { attemptId: 'att_123', answers: [] });
  assert('Submit without authentication returns 401 Unauthorized', res2.status === 401);

  // 3. Start with invalid Bearer token format -> 401
  const res3 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid.malformed.token',
    },
  }, {});
  assert('Start with invalid token returns 401 Unauthorized', res3.status === 401);

  // 4. Submit with invalid Bearer token format -> 401
  const res4 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid.malformed.token',
    },
  }, { attemptId: 'att_123', answers: [] });
  assert('Submit with invalid token returns 401 Unauthorized', res4.status === 401);

  // ---------------------------------------------------------------------------
  // SECTION 2: LIVE HTTP ENDPOINTS ON EMPTY FIRESTORE
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: LIVE HTTP RESPONSES ON EMPTY FIRESTORE ---');

  const validToken = await auth.createCustomToken('JA6u6Ovp1xVfvIdDuJ2ptwp7cQ02');

  // 5. Authenticated start with non-existent assessmentId -> clean 404
  const res5 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
  }, { assessmentId: 'asm_non_existent_999' });
  assert(
    'Authenticated start returns clean 404 when non-existent placement assessment is requested',
    res5.status === 404 && res5.body.error?.code === 'ASSESSMENT_NOT_FOUND'
  );

  // 6. Authenticated submit with missing body parameters -> 400
  const res6 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
  }, {});
  assert('Authenticated submit with missing body returns 400 Bad Request', res6.status === 400);

  // 7. Authenticated submit with non-array answers -> 400
  const res7 = await httpRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/diagnostic/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
  }, { attemptId: 'att_test', answers: 'not_an_array' });
  assert('Authenticated submit with non-array answers returns 400 Bad Request', res7.status === 400);

  // ---------------------------------------------------------------------------
  // SECTION 3: IN-MEMORY BUSINESS LOGIC & ATTEMPT LIFECYCLE TESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 3: IN-MEMORY SERVICE & LIFECYCLE TESTS ---');

  const mockQuestions = [
    {
      id: 'q_csharp_01',
      assessmentId: 'asm_gamedev_placement',
      skillId: 'gd-csharp-scripting',
      questionText: 'What is the primary benefit of object pooling in game development?',
      questionType: 'MULTIPLE_CHOICE',
      options: ['Reduces Garbage Collection pauses', 'Improves GPU rendering speed', 'Increases heap allocation', 'Encrypts save data'],
      correctAnswer: 'Reduces Garbage Collection pauses',
      difficulty: 2,
      difficultyLevel: 'MEDIUM',
      explanation: 'Object pooling recycles objects, avoiding frequent GC allocs.',
      createdAt: '2026-09-27T00:00:00.000Z',
    },
    {
      id: 'q_engine_01',
      assessmentId: 'asm_gamedev_placement',
      skillId: 'gd-engine-architecture',
      questionText: 'Which game loop method is called at fixed time steps for physics simulation?',
      questionType: 'MULTIPLE_CHOICE',
      options: ['FixedUpdate', 'Update', 'LateUpdate', 'Tick'],
      correctAnswer: 'FixedUpdate',
      difficulty: 1,
      difficultyLevel: 'EASY',
      explanation: 'FixedUpdate runs at fixed framerate intervals decoupled from rendering.',
      createdAt: '2026-09-27T00:00:00.000Z',
    },
    {
      id: 'q_math_01',
      assessmentId: 'asm_gamedev_placement',
      skillId: 'gd-math-physics',
      questionText: 'What does the dot product of two normalized vectors equal to 0 indicate?',
      questionType: 'MULTIPLE_CHOICE',
      options: ['Vectors are perpendicular (orthogonal)', 'Vectors are parallel', 'Vectors are opposite', 'Vectors are colinear'],
      correctAnswer: 'Vectors are perpendicular (orthogonal)',
      difficulty: 2,
      difficultyLevel: 'MEDIUM',
      explanation: 'Dot product of perpendicular vectors is zero.',
      createdAt: '2026-09-27T00:00:00.000Z',
    },
  ];

  let mockAttempts = {};
  let mockAnswers = [];
  let assessmentHasQuestions = true;

  const inMemoryRepo = {
    async getPlacementAssessments(domain) {
      if (domain === 'Game Development' || !domain) {
        return [{ id: 'asm_gamedev_placement', title: 'Game Development Diagnostic', assessmentType: 'PLACEMENT', domain: 'Game Development' }];
      }
      return [];
    },
    async getAssessmentById(id) {
      if (id === 'asm_gamedev_placement') {
        return { id: 'asm_gamedev_placement', title: 'Game Development Diagnostic', assessmentType: 'PLACEMENT', domain: 'Game Development' };
      }
      if (id === 'asm_practice') {
        return { id: 'asm_practice', title: 'Practice Test', assessmentType: 'PRACTICE', domain: 'Game Development' };
      }
      return null;
    },
    async getQuestionsByAssessmentId(id) {
      if (!assessmentHasQuestions) return [];
      return mockQuestions.filter((q) => q.assessmentId === id);
    },
    async getStudentFacingQuestions(id) {
      if (!assessmentHasQuestions) return [];
      return mockQuestions
        .filter((q) => q.assessmentId === id)
        .map((q) => ({
          id: q.id,
          assessmentId: q.assessmentId,
          skillId: q.skillId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          difficulty: q.difficulty,
          difficultyLevel: q.difficultyLevel,
          createdAt: q.createdAt,
        }));
    },
    async getAttemptsByStudent(sId) {
      return Object.values(mockAttempts).filter((a) => a.studentId === sId);
    },
    async createAttempt(params) {
      const att = {
        id: 'att_' + (Object.keys(mockAttempts).length + 1),
        assessmentId: params.assessmentId,
        studentId: params.studentId,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
        totalQuestions: params.totalQuestions,
      };
      mockAttempts[att.id] = att;
      return att;
    },
    async getAttemptById(id) {
      return mockAttempts[id] || null;
    },
    async updateAttempt(id, updates, studentId) {
      const existing = mockAttempts[id];
      if (!existing) throw new Error('Attempt not found');
      if (studentId && existing.studentId !== studentId) throw new Error('Unauthorized');
      Object.assign(existing, updates);
      return existing;
    },
    async recordStudentAnswer(params) {
      const record = { id: 'ans_' + (mockAnswers.length + 1), ...params, answeredAt: new Date().toISOString() };
      mockAnswers.push(record);
      return record;
    },
    async getAnswersByAttempt(attId) {
      return mockAnswers.filter((a) => a.attemptId === attId);
    },
  };

  // Attach mock to singleton
  Object.assign(assessmentRepository, inMemoryRepo);
  const testService = new DiagnosticService();

  // 8. Placement assessment with zero questions -> clean error
  assessmentHasQuestions = false;
  let err8 = null;
  try {
    await testService.startDiagnostic('student_alpha');
  } catch (e) {
    err8 = e;
  }
  assert('Placement assessment with zero questions throws QUESTIONS_NOT_CONFIGURED (404)', err8?.statusCode === 404 && err8.code === 'QUESTIONS_NOT_CONFIGURED');
  assessmentHasQuestions = true;

  // 9. Student-facing questions omit correctAnswer
  const startResult = await testService.startDiagnostic('student_alpha');
  assert('Student-facing questions strictly omit correctAnswer', startResult.questions.every((q) => q.correctAnswer === undefined));

  // 10. Student-facing questions omit explanation
  assert('Student-facing questions strictly omit explanation', startResult.questions.every((q) => q.explanation === undefined));

  // 11. Start creates an IN_PROGRESS attempt
  assert('Start creates an attempt with status IN_PROGRESS', startResult.attemptId && mockAttempts[startResult.attemptId]?.status === 'IN_PROGRESS');

  // 12. Repeated start reuses active IN_PROGRESS attempt (no duplicate sessions)
  const resumeResult = await testService.startDiagnostic('student_alpha');
  assert('Subsequent start resumes existing IN_PROGRESS attempt without creating duplicate', resumeResult.attemptId === startResult.attemptId);

  // 13. Requested assessmentId not found -> 404
  let err13 = null;
  try {
    await testService.startDiagnostic('student_alpha', 'non_existent_asm');
  } catch (e) {
    err13 = e;
  }
  assert('Non-existent requested assessmentId throws 404 ASSESSMENT_NOT_FOUND', err13?.statusCode === 404);

  // 14. Requested assessment not of type PLACEMENT -> 404
  let err14 = null;
  try {
    await testService.startDiagnostic('student_alpha', 'asm_practice');
  } catch (e) {
    err14 = e;
  }
  assert('Non-placement requested assessment throws 404 ASSESSMENT_NOT_FOUND', err14?.statusCode === 404);

  // ---------------------------------------------------------------------------
  // SECTION 4: SUBMISSION VALIDATION & TAMPER RESISTANCE
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: SUBMISSION VALIDATION & TAMPER RESISTANCE ---');

  const activeAttemptId = startResult.attemptId;

  // 15. Missing attemptId -> 400
  let err15 = null;
  try {
    await testService.submitDiagnostic('student_alpha', '', []);
  } catch (e) {
    err15 = e;
  }
  assert('Missing attemptId throws 400 INVALID_ATTEMPT_ID', err15?.statusCode === 400);

  // 16. Empty answers array -> 400
  let err16 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, []);
  } catch (e) {
    err16 = e;
  }
  assert('Empty answers array throws 400 EMPTY_ANSWERS', err16?.statusCode === 400);

  // 17. Missing questionId in answer item -> 400
  let err17 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [{ questionId: '', answer: 'opt' }]);
  } catch (e) {
    err17 = e;
  }
  assert('Missing questionId throws 400 INVALID_QUESTION_ID', err17?.statusCode === 400);

  // 18. Duplicate questionId in one submission -> 400
  let err18 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'choice1' },
      { questionId: 'q_csharp_01', answer: 'choice2' },
    ]);
  } catch (e) {
    err18 = e;
  }
  assert('Duplicate questionId in one submission throws 400 DUPLICATE_QUESTION_SUBMISSION', err18?.statusCode === 400);

  // 19. Empty string answer -> 400
  let err19 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: '   ' },
    ]);
  } catch (e) {
    err19 = e;
  }
  assert('Empty answer string throws 400 INVALID_ANSWER_FORMAT', err19?.statusCode === 400);

  // 20. Non-string answer -> 400
  let err20 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 12345 },
    ]);
  } catch (e) {
    err20 = e;
  }
  assert('Non-string answer throws 400 INVALID_ANSWER_FORMAT', err20?.statusCode === 400);

  // 21. Negative latencyMs -> 400
  let err21 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses', latencyMs: -100 },
    ]);
  } catch (e) {
    err21 = e;
  }
  assert('Negative latencyMs throws 400 INVALID_LATENCY', err21?.statusCode === 400);

  // 22. NaN latencyMs -> 400
  let err22 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses', latencyMs: NaN },
    ]);
  } catch (e) {
    err22 = e;
  }
  assert('NaN latencyMs throws 400 INVALID_LATENCY', err22?.statusCode === 400);

  // 23. Infinite latencyMs -> 400
  let err23 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses', latencyMs: Infinity },
    ]);
  } catch (e) {
    err23 = e;
  }
  assert('Infinite latencyMs throws 400 INVALID_LATENCY', err23?.statusCode === 400);

  // 24. Missing attempt -> 404
  let err24 = null;
  try {
    await testService.submitDiagnostic('student_alpha', 'att_non_existent', [
      { questionId: 'q_csharp_01', answer: 'opt' },
    ]);
  } catch (e) {
    err24 = e;
  }
  assert('Missing attempt throws 404 ATTEMPT_NOT_FOUND', err24?.statusCode === 404);

  // 25. Wrong student ownership -> 403
  let err25 = null;
  try {
    await testService.submitDiagnostic('student_intruder_beta', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'opt' },
    ]);
  } catch (e) {
    err25 = e;
  }
  assert('Student submitting to another student attempt throws 403 FORBIDDEN', err25?.statusCode === 403);

  // 26. Question belonging to another assessment -> 400
  let err26 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_alien_foreign_99', answer: 'opt' },
    ]);
  } catch (e) {
    err26 = e;
  }
  assert('Question from another assessment throws 400 QUESTION_NOT_IN_ASSESSMENT', err26?.statusCode === 400);

  // ---------------------------------------------------------------------------
  // SECTION 5: SERVER-SIDE GRADING, SCORING & TELEMETRY INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 5: SERVER-SIDE GRADING & TELEMETRY ---');

  // Clear recorded answers before submission test
  mockAnswers = [];

  // Submit with client attempting to inject fake isCorrect, fake score, and fake skillId
  const submitPayload = [
    {
      questionId: 'q_csharp_01',
      answer: 'reduces garbage collection pauses', // correct (case-insensitive)
      latencyMs: 3450,
      isCorrect: false, // client tamper attempt
      score: 0.0,       // client tamper attempt
      skillId: 'fake-skill', // client tamper attempt
    },
    {
      questionId: 'q_engine_01',
      answer: 'Update', // wrong answer (correct is FixedUpdate)
      latencyMs: 5120,
      isCorrect: true,  // client tamper attempt
    },
    {
      questionId: 'q_math_01',
      answer: 'Vectors are perpendicular (orthogonal)', // correct
      // latencyMs intentionally omitted to test no synthetic timing
    },
  ];

  const submitResult = await testService.submitDiagnostic('student_alpha', activeAttemptId, submitPayload);

  // 27. Correct answer evaluated to true
  assert('Correct answer graded as isCorrect: true', mockAnswers.find((a) => a.questionId === 'q_csharp_01')?.isCorrect === true);

  // 28. Incorrect answer evaluated to false
  assert('Incorrect answer graded as isCorrect: false', mockAnswers.find((a) => a.questionId === 'q_engine_01')?.isCorrect === false);

  // 29. Client-provided isCorrect is ignored
  assert(
    'Server ignored client-provided isCorrect tamper attempts',
    mockAnswers.find((a) => a.questionId === 'q_csharp_01')?.isCorrect === true &&
    mockAnswers.find((a) => a.questionId === 'q_engine_01')?.isCorrect === false
  );

  // 30. Server ignored client-provided skillId and used authoritative question skillId
  assert(
    'Server mapped answer to authoritative question skillId (gd-csharp-scripting)',
    mockAnswers.find((a) => a.questionId === 'q_csharp_01')?.skillId === 'gd-csharp-scripting'
  );

  // 31. Score calculation is strictly correctCount / totalQuestions (2 / 3 = 0.667)
  assert('Score calculated strictly as 2 / 3 = 0.667', submitResult.score === 0.667 && submitResult.correctCount === 2 && submitResult.totalQuestions === 3);

  // 32. Per-skill summary calculated accurately
  assert(
    'Per-skill summary contains exact breakdown for all 3 skills',
    submitResult.skillSummary['gd-csharp-scripting']?.score === 1.0 &&
    submitResult.skillSummary['gd-engine-architecture']?.score === 0.0 &&
    submitResult.skillSummary['gd-math-physics']?.score === 1.0
  );

  // 33. Attempt transitions to COMPLETED
  assert('Attempt transitions to status COMPLETED', submitResult.status === 'COMPLETED' && mockAttempts[activeAttemptId]?.status === 'COMPLETED');

  // 34. completedAt is populated with ISO timestamp
  assert('completedAt timestamp is populated', typeof submitResult.completedAt === 'string' && submitResult.completedAt.length > 10);

  // 35. latencyMs persisted accurately when provided
  assert(
    'latencyMs persisted accurately (3450, 5120)',
    mockAnswers.find((a) => a.questionId === 'q_csharp_01')?.latencyMs === 3450 &&
    mockAnswers.find((a) => a.questionId === 'q_engine_01')?.latencyMs === 5120
  );

  // 36. timeSeconds derived accurately (3.5, 5.1)
  assert(
    'timeSeconds derived accurately from latencyMs (3.5s, 5.1s)',
    mockAnswers.find((a) => a.questionId === 'q_csharp_01')?.timeSeconds === 3.5 &&
    mockAnswers.find((a) => a.questionId === 'q_engine_01')?.timeSeconds === 5.1
  );

  // 37. Missing latency does not generate synthetic timing
  assert(
    'Omitted latency does not generate synthetic latencyMs or timeSeconds',
    mockAnswers.find((a) => a.questionId === 'q_math_01')?.latencyMs === undefined &&
    mockAnswers.find((a) => a.questionId === 'q_math_01')?.timeSeconds === undefined
  );

  // ---------------------------------------------------------------------------
  // SECTION 6: COMPLETED & ABANDONED ATTEMPT SUBMISSION GUARDS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 6: FINALIZED ATTEMPT GUARDS ---');

  // 38. Re-submitting an already COMPLETED attempt -> 409
  let err38 = null;
  try {
    await testService.submitDiagnostic('student_alpha', activeAttemptId, [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses' },
    ]);
  } catch (e) {
    err8 = e;
    err38 = e;
  }
  assert('Submitting an already COMPLETED attempt throws 409 ATTEMPT_ALREADY_FINALIZED', err38?.statusCode === 409);

  // 39. Submitting an ABANDONED attempt -> 409
  mockAttempts['att_abandoned_01'] = {
    id: 'att_abandoned_01',
    assessmentId: 'asm_gamedev_placement',
    studentId: 'student_gamma',
    status: 'ABANDONED',
    startedAt: '2026-09-27T01:00:00.000Z',
    totalQuestions: 3,
  };
  let err39 = null;
  try {
    await testService.submitDiagnostic('student_gamma', 'att_abandoned_01', [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses' },
    ]);
  } catch (e) {
    err39 = e;
  }
  assert('Submitting an ABANDONED attempt throws 409 ATTEMPT_ALREADY_FINALIZED', err39?.statusCode === 409);

  // 40. Duplicate answer records not accidentally created on submission failure
  const countBefore = mockAnswers.length;
  try {
    await testService.submitDiagnostic('student_gamma', 'att_abandoned_01', [
      { questionId: 'q_csharp_01', answer: 'Reduces Garbage Collection pauses' },
    ]);
  } catch {
    // Expected error
  }
  assert('No orphan answer records created during rejected submission', mockAnswers.length === countBefore);

  // ---------------------------------------------------------------------------
  // SECTION 7: LIVE FIRESTORE INTACTNESS VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 7: FIRESTORE INTACTNESS VERIFICATION ---');

  const asmCount = (await db.collection('assessments').count().get()).data().count;
  const qCount = (await db.collection('assessmentQuestions').count().get()).data().count;
  const attCount = (await db.collection('assessmentAttempts').count().get()).data().count;
  const ansCount = (await db.collection('studentAnswers').count().get()).data().count;

  assert(
    'Live Firestore has exactly 1 assessment, 18 questions, and verified attempt/answer state',
    asmCount === 1 && qCount === 18 && (attCount === 0 || attCount === 1) && (ansCount === 0 || ansCount === 18)
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS EXECUTED: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('================================================================\n');

  process.exit(passed === total ? 0 : 1);
}

runHardenedTests().catch((err) => {
  console.error('Fatal unhandled error in test suite:', err);
  process.exit(1);
});
