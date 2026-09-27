import { db } from '../config/firebase.js';
import { CommonStudentInput, SkillEntry } from './mlGateway.js';
import {
  StudentProfileDocument,
  StudentSkillDocument,
  SkillDocument,
  LearningActivityDocument,
  AssessmentAttemptDocument,
  StudentAnswerDocument,
  AssessmentQuestionDocument,
} from '../types/firestore.js';

/**
 * Aggregates real student data from Cloud Firestore collections into the standardized
 * CommonStudentInput payload required by the ML Gateway.
 *
 * Strictly avoids inventing defaults for goal, skill confidence, or assessment pass threshold.
 *
 * @param studentId The authenticated student's Firebase UID
 * @param firestoreDb Injected database client (defaults to production Firestore client)
 * @returns Standardized CommonStudentInput payload
 */
export async function buildCommonStudentInput(
  studentId: string,
  firestoreDb: any = db
): Promise<CommonStudentInput> {
  if (!studentId || !studentId.trim()) {
    throw new Error('[StateAggregator] studentId is required to build student state payload.');
  }

  if (!firestoreDb) {
    throw new Error('[StateAggregator] Firestore database client is not initialized.');
  }
  const firestore = firestoreDb;

  const cleanStudentId = studentId.trim();

  // Execute Firestore collection queries in parallel for efficiency
  const [profileSnap, studentSkillsSnap, activitySnap, assessmentSnap, answersSnap] = await Promise.all([
    firestore.collection('studentProfiles').doc(cleanStudentId).get(),
    firestore.collection('studentSkills').where('studentId', '==', cleanStudentId).get(),
    firestore.collection('learningActivity').where('studentId', '==', cleanStudentId).get(),
    firestore.collection('assessmentAttempts').where('studentId', '==', cleanStudentId).get(),
    firestore.collection('studentAnswers').where('studentId', '==', cleanStudentId).get(),
  ]);

  // 1. Goal & Profile Metadata — Read only real learningGoal, do not invent "Game Developer"
  let goal: string | undefined = undefined;
  if (profileSnap.exists) {
    const profileData = profileSnap.data() as StudentProfileDocument;
    if (profileData && profileData.learningGoal && profileData.learningGoal.trim()) {
      goal = profileData.learningGoal.trim();
    }
  }

  // 2. Student Skills & Skill Names Lookup
  const rawStudentSkills: StudentSkillDocument[] = [];
  const skillIdsToFetch = new Set<string>();

  studentSkillsSnap.forEach((doc: any) => {
    const data = doc.data() as StudentSkillDocument;
    rawStudentSkills.push({
      ...data,
      id: doc.id,
    });
    if (data.skillId) {
      skillIdsToFetch.add(data.skillId);
    }
  });

  // Resolve skill names from 'skills' collection
  const skillNameMap = new Map<string, string>();
  if (skillIdsToFetch.size > 0) {
    const skillFetchPromises = Array.from(skillIdsToFetch).map((skillId) =>
      firestore.collection('skills').doc(skillId).get()
    );
    const skillDocs = await Promise.all(skillFetchPromises);
    skillDocs.forEach((docSnap: any) => {
      if (docSnap.exists) {
        const skillData = docSnap.data() as SkillDocument;
        if (skillData && skillData.name) {
          skillNameMap.set(docSnap.id, skillData.name);
        }
      }
    });
  }

  // Do not hardcode confidence: 0.85; pass real confidence only if present on document
  const skillsList: SkillEntry[] = rawStudentSkills.map((sk) => {
    const skillName = skillNameMap.get(sk.skillId) || sk.skillId || 'Unknown Skill';
    const level = typeof sk.masteryScore === 'number' ? Math.max(0, Math.min(1, sk.masteryScore)) : 0.0;
    const entry: SkillEntry = {
      skill: skillName,
      level: level,
    };
    const rawSk = sk as unknown as Record<string, any>;
    if (typeof rawSk.confidence === 'number') {
      entry.confidence = rawSk.confidence;
    }
    return entry;
  });

  // 3. Learning Activity & Resource History
  const learningHistory: Record<string, any>[] = [];
  const resourceHistory: Record<string, any>[] = [];
  const activityHistory: Record<string, any>[] = [];

  activitySnap.forEach((doc: any) => {
    const data = doc.data() as LearningActivityDocument;
    const actRecord = {
      activity_id: doc.id,
      resource_id: data.resourceId,
      skill_id: data.skillId,
      activity_type: data.activityType,
      started_at: data.startedAt,
      completed_at: data.completedAt || null,
    };

    learningHistory.push(actRecord);
    activityHistory.push(actRecord);

    if (data.activityType === 'COMPLETED') {
      resourceHistory.push({
        resource_id: data.resourceId,
        skill_id: data.skillId,
        completed_at: data.completedAt || data.startedAt || null,
      });
    }
  });

  // 4. Assessment Attempt History & Granular Item Telemetry
  const studentAttemptMap = new Map<string, AssessmentAttemptDocument>();
  assessmentSnap.forEach((doc: any) => {
    const data = doc.data() as AssessmentAttemptDocument;
    studentAttemptMap.set(doc.id, {
      ...data,
      id: doc.id,
    });
  });

  // Collect student answers belonging to verified attempts of this student
  const rawAnswers: StudentAnswerDocument[] = [];
  const questionIdsToFetch = new Set<string>();

  answersSnap.forEach((doc: any) => {
    const data = doc.data() as StudentAnswerDocument;
    // Strictly ensure answer belongs to a verified attempt of this student
    if (data.attemptId && studentAttemptMap.has(data.attemptId)) {
      rawAnswers.push({
        ...data,
        id: doc.id,
      });
      if (data.questionId) {
        questionIdsToFetch.add(data.questionId);
      }
    }
  });

  // Fetch question difficulty from authoritative assessmentQuestions documents
  const questionDifficultyMap = new Map<string, string>();
  if (questionIdsToFetch.size > 0) {
    const questionFetchPromises = Array.from(questionIdsToFetch).map((qId) =>
      firestore.collection('assessmentQuestions').doc(qId).get()
    );
    const questionDocs = await Promise.all(questionFetchPromises);
    questionDocs.forEach((docSnap: any) => {
      if (docSnap && docSnap.exists) {
        const qData = docSnap.data() as AssessmentQuestionDocument;
        if (qData && qData.difficultyLevel && typeof qData.difficultyLevel === 'string') {
          questionDifficultyMap.set(docSnap.id, qData.difficultyLevel);
        }
      }
    });
  }

  // Construct assessment_history telemetry
  const assessmentHistory: Record<string, any>[] = [];

  if (rawAnswers.length > 0) {
    rawAnswers.forEach((ans) => {
      const attempt = studentAttemptMap.get(ans.attemptId)!;
      const record: Record<string, any> = {
        attempt_id: ans.attemptId,
        assessment_id: attempt.assessmentId,
        question_id: ans.questionId,
        skill_id: ans.skillId,
        skill: ans.skillId, // contract-compatible skill field for model adapters
        correct: typeof ans.isCorrect === 'boolean' ? ans.isCorrect : false,
      };

      // Add difficulty ONLY if authoritatively found on question document
      const diff = questionDifficultyMap.get(ans.questionId);
      if (diff) {
        record.difficulty = diff;
      }

      // Add time_seconds from stored timeSeconds or latencyMs
      if (typeof ans.timeSeconds === 'number' && Number.isFinite(ans.timeSeconds) && ans.timeSeconds >= 0) {
        record.time_seconds = ans.timeSeconds;
      } else if (typeof ans.latencyMs === 'number' && Number.isFinite(ans.latencyMs) && ans.latencyMs >= 0) {
        record.time_seconds = Math.round((ans.latencyMs / 1000) * 10) / 10;
      }

      // Preserve overall attempt score separately without pretending it is an item score
      if (typeof attempt.score === 'number') {
        record.attempt_score = attempt.score;
      }

      assessmentHistory.push(record);
    });
  } else {
    // Legacy / zero-answer fallback: preserves attempt-level records if attempts exist without answers
    assessmentSnap.forEach((doc: any) => {
      const data = doc.data() as AssessmentAttemptDocument & Record<string, any>;
      const record: Record<string, any> = {
        attempt_id: doc.id,
        assessment_id: data.assessmentId,
        started_at: data.startedAt,
        completed_at: data.completedAt || null,
      };
      if (typeof data.score === 'number') {
        record.score = data.score;
      }
      if (typeof data.passed === 'boolean') {
        record.passed = data.passed;
      } else if (typeof data.isPassed === 'boolean') {
        record.passed = data.isPassed;
      }
      assessmentHistory.push(record);
    });
  }

  // 5. Construct CommonStudentInput
  return {
    student_id: cleanStudentId,
    ...(goal !== undefined ? { goal } : {}),
    interests: [],
    skills: skillsList,
    learning_history: learningHistory,
    assessment_history: assessmentHistory,
    resource_history: resourceHistory,
    activity_history: activityHistory,
  };
}
