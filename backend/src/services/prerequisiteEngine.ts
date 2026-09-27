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

export interface CanonicalSkillDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  prerequisites: string[];
}

/**
 * Authoritative Canonical Curriculum Definition for Game Development.
 * Represents the 6 foundational and advanced competencies evaluated across
 * placement diagnostics, Model 1 (Skill Gaps), Model 2 (IRT Mastery),
 * Model 3 (Recommendations), and pedagogical prerequisite sequencing.
 */
export const CANONICAL_GAMEDEV_CURRICULUM: CanonicalSkillDefinition[] = [
  {
    id: 'gd-csharp-scripting',
    name: 'C# & Scripting Architecture',
    domain: 'Game Development',
    description: 'Core language fundamentals, object-oriented programming, and component scripting.',
    prerequisites: [],
  },
  {
    id: 'gd-engine-architecture',
    name: 'Game Engine Architecture',
    domain: 'Game Development',
    description: 'Engine lifecycle, scene graph, game loop, and component-based entity management.',
    prerequisites: [],
  },
  {
    id: 'gd-game-design',
    name: 'Game Design & Mechanics',
    domain: 'Game Development',
    description: 'Core gameplay loops, player mechanics, level progression, and balance systems.',
    prerequisites: [],
  },
  {
    id: 'gd-math-physics',
    name: 'Game Mathematics & Physics',
    domain: 'Game Development',
    description: 'Vectors, transforms, rigidbodies, collisions, and raycasting.',
    prerequisites: ['gd-csharp-scripting', 'gd-engine-architecture'],
  },
  {
    id: 'gd-game-ai',
    name: 'Game AI & State Machines',
    domain: 'Game Development',
    description: 'Finite state machines, pathfinding algorithms, steering behaviors, and NPC decision-making.',
    prerequisites: ['gd-csharp-scripting', 'gd-game-design'],
  },
  {
    id: 'gd-graphics-shaders',
    name: 'Graphics & Shaders',
    domain: 'Game Development',
    description: 'Render pipelines, material systems, vertex and fragment shaders, and lighting models.',
    prerequisites: ['gd-engine-architecture', 'gd-math-physics'],
  },
];

function normalizeKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/^gd[-_]/, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves student skill mastery and in-progress status from authoritative sources:
 * Priority 1: Persisted studentSkills document from Firestore (if present)
 * Priority 2: Model 2 Mastery evaluations from ML Plan (mastery_status / mastery_probability >= 0.80)
 */
function resolveStudentSkillState(
  skillId: string,
  skillName: string,
  studentSkillMap: Map<string, StudentSkillDocument>,
  mlMasteryMap: Map<
    string,
    {
      mastery_status?: string;
      mastery_probability?: number;
      recommended_difficulty?: string;
    }
  >
): { isMastered: boolean; isInProgress: boolean; masteryScore?: number; recommendedDifficulty?: string } {
  // 1. Priority 1: Stored studentSkills document
  const stored = studentSkillMap.get(skillId);
  if (stored) {
    const statusUpper = (stored.status || '').toUpperCase();
    const isMastered =
      statusUpper === 'MASTERED' ||
      (typeof stored.masteryScore === 'number' && stored.masteryScore >= 0.8);
    const isInProgress =
      statusUpper === 'IN_PROGRESS' ||
      (typeof stored.masteryScore === 'number' && stored.masteryScore >= 0.5);

    return {
      isMastered,
      isInProgress,
      masteryScore: typeof stored.masteryScore === 'number' ? stored.masteryScore : isMastered ? 1.0 : 0.0,
    };
  }

  // 2. Priority 2: Model 2 mastery evaluation from ML plan
  const exactKey = skillId.toLowerCase();
  const norm1 = skillId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm2 = normalizeKey(skillId);
  const normName = normalizeKey(skillName);

  const mlEval =
    mlMasteryMap.get(exactKey) ||
    mlMasteryMap.get(norm1) ||
    mlMasteryMap.get(norm2) ||
    mlMasteryMap.get(normName);

  if (mlEval) {
    const status = mlEval.mastery_status;
    const prob = mlEval.mastery_probability;
    const isMastered = status === 'MASTERED' || (typeof prob === 'number' && prob >= 0.8);
    const isInProgress =
      status === 'DEVELOPING' ||
      (typeof prob === 'number' && prob >= 0.5 && prob < 0.8);

    return {
      isMastered,
      isInProgress,
      masteryScore: typeof prob === 'number' ? prob : isMastered ? 0.85 : 0.3,
      recommendedDifficulty: mlEval.recommended_difficulty,
    };
  }

  return { isMastered: false, isInProgress: false, masteryScore: undefined };
}

/**
 * Pure function to evaluate a prerequisite graph deterministically.
 * A skill is UNLOCKED if and only if all of its prerequisite skills have been mastered.
 * Otherwise, if any prerequisite is unsatisfied, the skill is LOCKED.
 */
export function evaluatePrerequisiteGraph(params: {
  skills?: SkillDocument[];
  prerequisites?: SkillPrerequisiteDocument[];
  studentSkills?: StudentSkillDocument[];
  mlPlan?: UnifiedPersonalizedPlan | null;
}): PathwayNode[] {
  const { skills = [], prerequisites = [], studentSkills = [], mlPlan } = params;

  // 1. Establish effective skills & prerequisites (fallback to canonical curriculum when unseeded)
  const effectiveSkills: SkillDocument[] =
    skills.length > 0
      ? skills
      : CANONICAL_GAMEDEV_CURRICULUM.map((c) => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          description: c.description,
          createdAt: '',
          updatedAt: '',
        }));

  const effectivePrereqs: SkillPrerequisiteDocument[] =
    prerequisites.length > 0
      ? prerequisites
      : CANONICAL_GAMEDEV_CURRICULUM.flatMap((c) =>
          c.prerequisites.map((pId) => ({
            id: `${c.id}_prereq_${pId}`,
            skillId: c.id,
            prerequisiteSkillId: pId,
            createdAt: '',
          }))
        );

  // 2. Build lookup maps
  const skillMap = new Map<string, SkillDocument>();
  for (const s of effectiveSkills) {
    skillMap.set(s.id, s);
  }

  const prereqMap = new Map<string, string[]>();
  for (const p of effectivePrereqs) {
    if (!prereqMap.has(p.skillId)) {
      prereqMap.set(p.skillId, []);
    }
    prereqMap.get(p.skillId)!.push(p.prerequisiteSkillId);
  }

  const studentSkillMap = new Map<string, StudentSkillDocument>();
  for (const ss of studentSkills) {
    studentSkillMap.set(ss.skillId, ss);
  }

  // Maps for ML plan enrichment
  const mlGapsMap = new Map<string, { priority?: string; status?: string }>();
  if (mlPlan?.skill_gaps) {
    for (const gap of mlPlan.skill_gaps) {
      const raw = String(gap.skill || '');
      const norm1 = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
      const norm2 = normalizeKey(raw);
      const gapVal = { priority: gap.priority, status: gap.status };
      mlGapsMap.set(raw.toLowerCase(), gapVal);
      mlGapsMap.set(norm1, gapVal);
      mlGapsMap.set(norm2, gapVal);
    }
  }

  const mlMasteryMap = new Map<
    string,
    {
      mastery_status?: string;
      mastery_probability?: number;
      recommended_difficulty?: string;
      confidence?: number;
    }
  >();

  if (mlPlan?.mastery) {
    for (const m of mlPlan.mastery) {
      const raw = String(m.skill || '');
      const norm1 = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
      const norm2 = normalizeKey(raw);
      const val = {
        mastery_status: m.mastery_status ? String(m.mastery_status).toUpperCase() : undefined,
        mastery_probability: typeof m.mastery_probability === 'number' ? m.mastery_probability : undefined,
        recommended_difficulty: m.recommended_next_difficulty,
        confidence: typeof m.confidence === 'number' ? m.confidence : undefined,
      };
      mlMasteryMap.set(raw.toLowerCase(), val);
      mlMasteryMap.set(norm1, val);
      mlMasteryMap.set(norm2, val);
    }
  }

  // 3. Evaluate each skill
  const nodes: PathwayNode[] = [];

  for (const skill of effectiveSkills) {
    const skillId = skill.id;
    const prereqIds = prereqMap.get(skillId) || [];

    // Identify unsatisfied prerequisites
    const blockingPrereqs: string[] = [];
    for (const pid of prereqIds) {
      const pDoc = skillMap.get(pid);
      const pName = pDoc?.name || pid;
      const pState = resolveStudentSkillState(pid, pName, studentSkillMap, mlMasteryMap);
      if (!pState.isMastered) {
        blockingPrereqs.push(pid);
      }
    }

    // Determine deterministic unlock status
    const selfState = resolveStudentSkillState(skillId, skill.name || skillId, studentSkillMap, mlMasteryMap);
    let status: PathwayNodeStatus = 'UNLOCKED';

    if (selfState.isMastered) {
      status = 'MASTERED';
    } else if (blockingPrereqs.length > 0) {
      status = 'LOCKED';
    } else if (selfState.isInProgress) {
      status = 'IN_PROGRESS';
    } else {
      status = 'UNLOCKED';
    }

    // ML gap info lookup
    const normKey = normalizeKey(skill.name || skillId);
    const normIdKey = normalizeKey(skillId);
    const gapInfo =
      mlGapsMap.get(skillId.toLowerCase()) ||
      mlGapsMap.get(normIdKey) ||
      mlGapsMap.get(normKey);

    nodes.push({
      skill_id: skillId,
      skill_name: skill.name || skillId,
      status,
      prerequisites: prereqIds,
      blocking_prerequisites: blockingPrereqs,
      mastery_level: selfState.masteryScore,
      recommended_difficulty: selfState.recommendedDifficulty,
      priority: gapInfo?.priority,
      domain: skill.domain,
      description: skill.description,
    });
  }

  // 4. Deterministic Topological Sorting (Prerequisites appear before dependents)
  const statusWeight: Record<PathwayNodeStatus, number> = {
    MASTERED: 1,
    IN_PROGRESS: 2,
    UNLOCKED: 3,
    LOCKED: 4,
  };

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
