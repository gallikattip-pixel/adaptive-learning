import {
  assessmentRepository,
  StudentFacingQuestion,
} from '../repositories/assessmentRepository.js';
import type { SkillAttemptSummary } from '../types/firestore.js';

export class DiagnosticError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'DIAGNOSTIC_ERROR') {
    super(message);
    this.name = 'DiagnosticError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface DiagnosticStartResult {
  attemptId: string;
  assessment: {
    id: string;
    title: string;
    description: string;
    domain: string;
  };
  questions: StudentFacingQuestion[];
  startedAt: string;
  totalQuestions: number;
}

export interface SubmittedAnswerItem {
  questionId: string;
  answer: string;
  latencyMs?: number;
}

export interface DiagnosticSubmitResult {
  attemptId: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  skillSummary: Record<string, SkillAttemptSummary>;
  completedAt: string;
}

export class DiagnosticService {
  /**
   * Initializes or resumes a placement diagnostic session for the authenticated student.
   * Ensures questions returned are strictly sanitized (no correctAnswer or explanation).
   */
  async startDiagnostic(studentId: string, requestedAssessmentId?: string): Promise<DiagnosticStartResult> {
    if (!studentId || !studentId.trim()) {
      throw new DiagnosticError('Authenticated student ID is required.', 401, 'UNAUTHORIZED');
    }
    const cleanStudentId = studentId.trim();

    // 1. Locate the appropriate PLACEMENT assessment
    let assessment = null;
    if (requestedAssessmentId && requestedAssessmentId.trim()) {
      assessment = await assessmentRepository.getAssessmentById(requestedAssessmentId.trim());
      if (!assessment || assessment.assessmentType !== 'PLACEMENT') {
        throw new DiagnosticError(
          `Placement assessment "${requestedAssessmentId}" was not found.`,
          404,
          'ASSESSMENT_NOT_FOUND'
        );
      }
    } else {
      // Primary: Look for domain-anchored Game Development placement assessment
      const gameDevPlacements = await assessmentRepository.getPlacementAssessments('Game Development');
      if (gameDevPlacements.length > 0) {
        assessment = gameDevPlacements[0];
      } else {
        // Fallback: Check for any placement assessment
        const anyPlacements = await assessmentRepository.getPlacementAssessments();
        if (anyPlacements.length > 0) {
          assessment = anyPlacements[0];
        }
      }
    }

    if (!assessment) {
      throw new DiagnosticError(
        'No placement assessment is currently configured in the system.',
        404,
        'PLACEMENT_NOT_CONFIGURED'
      );
    }

    // 2. Retrieve student-safe questions (sanitized: correctAnswer and explanation omitted)
    const questions = await assessmentRepository.getStudentFacingQuestions(assessment.id);
    if (!questions || questions.length === 0) {
      throw new DiagnosticError(
        `Placement assessment "${assessment.title}" has no questions configured.`,
        404,
        'QUESTIONS_NOT_CONFIGURED'
      );
    }

    // 3. Check for an existing active attempt or create a new IN_PROGRESS attempt
    const existingAttempts = await assessmentRepository.getAttemptsByStudent(cleanStudentId);
    const activeAttempt = existingAttempts.find(
      (a) => a.assessmentId === assessment!.id && a.status === 'IN_PROGRESS'
    );

    let attempt = activeAttempt;
    if (!attempt) {
      attempt = await assessmentRepository.createAttempt({
        assessmentId: assessment.id,
        studentId: cleanStudentId,
        totalQuestions: questions.length,
      });
    }

    return {
      attemptId: attempt.id,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        domain: assessment.domain || 'Game Development',
      },
      questions,
      startedAt: attempt.startedAt,
      totalQuestions: questions.length,
    };
  }

  /**
   * Submits answers for an in-progress diagnostic assessment attempt.
   * Performs authoritative server-side grading, latency recording, and scoring.
   */
  async submitDiagnostic(
    studentId: string,
    attemptId: string,
    answers: SubmittedAnswerItem[]
  ): Promise<DiagnosticSubmitResult> {
    if (!studentId || !studentId.trim()) {
      throw new DiagnosticError('Authenticated student ID is required.', 401, 'UNAUTHORIZED');
    }
    const cleanStudentId = studentId.trim();

    if (!attemptId || typeof attemptId !== 'string' || !attemptId.trim()) {
      throw new DiagnosticError('A valid attemptId is required.', 400, 'INVALID_ATTEMPT_ID');
    }
    const cleanAttemptId = attemptId.trim();

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new DiagnosticError('Submission must contain a non-empty answers array.', 400, 'EMPTY_ANSWERS');
    }

    // 1. Duplicate question submission protection
    const seenQuestionIds = new Set<string>();
    for (const item of answers) {
      if (!item.questionId || typeof item.questionId !== 'string' || !item.questionId.trim()) {
        throw new DiagnosticError('Each answer must specify a valid questionId.', 400, 'INVALID_QUESTION_ID');
      }
      const qId = item.questionId.trim();
      if (seenQuestionIds.has(qId)) {
        throw new DiagnosticError(
          `Duplicate answer submitted for questionId "${qId}".`,
          400,
          'DUPLICATE_QUESTION_SUBMISSION'
        );
      }
      seenQuestionIds.add(qId);

      if (typeof item.answer !== 'string' || !item.answer.trim()) {
        throw new DiagnosticError(
          `Answer for question "${qId}" must be a non-empty string.`,
          400,
          'INVALID_ANSWER_FORMAT'
        );
      }

      if (item.latencyMs !== undefined) {
        if (typeof item.latencyMs !== 'number' || !Number.isFinite(item.latencyMs) || item.latencyMs < 0) {
          throw new DiagnosticError(
            `latencyMs for question "${qId}" must be a non-negative finite number.`,
            400,
            'INVALID_LATENCY'
          );
        }
      }
    }

    // 2. Retrieve attempt and verify ownership & state
    const attempt = await assessmentRepository.getAttemptById(cleanAttemptId);
    if (!attempt) {
      throw new DiagnosticError(`Attempt "${cleanAttemptId}" was not found.`, 404, 'ATTEMPT_NOT_FOUND');
    }

    if (attempt.studentId !== cleanStudentId) {
      throw new DiagnosticError(
        'Unauthorized: Attempt does not belong to the authenticated student.',
        403,
        'FORBIDDEN'
      );
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new DiagnosticError(
        `Attempt "${cleanAttemptId}" is already ${attempt.status} and cannot be submitted again.`,
        409,
        'ATTEMPT_ALREADY_FINALIZED'
      );
    }

    // 3. Retrieve authoritative questions using internal method (including correctAnswer)
    const authoritativeQuestions = await assessmentRepository.getQuestionsByAssessmentId(attempt.assessmentId);
    if (!authoritativeQuestions || authoritativeQuestions.length === 0) {
      throw new DiagnosticError(
        `Assessment "${attempt.assessmentId}" has no authoritative questions.`,
        500,
        'QUESTIONS_NOT_FOUND'
      );
    }

    const questionMap = new Map(authoritativeQuestions.map((q) => [q.id, q]));

    // 4. Verify that every submitted question belongs to the assessment
    for (const item of answers) {
      const qId = item.questionId.trim();
      if (!questionMap.has(qId)) {
        throw new DiagnosticError(
          `Question "${qId}" does not belong to assessment "${attempt.assessmentId}".`,
          400,
          'QUESTION_NOT_IN_ASSESSMENT'
        );
      }
    }

    // 5. Initialize per-skill tracking
    const skillStats: Record<string, { total: number; correct: number }> = {};
    for (const q of authoritativeQuestions) {
      if (!skillStats[q.skillId]) {
        skillStats[q.skillId] = { total: 0, correct: 0 };
      }
      skillStats[q.skillId].total += 1;
    }

    // 6. Server-side grading & answer persistence
    let correctCount = 0;

    for (const item of answers) {
      const q = questionMap.get(item.questionId.trim())!;
      const cleanAnswer = item.answer.trim();
      const isCorrect = cleanAnswer.toLowerCase() === q.correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctCount += 1;
        if (skillStats[q.skillId]) {
          skillStats[q.skillId].correct += 1;
        }
      }

      let latencyMs: number | undefined = undefined;
      let timeSeconds: number | undefined = undefined;
      if (typeof item.latencyMs === 'number' && Number.isFinite(item.latencyMs) && item.latencyMs >= 0) {
        latencyMs = Math.round(item.latencyMs);
        timeSeconds = Math.round((item.latencyMs / 1000) * 10) / 10;
      }

      await assessmentRepository.recordStudentAnswer({
        attemptId: attempt.id,
        questionId: q.id,
        studentId: cleanStudentId,
        skillId: q.skillId,
        answer: cleanAnswer,
        isCorrect,
        latencyMs,
        timeSeconds,
      });
    }

    // 7. Calculate score & skill summary
    const totalQuestions = authoritativeQuestions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 1000 : 0;

    const skillSummary: Record<string, SkillAttemptSummary> = {};
    for (const [skillId, stats] of Object.entries(skillStats)) {
      skillSummary[skillId] = {
        skillId,
        totalQuestions: stats.total,
        correctCount: stats.correct,
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 1000) / 1000 : 0,
      };
    }

    // 8. Finalize attempt in repository
    const now = new Date().toISOString();
    const completedAttempt = await assessmentRepository.updateAttempt(
      attempt.id,
      {
        status: 'COMPLETED',
        completedAt: now,
        score,
        totalQuestions,
        correctCount,
        skillSummary,
      },
      cleanStudentId
    );

    return {
      attemptId: completedAttempt.id,
      status: completedAttempt.status,
      totalQuestions,
      correctCount,
      score,
      skillSummary,
      completedAt: now,
    };
  }
}

export const diagnosticService = new DiagnosticService();
