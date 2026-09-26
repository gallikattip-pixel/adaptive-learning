/**
 * Firestore Collection Schema Type Definitions
 * Stage 1 Schema Foundations for Adaptive Learning
 * Note: Zero seed/demo data is created.
 */

// 1. users/{uid}
export interface UserDocument {
  uid: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 2. studentProfiles/{uid}
export interface StudentProfileDocument {
  uid: string;
  firstName: string;
  lastName: string;
  learningGoal?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. skills/{skillId}
export interface SkillDocument {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

// 4. skillPrerequisites/{relationshipId}
export interface SkillPrerequisiteDocument {
  id: string;
  skillId: string;
  prerequisiteSkillId: string;
  createdAt: string;
}

// 5. studentSkills/{studentSkillId}
export type StudentSkillStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';

export interface StudentSkillDocument {
  id: string;
  studentId: string;
  skillId: string;
  status: StudentSkillStatus;
  masteryScore: number;
  updatedAt: string;
}

// 6. learningResources/{resourceId}
export type ResourceType = 'COURSE' | 'VIDEO' | 'PROJECT' | 'ARTICLE';

export interface LearningResourceDocument {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  url: string;
  skillId: string;
  difficulty: number;
  createdAt: string;
  updatedAt: string;
}

// 7. assessments/{assessmentId}
export type AssessmentType = 'PLACEMENT' | 'PRACTICE' | 'WEEKLY';

export interface AssessmentDocument {
  id: string;
  title: string;
  description: string;
  assessmentType: AssessmentType;
  skillId: string;
  createdAt: string;
  updatedAt: string;
}

// 8. assessmentQuestions/{questionId}
export interface AssessmentQuestionDocument {
  id: string;
  assessmentId: string;
  questionText: string;
  questionType: string;
  difficulty: number;
  createdAt: string;
}

// 9. assessmentAttempts/{attemptId}
export interface AssessmentAttemptDocument {
  id: string;
  assessmentId: string;
  studentId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
}

// 10. studentAnswers/{answerId}
export interface StudentAnswerDocument {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  answeredAt: string;
}

// 11. learningActivity/{activityId}
export type ActivityType = 'STARTED' | 'COMPLETED' | 'PRACTICED';

export interface LearningActivityDocument {
  id: string;
  studentId: string;
  resourceId: string;
  skillId: string;
  activityType: ActivityType;
  startedAt: string;
  completedAt?: string;
}
