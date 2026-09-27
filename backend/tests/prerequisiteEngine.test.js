/**
 * Focused Unit Test Suite for Prerequisite Engine & Roadmap Generation
 *
 * Verifies:
 * 1. Six canonical curriculum skills are generated.
 * 2. Root skills (C#, Engine Architecture, Game Design) have no prerequisites.
 * 3. Physics requires C# + Engine Architecture.
 * 4. AI requires C# + Game Design.
 * 5. Graphics/Shaders requires Engine Architecture + Physics.
 * 6. MASTERED status comes from existing Model 2 data (mastery_status / probability >= 0.80).
 * 7. Dependent skills lock/unlock correctly based on prerequisite mastery.
 * 8. Topological ordering remains strictly valid (prerequisites appear before dependents).
 * 9. Empty Firestore skills collection no longer produces nodes = [].
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

async function runPrerequisiteEngineTests() {
  console.log('================================================================');
  console.log('PREREQUISITE ENGINE & ROADMAP GENERATION UNIT TESTS');
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

  // Load from compiled dist or src
  const { evaluatePrerequisiteGraph, CANONICAL_GAMEDEV_CURRICULUM } = await import(
    pathToFileURL(path.join(backendDir, 'dist/services/prerequisiteEngine.js')).href
  );

  // ---------------------------------------------------------------------------
  // TEST 1 & 9: Empty Firestore collections generate all 6 canonical skills
  // ---------------------------------------------------------------------------
  const emptyNodes = evaluatePrerequisiteGraph({
    skills: [],
    prerequisites: [],
    studentSkills: [],
    mlPlan: null,
  });

  assert(
    'Empty Firestore skills collection produces exactly 6 canonical skills',
    Array.isArray(emptyNodes) && emptyNodes.length === 6
  );

  const skillIds = emptyNodes.map((n) => n.skill_id);
  const expectedSkillIds = [
    'gd-csharp-scripting',
    'gd-engine-architecture',
    'gd-game-design',
    'gd-math-physics',
    'gd-game-ai',
    'gd-graphics-shaders',
  ];
  assert(
    'All 6 canonical GameDev skill IDs are present in the output',
    expectedSkillIds.every((id) => skillIds.includes(id))
  );

  // ---------------------------------------------------------------------------
  // TEST 2: Root skills have zero prerequisites and start UNLOCKED
  // ---------------------------------------------------------------------------
  const csharpNode = emptyNodes.find((n) => n.skill_id === 'gd-csharp-scripting');
  const engineNode = emptyNodes.find((n) => n.skill_id === 'gd-engine-architecture');
  const designNode = emptyNodes.find((n) => n.skill_id === 'gd-game-design');

  assert('Root skill C# has 0 prerequisites', csharpNode?.prerequisites.length === 0);
  assert('Root skill Engine Architecture has 0 prerequisites', engineNode?.prerequisites.length === 0);
  assert('Root skill Game Design has 0 prerequisites', designNode?.prerequisites.length === 0);

  assert(
    'Root skills default to UNLOCKED status when not yet mastered',
    csharpNode?.status === 'UNLOCKED' &&
      engineNode?.status === 'UNLOCKED' &&
      designNode?.status === 'UNLOCKED'
  );

  // ---------------------------------------------------------------------------
  // TEST 3, 4, 5: Dependency relationships (Physics, AI, Graphics)
  // ---------------------------------------------------------------------------
  const physicsNode = emptyNodes.find((n) => n.skill_id === 'gd-math-physics');
  const aiNode = emptyNodes.find((n) => n.skill_id === 'gd-game-ai');
  const graphicsNode = emptyNodes.find((n) => n.skill_id === 'gd-graphics-shaders');

  assert(
    'Physics requires C# + Engine Architecture',
    physicsNode?.prerequisites.includes('gd-csharp-scripting') &&
      physicsNode?.prerequisites.includes('gd-engine-architecture') &&
      physicsNode?.prerequisites.length === 2
  );

  assert(
    'AI requires C# + Game Design',
    aiNode?.prerequisites.includes('gd-csharp-scripting') &&
      aiNode?.prerequisites.includes('gd-game-design') &&
      aiNode?.prerequisites.length === 2
  );

  assert(
    'Graphics/Shaders requires Engine Architecture + Physics',
    graphicsNode?.prerequisites.includes('gd-engine-architecture') &&
      graphicsNode?.prerequisites.includes('gd-math-physics') &&
      graphicsNode?.prerequisites.length === 2
  );

  // ---------------------------------------------------------------------------
  // TEST 6: MASTERED status comes from existing Model 2 data
  // ---------------------------------------------------------------------------
  const mlPlanWithMastery = {
    student_id: 'test_student',
    mastery: [
      {
        skill: 'gd-csharp-scripting',
        mastery_probability: 0.85,
        mastery_status: 'MASTERED',
        recommended_next_difficulty: 'MEDIUM',
      },
      {
        skill: 'gd-engine-architecture',
        mastery_probability: 0.90,
        mastery_status: 'MASTERED',
        recommended_next_difficulty: 'HARD',
      },
      {
        skill: 'gd-game-design',
        mastery_probability: 0.35,
        mastery_status: 'NOT_MASTERED',
        recommended_next_difficulty: 'EASY',
      },
    ],
  };

  const evalWithMl = evaluatePrerequisiteGraph({
    skills: [],
    prerequisites: [],
    studentSkills: [],
    mlPlan: mlPlanWithMastery,
  });

  const mCsharp = evalWithMl.find((n) => n.skill_id === 'gd-csharp-scripting');
  const mEngine = evalWithMl.find((n) => n.skill_id === 'gd-engine-architecture');
  const mDesign = evalWithMl.find((n) => n.skill_id === 'gd-game-design');

  assert(
    'Model 2 MASTERED status marks C# node as MASTERED with mastery_level: 0.85',
    mCsharp?.status === 'MASTERED' && mCsharp?.mastery_level === 0.85
  );

  assert(
    'Model 2 MASTERED status marks Engine Architecture node as MASTERED with mastery_level: 0.90',
    mEngine?.status === 'MASTERED' && mEngine?.mastery_level === 0.90
  );

  assert(
    'Model 2 NOT_MASTERED status leaves Game Design UNLOCKED with mastery_level: 0.35',
    mDesign?.status === 'UNLOCKED' && mDesign?.mastery_level === 0.35
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Dependent skills lock / unlock correctly
  // ---------------------------------------------------------------------------
  // Since C# and Engine Architecture are MASTERED:
  // - Physics (requires C# + Engine) should UNLOCK!
  // - AI (requires C# + Game Design) should remain LOCKED because Game Design is NOT_MASTERED!
  // - Graphics (requires Engine + Physics) should remain LOCKED because Physics is not MASTERED!
  const mPhysics = evalWithMl.find((n) => n.skill_id === 'gd-math-physics');
  const mAi = evalWithMl.find((n) => n.skill_id === 'gd-game-ai');
  const mGraphics = evalWithMl.find((n) => n.skill_id === 'gd-graphics-shaders');

  assert(
    'Physics UNLOCKS when all prerequisites (C# + Engine) are MASTERED',
    mPhysics?.status === 'UNLOCKED' && mPhysics?.blocking_prerequisites.length === 0
  );

  assert(
    'AI remains LOCKED when prerequisite Game Design is not mastered',
    mAi?.status === 'LOCKED' && mAi?.blocking_prerequisites.includes('gd-game-design')
  );

  assert(
    'Graphics remains LOCKED when prerequisite Physics is not mastered',
    mGraphics?.status === 'LOCKED' && mGraphics?.blocking_prerequisites.includes('gd-math-physics')
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Topological ordering remains strictly valid
  // ---------------------------------------------------------------------------
  const nodeIndexMap = new Map(evalWithMl.map((n, idx) => [n.skill_id, idx]));

  assert(
    'Topological Sort: C# precedes Physics',
    nodeIndexMap.get('gd-csharp-scripting') < nodeIndexMap.get('gd-math-physics')
  );
  assert(
    'Topological Sort: Engine Architecture precedes Physics',
    nodeIndexMap.get('gd-engine-architecture') < nodeIndexMap.get('gd-math-physics')
  );
  assert(
    'Topological Sort: Physics precedes Graphics/Shaders',
    nodeIndexMap.get('gd-math-physics') < nodeIndexMap.get('gd-graphics-shaders')
  );
  assert(
    'Topological Sort: Game Design precedes AI',
    nodeIndexMap.get('gd-game-design') < nodeIndexMap.get('gd-game-ai')
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPrerequisiteEngineTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
