export type SkillNodeStatus = 'unlocked' | 'locked' | 'in_progress' | 'mastered' | 'gap_detected';

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
