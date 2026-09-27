import { buildCommonStudentInput } from '../dist/services/stateAggregator.js';

/**
 * In-memory Mock Firestore for stateAggregator tests.
 * Guarantees zero writes and zero pollution of production Cloud Firestore.
 */
function createMockFirestore(initialData = {}) {
  const data = {
    studentProfiles: {},
    studentSkills: {},
    learningActivity: {},
    assessmentAttempts: {},
    studentAnswers: {},
    assessmentQuestions: {},
    skills: {},
    ...initialData,
  };

  const writeLog = [];

  return {
    writeLog,
    collection(name) {
      const colData = data[name] || {};
      return {
        doc(id) {
          return {
            get: async () => {
              const docData = colData[id];
              return {
                exists: Boolean(docData),
                id,
                data: () => docData,
              };
            },
            set: async () => {
              writeLog.push({ action: 'set', collection: name, id });
            },
            delete: async () => {
              writeLog.push({ action: 'delete', collection: name, id });
            },
          };
        },
        where(field, op, val) {
          return {
            get: async () => {
              const matches = [];
              for (const [id, docVal] of Object.entries(colData)) {
                if (op === '==' && docVal[field] === val) {
                  matches.push({
                    id,
                    exists: true,
                    data: () => docVal,
                  });
                }
              }
              return {
                docs: matches,
                size: matches.length,
                empty: matches.length === 0,
                forEach: (cb) => matches.forEach(cb),
              };
            },
          };
        },
      };
    },
  };
}

let total = 0;
let passed = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] Case ${String(total).padStart(2, '0')}: ${description}`);
  } else {
    console.error(`[FAIL] Case ${String(total).padStart(2, '0')}: ${description}`);
  }
}

async function runAggregatorTests() {
  console.log('\n================================================================');
  console.log('STAGE C1.8.3.2-A — STATE AGGREGATOR TELEMETRY ALIGNMENT TESTS');
  console.log('================================================================\n');

  // Test 1: Empty diagnostic history -> empty assessment_history
  {
    const mockDb = createMockFirestore({
      studentProfiles: {
        student_01: { uid: 'student_01', firstName: 'Alex', learningGoal: 'Game Developer' },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    assert('Empty diagnostic history produces empty assessment_history', Array.isArray(result.assessment_history) && result.assessment_history.length === 0);
  }

  // Test 2: Completed attempt with answers -> one telemetry item per answer
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: {
          id: 'att_01',
          studentId: 'student_01',
          assessmentId: 'asm_gamedev_placement_01',
          status: 'COMPLETED',
          score: 0.667,
        },
      },
      studentAnswers: {
        ans_01: {
          id: 'ans_01',
          attemptId: 'att_01',
          studentId: 'student_01',
          questionId: 'q_01',
          skillId: 'gd-csharp-scripting',
          isCorrect: true,
          timeSeconds: 3.5,
        },
        ans_02: {
          id: 'ans_02',
          attemptId: 'att_01',
          studentId: 'student_01',
          questionId: 'q_02',
          skillId: 'gd-engine-architecture',
          isCorrect: false,
          timeSeconds: 5.0,
        },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    assert('Completed attempt with 2 answers produces exactly 2 assessment_history items', result.assessment_history?.length === 2);
  }

  // Test 3: Correctness comes from stored isCorrect
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: { id: 'att_01', studentId: 'student_01', assessmentId: 'asm_01', score: 0.5 },
      },
      studentAnswers: {
        ans_01: { id: 'ans_01', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-csharp-scripting', isCorrect: true },
        ans_02: { id: 'ans_02', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_02', skillId: 'gd-engine-architecture', isCorrect: false },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    const item1 = result.assessment_history?.find((h) => h.question_id === 'q_01');
    const item2 = result.assessment_history?.find((h) => h.question_id === 'q_02');
    assert('Correctness correctly reflects stored isCorrect booleans (true & false)', item1?.correct === true && item2?.correct === false);
  }

  // Test 4: skill_id comes from stored skillId (with skill alias present)
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: { id: 'att_01', studentId: 'student_01', assessmentId: 'asm_01' },
      },
      studentAnswers: {
        ans_01: { id: 'ans_01', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-math-physics', isCorrect: true },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    const item = result.assessment_history?.[0];
    assert('skill_id and skill alias match the exact stored canonical skillId', item?.skill_id === 'gd-math-physics' && item?.skill === 'gd-math-physics');
  }

  // Test 5: time_seconds comes from stored timeSeconds / latencyMs
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: { id: 'att_01', studentId: 'student_01', assessmentId: 'asm_01' },
      },
      studentAnswers: {
        ans_01: { id: 'ans_01', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-csharp-scripting', isCorrect: true, timeSeconds: 4.8 },
        ans_02: { id: 'ans_02', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_02', skillId: 'gd-engine-architecture', isCorrect: true, latencyMs: 7240 },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    const item1 = result.assessment_history?.find((h) => h.question_id === 'q_01');
    const item2 = result.assessment_history?.find((h) => h.question_id === 'q_02');
    assert('time_seconds derives accurately from timeSeconds (4.8s) or latencyMs (7.2s)', item1?.time_seconds === 4.8 && item2?.time_seconds === 7.2);
  }

  // Test 6: No fabricated difficulty is introduced (omitted when not on question doc)
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: { id: 'att_01', studentId: 'student_01', assessmentId: 'asm_01' },
      },
      assessmentQuestions: {
        q_with_diff: { id: 'q_with_diff', difficultyLevel: 'HARD' },
        // q_without_diff has no question document in assessmentQuestions
      },
      studentAnswers: {
        ans_01: { id: 'ans_01', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_with_diff', skillId: 'gd-game-ai', isCorrect: true },
        ans_02: { id: 'ans_02', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_without_diff', skillId: 'gd-game-ai', isCorrect: true },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    const item1 = result.assessment_history?.find((h) => h.question_id === 'q_with_diff');
    const item2 = result.assessment_history?.find((h) => h.question_id === 'q_without_diff');
    assert('Difficulty included when authoritatively present, strictly omitted when missing', item1?.difficulty === 'HARD' && item2?.difficulty === undefined);
  }

  // Test 7: Answers from another student's attempt are excluded
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_student1: { id: 'att_student1', studentId: 'student_01', assessmentId: 'asm_01' },
        att_student2: { id: 'att_student2', studentId: 'student_02', assessmentId: 'asm_01' },
      },
      studentAnswers: {
        ans_s1: { id: 'ans_s1', attemptId: 'att_student1', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-csharp-scripting', isCorrect: true },
        // Malformed or foreign record: studentId is student_01 but attemptId belongs to student_02
        ans_s2_foreign: { id: 'ans_s2_foreign', attemptId: 'att_student2', studentId: 'student_01', questionId: 'q_02', skillId: 'gd-csharp-scripting', isCorrect: false },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    assert('Answers referencing non-owned attempts are strictly excluded', result.assessment_history?.length === 1 && result.assessment_history[0].question_id === 'q_01');
  }

  // Test 8: Multiple attempts remain separated
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_alpha: { id: 'att_alpha', studentId: 'student_01', assessmentId: 'asm_01', score: 0.8 },
        att_beta: { id: 'att_beta', studentId: 'student_01', assessmentId: 'asm_02', score: 0.4 },
      },
      studentAnswers: {
        ans_a1: { id: 'ans_a1', attemptId: 'att_alpha', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-csharp-scripting', isCorrect: true },
        ans_b1: { id: 'ans_b1', attemptId: 'att_beta', studentId: 'student_01', questionId: 'q_02', skillId: 'gd-math-physics', isCorrect: false },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    const itemA = result.assessment_history?.find((h) => h.attempt_id === 'att_alpha');
    const itemB = result.assessment_history?.find((h) => h.attempt_id === 'att_beta');
    assert(
      'Multiple attempts maintain separate attempt_id, assessment_id, and attempt_score',
      itemA?.assessment_id === 'asm_01' && itemA?.attempt_score === 0.8 &&
      itemB?.assessment_id === 'asm_02' && itemB?.attempt_score === 0.4
    );
  }

  // Test 9: Existing learningActivity aggregation remains unchanged
  {
    const mockDb = createMockFirestore({
      learningActivity: {
        act_01: {
          id: 'act_01',
          studentId: 'student_01',
          resourceId: 'res_unity_01',
          skillId: 'gd-engine-architecture',
          activityType: 'COMPLETED',
          startedAt: '2026-09-27T00:00:00Z',
          completedAt: '2026-09-27T00:30:00Z',
        },
      },
    });
    const result = await buildCommonStudentInput('student_01', mockDb);
    assert('Existing learningActivity produces correct learning_history, activity_history, resource_history', result.learning_history?.length === 1 && result.resource_history?.length === 1 && result.activity_history?.length === 1);
  }

  // Test 10: No studentSkills records are created
  {
    const mockDb = createMockFirestore({
      assessmentAttempts: {
        att_01: { id: 'att_01', studentId: 'student_01', assessmentId: 'asm_01', score: 1.0 },
      },
      studentAnswers: {
        ans_01: { id: 'ans_01', attemptId: 'att_01', studentId: 'student_01', questionId: 'q_01', skillId: 'gd-csharp-scripting', isCorrect: true },
      },
    });
    await buildCommonStudentInput('student_01', mockDb);
    assert('Zero write operations performed (no studentSkills or other records created)', mockDb.writeLog.length === 0);
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAggregatorTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
