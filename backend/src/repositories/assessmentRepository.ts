import { db } from '../config/firebase.js';
import type {
  AssessmentDocument,
  AssessmentQuestionDocument,
  AssessmentAttemptDocument,
  AssessmentAttemptStatus,
  SkillAttemptSummary,
  StudentAnswerDocument,
} from '../types/firestore.js';

/**
 * Sanitized Question representation for student test-taking.
 * Strictly omits `correctAnswer` and `explanation` to prevent exposure.
 */
export interface StudentFacingQuestion {
  id: string;
  assessmentId: string;
  skillId: string;
  questionText: string;
  questionType: AssessmentQuestionDocument['questionType'];
  options: string[];
  difficulty: number;
  difficultyLevel?: AssessmentQuestionDocument['difficultyLevel'];
  createdAt: string;
}

export interface CreateAttemptParams {
  assessmentId: string;
  studentId: string;
  totalQuestions?: number;
}

export interface UpdateAttemptParams {
  status?: AssessmentAttemptStatus;
  completedAt?: string;
  score?: number;
  totalQuestions?: number;
  correctCount?: number;
  skillSummary?: Record<string, SkillAttemptSummary>;
  passed?: boolean;
}

export interface RecordAnswerParams {
  attemptId: string;
  questionId: string;
  studentId: string;
  skillId: string;
  answer: string;
  isCorrect: boolean;
  latencyMs?: number;
  timeSeconds?: number;
}

/**
 * Resolves the initialized Firestore client instance.
 * Throws a descriptive error if Firestore has not been configured.
 */
function getFirestore() {
  if (!db) {
    throw new Error('[AssessmentRepository] Firestore database client is not initialized.');
  }
  return db;
}

export class AssessmentRepository {
  // =========================================================================
  // 1. ASSESSMENTS
  // =========================================================================

  /**
   * Retrieves placement assessments.
   * Optionally filters by domain (e.g. 'Game Development').
   */
  async getPlacementAssessments(domain?: string): Promise<AssessmentDocument[]> {
    const firestore = getFirestore();
    let query = firestore.collection('assessments').where('assessmentType', '==', 'PLACEMENT');

    if (domain && domain.trim()) {
      query = query.where('domain', '==', domain.trim());
    }

    const snap = await query.get();
    const assessments: AssessmentDocument[] = [];
    snap.forEach((doc) => {
      assessments.push({ id: doc.id, ...(doc.data() as Omit<AssessmentDocument, 'id'>) });
    });
    return assessments;
  }

  /**
   * Retrieves an assessment by its unique document ID.
   */
  async getAssessmentById(assessmentId: string): Promise<AssessmentDocument | null> {
    if (!assessmentId || !assessmentId.trim()) return null;
    const firestore = getFirestore();
    const docSnap = await firestore.collection('assessments').doc(assessmentId.trim()).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...(docSnap.data() as Omit<AssessmentDocument, 'id'>) };
  }

  // =========================================================================
  // 2. ASSESSMENT QUESTIONS
  // =========================================================================

  /**
   * Internal/Server-side question retrieval including canonical correct answers and explanations.
   * MUST ONLY be consumed by server-side grading and scoring pipelines.
   * Results are deterministically sorted by ID.
   */
  async getQuestionsByAssessmentId(
    assessmentId: string,
    skillId?: string
  ): Promise<AssessmentQuestionDocument[]> {
    if (!assessmentId || !assessmentId.trim()) return [];
    const firestore = getFirestore();
    let query = firestore.collection('assessmentQuestions').where('assessmentId', '==', assessmentId.trim());

    if (skillId && skillId.trim()) {
      query = query.where('skillId', '==', skillId.trim());
    }

    const snap = await query.get();
    const questions: AssessmentQuestionDocument[] = [];
    snap.forEach((doc) => {
      questions.push({ id: doc.id, ...(doc.data() as Omit<AssessmentQuestionDocument, 'id'>) });
    });

    // Deterministic ordering by question ID
    return questions.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Student-facing question retrieval.
   * Sanitizes all questions by strictly stripping `correctAnswer` and `explanation`.
   * Results are deterministically sorted by ID.
   */
  async getStudentFacingQuestions(
    assessmentId: string,
    skillId?: string
  ): Promise<StudentFacingQuestion[]> {
    const fullQuestions = await this.getQuestionsByAssessmentId(assessmentId, skillId);

    return fullQuestions.map((q) => ({
      id: q.id,
      assessmentId: q.assessmentId,
      skillId: q.skillId,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options || [],
      difficulty: q.difficulty,
      ...(q.difficultyLevel ? { difficultyLevel: q.difficultyLevel } : {}),
      createdAt: q.createdAt,
    }));
  }

  // =========================================================================
  // 3. ASSESSMENT ATTEMPTS
  // =========================================================================

  /**
   * Creates a new attempt session with status 'IN_PROGRESS'.
   * @param params Attempt initialization parameters.
   */
  async createAttempt(params: CreateAttemptParams): Promise<AssessmentAttemptDocument> {
    if (!params.studentId || !params.studentId.trim()) {
      throw new Error('[AssessmentRepository] studentId is required to create an attempt.');
    }
    if (!params.assessmentId || !params.assessmentId.trim()) {
      throw new Error('[AssessmentRepository] assessmentId is required to create an attempt.');
    }

    const firestore = getFirestore();
    const docRef = firestore.collection('assessmentAttempts').doc();
    const now = new Date().toISOString();

    const attemptData: AssessmentAttemptDocument = {
      id: docRef.id,
      assessmentId: params.assessmentId.trim(),
      studentId: params.studentId.trim(),
      status: 'IN_PROGRESS',
      startedAt: now,
      ...(typeof params.totalQuestions === 'number' ? { totalQuestions: params.totalQuestions } : {}),
    };

    await docRef.set(attemptData);
    return attemptData;
  }

  /**
   * Retrieves an attempt session by its ID.
   */
  async getAttemptById(attemptId: string): Promise<AssessmentAttemptDocument | null> {
    if (!attemptId || !attemptId.trim()) return null;
    const firestore = getFirestore();
    const docSnap = await firestore.collection('assessmentAttempts').doc(attemptId.trim()).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...(docSnap.data() as Omit<AssessmentAttemptDocument, 'id'>) };
  }

  /**
   * Retrieves all attempt sessions for a specific authenticated student.
   * Enforces strict student scoping.
   */
  async getAttemptsByStudent(studentId: string): Promise<AssessmentAttemptDocument[]> {
    if (!studentId || !studentId.trim()) return [];
    const firestore = getFirestore();
    const snap = await firestore
      .collection('assessmentAttempts')
      .where('studentId', '==', studentId.trim())
      .get();

    const attempts: AssessmentAttemptDocument[] = [];
    snap.forEach((doc) => {
      attempts.push({ id: doc.id, ...(doc.data() as Omit<AssessmentAttemptDocument, 'id'>) });
    });

    // Sort newest attempts first
    return attempts.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  /**
   * Updates an attempt session (e.g. marking it 'COMPLETED' or 'ABANDONED').
   * If studentId is supplied, strictly validates ownership prior to writing.
   */
  async updateAttempt(
    attemptId: string,
    updates: UpdateAttemptParams,
    studentId?: string
  ): Promise<AssessmentAttemptDocument> {
    if (!attemptId || !attemptId.trim()) {
      throw new Error('[AssessmentRepository] attemptId is required for update.');
    }

    const firestore = getFirestore();
    const docRef = firestore.collection('assessmentAttempts').doc(attemptId.trim());
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`[AssessmentRepository] Attempt with ID "${attemptId}" does not exist.`);
    }

    const existingData = docSnap.data() as AssessmentAttemptDocument;

    // Verify ownership if studentId is provided
    if (studentId && studentId.trim() && existingData.studentId !== studentId.trim()) {
      throw new Error('[AssessmentRepository] Unauthorized: Attempt does not belong to the authenticated student.');
    }

    const fieldsToUpdate: Record<string, any> = {};
    if (updates.status) fieldsToUpdate.status = updates.status;
    if (updates.completedAt) fieldsToUpdate.completedAt = updates.completedAt;
    if (typeof updates.score === 'number') fieldsToUpdate.score = updates.score;
    if (typeof updates.totalQuestions === 'number') fieldsToUpdate.totalQuestions = updates.totalQuestions;
    if (typeof updates.correctCount === 'number') fieldsToUpdate.correctCount = updates.correctCount;
    if (updates.skillSummary) fieldsToUpdate.skillSummary = updates.skillSummary;
    if (typeof updates.passed === 'boolean') fieldsToUpdate.passed = updates.passed;

    await docRef.update(fieldsToUpdate);

    return {
      ...existingData,
      ...fieldsToUpdate,
      id: docRef.id,
    };
  }

  // =========================================================================
  // 4. STUDENT ANSWERS
  // =========================================================================

  /**
   * Stores a student answer record.
   * Validates that the attempt exists, belongs to the student, and is IN_PROGRESS.
   */
  async recordStudentAnswer(params: RecordAnswerParams): Promise<StudentAnswerDocument> {
    if (!params.attemptId || !params.attemptId.trim()) {
      throw new Error('[AssessmentRepository] attemptId is required.');
    }
    if (!params.studentId || !params.studentId.trim()) {
      throw new Error('[AssessmentRepository] studentId is required.');
    }
    if (!params.questionId || !params.questionId.trim()) {
      throw new Error('[AssessmentRepository] questionId is required.');
    }

    const firestore = getFirestore();
    const attemptRef = firestore.collection('assessmentAttempts').doc(params.attemptId.trim());
    const attemptSnap = await attemptRef.get();

    if (!attemptSnap.exists) {
      throw new Error(`[AssessmentRepository] Attempt "${params.attemptId}" does not exist.`);
    }

    const attemptData = attemptSnap.data() as AssessmentAttemptDocument;

    // Strict ownership verification
    if (attemptData.studentId !== params.studentId.trim()) {
      throw new Error('[AssessmentRepository] Unauthorized: Attempt does not belong to the authenticated student.');
    }

    // Session state verification
    if (attemptData.status !== 'IN_PROGRESS') {
      throw new Error(`[AssessmentRepository] Cannot record answer: Attempt is currently "${attemptData.status}".`);
    }

    const answerRef = firestore.collection('studentAnswers').doc();
    const now = new Date().toISOString();

    const answerData: StudentAnswerDocument = {
      id: answerRef.id,
      attemptId: params.attemptId.trim(),
      questionId: params.questionId.trim(),
      studentId: params.studentId.trim(),
      skillId: params.skillId.trim(),
      answer: params.answer,
      isCorrect: params.isCorrect,
      answeredAt: now,
      ...(typeof params.latencyMs === 'number' ? { latencyMs: params.latencyMs } : {}),
      ...(typeof params.timeSeconds === 'number' ? { timeSeconds: params.timeSeconds } : {}),
    };

    await answerRef.set(answerData);
    return answerData;
  }

  /**
   * Retrieves all answers recorded for a given attempt.
   * If studentId is supplied, validates attempt ownership to prevent cross-student leakage.
   */
  async getAnswersByAttempt(attemptId: string, studentId?: string): Promise<StudentAnswerDocument[]> {
    if (!attemptId || !attemptId.trim()) return [];

    const firestore = getFirestore();

    // Verify ownership when studentId is supplied
    if (studentId && studentId.trim()) {
      const attemptSnap = await firestore.collection('assessmentAttempts').doc(attemptId.trim()).get();
      if (!attemptSnap.exists) return [];
      const attempt = attemptSnap.data() as AssessmentAttemptDocument;
      if (attempt.studentId !== studentId.trim()) {
        throw new Error('[AssessmentRepository] Unauthorized: Attempt does not belong to the authenticated student.');
      }
    }

    const snap = await firestore
      .collection('studentAnswers')
      .where('attemptId', '==', attemptId.trim())
      .get();

    const answers: StudentAnswerDocument[] = [];
    snap.forEach((doc) => {
      answers.push({ id: doc.id, ...(doc.data() as Omit<StudentAnswerDocument, 'id'>) });
    });

    return answers.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));
  }
}

/**
 * Singleton repository instance for application-wide data access.
 */
export const assessmentRepository = new AssessmentRepository();
