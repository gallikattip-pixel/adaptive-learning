export type PathwayNodeStatus =
  | 'LOCKED'
  | 'UNLOCKED'
  | 'IN_PROGRESS'
  | 'MASTERED'
  | 'unlocked'
  | 'locked'
  | 'in_progress'
  | 'mastered'
  | 'gap_detected';

export type SkillNodeStatus = PathwayNodeStatus;

export interface PathwayNode {
  skill_id: string;
  skill_name: string;
  status: PathwayNodeStatus;
  prerequisites: string[];
  blocking_prerequisites: string[];
  mastery_level?: number;
  recommended_difficulty?: string;
  priority?: string;
  domain?: string;
  description?: string;
}

export interface StudentPathway {
  student_id: string;
  nodes: PathwayNode[];
}

export interface SkillNode {
  id: string;
  code: string;
  title: string;
  description: string;
  domain: string;
  prerequisiteIds: string[];
  status?: SkillNodeStatus;
}

export interface LearningPathway {
  id: string;
  title: string;
  description: string;
  targetSkillId: string;
  nodes: SkillNode[];
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticAssessment {
  id: string;
  title: string;
  domain: string;
  estimatedMinutes: number;
  totalItems: number;
}

export interface MasteryAssessmentResult {
  assessmentId: string;
  studentId: string;
  masteredSkillIds: string[];
  gapSkillIds: string[];
  confidenceScore: number;
  completedAt: string;
}

export interface DiagnosticQuestion {
  id: string;
  assessmentId: string;
  skillId: string;
  questionText: string;
  questionType: string;
  options: string[];
  difficulty: number;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
  createdAt: string;
}

export interface DiagnosticStartResponse {
  attemptId: string;
  assessment: {
    id: string;
    title: string;
    description: string;
    domain: string;
  };
  questions: DiagnosticQuestion[];
  startedAt: string;
  totalQuestions: number;
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  answer: string;
  latencyMs?: number;
}

export interface DiagnosticSubmitRequest {
  attemptId: string;
  answers: DiagnosticAnswerSubmission[];
}

export interface DiagnosticSkillSummary {
  skillId: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
}

export interface DiagnosticSubmitResponse {
  attemptId: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  skillSummary: Record<string, DiagnosticSkillSummary>;
  completedAt: string;
}
