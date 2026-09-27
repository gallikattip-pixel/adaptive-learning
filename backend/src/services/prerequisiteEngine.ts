import { db } from '../config/firebase.js';
import { buildCommonStudentInput } from './stateAggregator.js';
import { generatePersonalizedPlan, UnifiedPersonalizedPlan } from './mlGateway.js';
import type {
  SkillDocument,
  SkillPrerequisiteDocument,
  StudentSkillDocument,
} from '../types/firestore.js';

export type PathwayNodeStatus = 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'MASTERED';

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

/**
 * Pure function to evaluate a prerequisite graph deterministically.
 * A skill is UNLOCKED if and only if all of its prerequisite skills have status === 'MASTERED'.
 * Otherwise, if any prerequisite is unsatisfied, the skill is LOCKED.
 */
export function evaluatePrerequisiteGraph(params: {
  skills: SkillDocument[];
  prerequisites: SkillPrerequisiteDocument[];
  studentSkills: StudentSkillDocument[];
  mlPlan?: UnifiedPersonalizedPlan | null;
}): PathwayNode[] {
  const { skills, prerequisites, studentSkills, mlPlan } = params;

  // 1. Build lookup maps
  const skillMap = new Map<string, SkillDocument>();
  for (const s of skills) {
    skillMap.set(s.id, s);
  }

  // Map of skillId -> array of prerequisiteSkillId
  const prereqMap = new Map<string, string[]>();
  for (const p of prerequisites) {
    if (!prereqMap.has(p.skillId)) {
      prereqMap.set(p.skillId, []);
    }
    prereqMap.get(p.skillId)!.push(p.prerequisiteSkillId);
  }

  // Map of studentSkill: skillId -> StudentSkillDocument
  const studentSkillMap = new Map<string, StudentSkillDocument>();
  for (const ss of studentSkills) {
    studentSkillMap.set(ss.skillId, ss);
  }

  // Maps for ML plan enrichment
  const mlGapsMap = new Map<string, { priority?: string; status?: string }>();
  if (mlPlan?.skill_gaps) {
    for (const gap of mlPlan.skill_gaps) {
      const normalized = (gap.skill || '').toLowerCase().replace(/[ _-]/g, '');
      mlGapsMap.set(normalized, { priority: gap.priority, status: gap.status });
    }
  }

  const mlMasteryMap = new Map<string, { recommended_difficulty?: string; mastery_probability?: number }>();
  if (mlPlan?.mastery) {
    for (const m of mlPlan.mastery) {
      const normalized = (m.skill || '').toLowerCase().replace(/[ _-]/g, '');
      mlMasteryMap.set(normalized, {
        recommended_difficulty: m.recommended_next_difficulty,
        mastery_probability: m.mastery_probability,
      });
    }
  }

  // 2. Evaluate each skill
  const nodes: PathwayNode[] = [];

  for (const skill of skills) {
    const skillId = skill.id;
    const prereqIds = prereqMap.get(skillId) || [];

    // Identify unsatisfied prerequisites
    const blockingPrereqs: string[] = [];
    for (const pid of prereqIds) {
      const pRecord = studentSkillMap.get(pid);
      const isMastered = pRecord?.status === 'MASTERED';
      if (!isMastered) {
        blockingPrereqs.push(pid);
      }
    }

    // Determine deterministic unlock status
    const studentRecord = studentSkillMap.get(skillId);
    let status: PathwayNodeStatus = 'UNLOCKED';

    if (studentRecord?.status === 'MASTERED') {
      status = 'MASTERED';
    } else if (blockingPrereqs.length > 0) {
      status = 'LOCKED';
    } else if (studentRecord?.status === 'IN_PROGRESS') {
      status = 'IN_PROGRESS';
    } else {
      status = 'UNLOCKED';
    }

    // ML enrichment (non-blocking, advisory metrics only)
    const normKey = (skill.name || skillId).toLowerCase().replace(/[ _-]/g, '');
    const normIdKey = skillId.toLowerCase().replace(/[ _-]/g, '');
    const gapInfo = mlGapsMap.get(normKey) || mlGapsMap.get(normIdKey);
    const masteryInfo = mlMasteryMap.get(normKey) || mlMasteryMap.get(normIdKey);

    let masteryLevel: number | undefined = undefined;
    if (typeof studentRecord?.masteryScore === 'number') {
      masteryLevel = studentRecord.masteryScore;
    } else if (typeof masteryInfo?.mastery_probability === 'number') {
      masteryLevel = masteryInfo.mastery_probability;
    }

    nodes.push({
      skill_id: skillId,
      skill_name: skill.name || skillId,
      status,
      prerequisites: prereqIds,
      blocking_prerequisites: blockingPrereqs,
      mastery_level: masteryLevel,
      recommended_difficulty: masteryInfo?.recommended_difficulty,
      priority: gapInfo?.priority,
      domain: skill.domain,
      description: skill.description,
    });
  }

  // 3. Deterministic Topological Sorting (Prerequisites appear before dependents)
  const statusWeight: Record<PathwayNodeStatus, number> = {
    MASTERED: 1,
    IN_PROGRESS: 2,
    UNLOCKED: 3,
    LOCKED: 4,
  };

  // Build in-degree map for topological sort
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    inDegree.set(n.skill_id, 0);
    adj.set(n.skill_id, []);
  }

  for (const n of nodes) {
    for (const prereqId of n.prerequisites) {
      if (adj.has(prereqId)) {
        adj.get(prereqId)!.push(n.skill_id);
        inDegree.set(n.skill_id, (inDegree.get(n.skill_id) || 0) + 1);
      }
    }
  }

  // Queue of nodes with 0 prerequisites in current evaluation
  const nodeMap = new Map<string, PathwayNode>(nodes.map((n) => [n.skill_id, n]));
  const sorted: PathwayNode[] = [];
  const queue: string[] = [];

  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  // Tie-breaker comparator
  const compareNodes = (aId: string, bId: string) => {
    const nodeA = nodeMap.get(aId)!;
    const nodeB = nodeMap.get(bId)!;
    const weightDiff = (statusWeight[nodeA.status] || 99) - (statusWeight[nodeB.status] || 99);
    if (weightDiff !== 0) return weightDiff;
    return nodeA.skill_name.localeCompare(nodeB.skill_name);
  };

  queue.sort(compareNodes);

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const node = nodeMap.get(currId);
    if (node) sorted.push(node);

    const neighbors = adj.get(currId) || [];
    for (const nxt of neighbors) {
      const newDeg = (inDegree.get(nxt) || 1) - 1;
      inDegree.set(nxt, newDeg);
      if (newDeg === 0) {
        queue.push(nxt);
        queue.sort(compareNodes);
      }
    }
  }

  // Append any cycle-bound or unvisited nodes safely
  for (const n of nodes) {
    if (!sorted.some((s) => s.skill_id === n.skill_id)) {
      sorted.push(n);
    }
  }

  return sorted;
}

/**
 * Builds the real student pathway from Cloud Firestore collections and ML Gateway plan.
 *
 * @param studentId The authenticated student's Firebase UID
 * @returns Deterministic StudentPathway
 */
export async function buildStudentPathway(studentId: string): Promise<StudentPathway> {
  if (!studentId || !studentId.trim()) {
    throw new Error('[PrerequisiteEngine] studentId is required to build student pathway.');
  }

  if (!db) {
    throw new Error('[PrerequisiteEngine] Firestore database client is not initialized.');
  }
  const firestore = db;
  const cleanStudentId = studentId.trim();

  // 1. Fetch real Firestore collections and ML plan in parallel
  const [skillsSnap, prereqsSnap, studentSkillsSnap, mlPlan] = await Promise.all([
    firestore.collection('skills').get(),
    firestore.collection('skillPrerequisites').get(),
    firestore.collection('studentSkills').where('studentId', '==', cleanStudentId).get(),
    (async () => {
      try {
        const studentInput = await buildCommonStudentInput(cleanStudentId);
        return await generatePersonalizedPlan(studentInput);
      } catch (err) {
        // Non-blocking: ML Gateway errors do not bring down deterministic prerequisite evaluation
        console.warn(
          '[PrerequisiteEngine] ML Gateway plan generation failed (operating in fallback mode):',
          err instanceof Error ? err.message : 'Unknown error'
        );
        return null;
      }
    })(),
  ]);

  // 2. Parse Firestore documents
  const skills: SkillDocument[] = [];
  skillsSnap.forEach((doc) => {
    skills.push({ ...(doc.data() as SkillDocument), id: doc.id });
  });

  const prerequisites: SkillPrerequisiteDocument[] = [];
  prereqsSnap.forEach((doc) => {
    prerequisites.push({ ...(doc.data() as SkillPrerequisiteDocument), id: doc.id });
  });

  const studentSkills: StudentSkillDocument[] = [];
  studentSkillsSnap.forEach((doc) => {
    studentSkills.push({ ...(doc.data() as StudentSkillDocument), id: doc.id });
  });

  // 3. Evaluate prerequisite graph
  const nodes = evaluatePrerequisiteGraph({
    skills,
    prerequisites,
    studentSkills,
    mlPlan,
  });

  return {
    student_id: cleanStudentId,
    nodes,
  };
}
