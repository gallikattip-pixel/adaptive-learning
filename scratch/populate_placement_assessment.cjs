const { db } = require('../backend/dist/config/firebase.js');

const ASSESSMENT_ID = 'asm_gamedev_placement_01';
const NOW_ISO = new Date().toISOString();

const assessmentData = {
  id: ASSESSMENT_ID,
  title: 'Game Development Initial Placement Assessment',
  description: 'Comprehensive diagnostic evaluating foundational boundaries across C# scripting, engine lifecycle, physics/math, game design, AI state machines, and graphics pipelines.',
  assessmentType: 'PLACEMENT',
  domain: 'Game Development',
  skillIds: [
    'gd-csharp-scripting',
    'gd-engine-architecture',
    'gd-math-physics',
    'gd-game-design',
    'gd-game-ai',
    'gd-graphics-shaders'
  ],
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO
};

const questionsData = [
  {
    id: 'q_gamedev_cs_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-csharp-scripting',
    questionText: 'In C# gameplay scripting, what is the primary semantic difference between a value type (such as struct) and a reference type (such as class)?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Value types contain their data directly and are copied by value upon assignment, whereas reference types store a reference to their data on the managed heap.',
      'Value types are always immutable once created, whereas reference types can be modified by any method at runtime.',
      'Value types cannot have member methods or properties, whereas reference types support full object-oriented member declarations.',
      'Value types can inherit from multiple base classes, whereas reference types are strictly limited to single inheritance.'
    ],
    correctAnswer: 'Value types contain their data directly and are copied by value upon assignment, whereas reference types store a reference to their data on the managed heap.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'In .NET and C#, value types encapsulate their values directly and assignment creates a field-by-field copy. Reference types point to memory allocated on the managed heap, with assignment merely copying the object reference.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_cs_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-csharp-scripting',
    questionText: 'Why is frequently creating and destroying short-lived game entities (such as projectiles or particle effects) during rapid gameplay considered an anti-pattern?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'It exhausts GPU shader cache memory, leading to render pipeline freezes and crash bugs.',
      'Repeated heap allocation and deallocation fragments memory and triggers frequent Garbage Collector overhead, causing frame rate stutter.',
      'Modern game engines prohibit creating more than a fixed maximum of entities per minute.',
      'Destroyed entities remain permanently in CPU registers unless the entire scene is reloaded.'
    ],
    correctAnswer: 'Repeated heap allocation and deallocation fragments memory and triggers frequent Garbage Collector overhead, causing frame rate stutter.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Instantiating and destroying objects creates managed heap allocations and leaves objects to be collected by the Garbage Collector. Periodic GC collection sweeps cause CPU pauses and frame hitching; object pooling avoids this by recycling inactive instances.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_cs_03',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-csharp-scripting',
    questionText: 'In a modular game architecture, what is the principal architectural benefit of using C# events or delegates to notify systems when player health reaches zero?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'It prevents the compiler from generating bytecode for inactive game loops, increasing frame rates.',
      'It decouples the player health component from UI, audio, and achievement systems, preventing tight dependencies.',
      'It automatically saves and serializes the player state to disk asynchronously whenever health updates.',
      'It shifts the execution of health calculations directly onto the GPU rendering thread.'
    ],
    correctAnswer: 'It decouples the player health component from UI, audio, and achievement systems, preventing tight dependencies.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Events implement the Observer pattern. The health component raises an event without needing direct references to listeners (such as UI HUD, audio manager, or quest manager), keeping components modular and maintainable.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_cs_04',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-csharp-scripting',
    questionText: 'What performance hazard occurs in C# when storing a value type (like an int or custom struct) inside an untyped collection or passing it to an interface without generic constraints?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Deadlock, because untyped collections acquire exclusive monitor locks on value instances.',
      'Boxing, which forces a heap allocation and copy of the value type into a reference object.',
      'Stack overflow, because value types recursively duplicate themselves on the execution stack.',
      'Memory leaking, because value types wrapped in interfaces cannot ever be freed by the Garbage Collector.'
    ],
    correctAnswer: 'Boxing, which forces a heap allocation and copy of the value type into a reference object.',
    difficulty: 3,
    difficultyLevel: 'HARD',
    explanation: 'Boxing is the process of converting a value type to the object type or any interface implemented by this value type. When boxed, the CLR wraps the value in a System.Object instance and places it on the managed heap, generating unexpected GC pressure inside high-frequency game loops.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_eng_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-engine-architecture',
    questionText: 'In modern game engines, why are physics calculations executed in a dedicated fixed update step rather than the variable render update loop?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Fixed time steps ensure deterministic, stable physics simulations that are independent of fluctuating visual frame rates.',
      'Graphics hardware cannot process matrix operations if physics updates occur on the same thread.',
      'Variable render updates run too slowly to capture basic keyboard and gamepad controller inputs.',
      'Operating system scheduling policies restrict rigid body collision math to 60-second intervals.'
    ],
    correctAnswer: 'Fixed time steps ensure deterministic, stable physics simulations that are independent of fluctuating visual frame rates.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'Physics engines rely on discrete numerical integration (like Verlet or Euler). Variable time steps produce non-deterministic forces, tunneling through colliders, and unstable joint constraints under frame rate drops.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_eng_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-engine-architecture',
    questionText: 'What is the purpose of multiplying a character\'s movement velocity vector by frame delta time (deltaTime) when updating position in a standard frame update?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'It prevents the camera frustum from culling moving meshes during fast rendering frames.',
      'It ensures floating point values remain positive to avoid inverted coordinate bugs.',
      'It converts the movement into frame-rate independent displacement so movement speed is consistent regardless of FPS.',
      'It synchronizes physics colliders with the monitor refresh rate (VSync).'
    ],
    correctAnswer: 'It converts the movement into frame-rate independent displacement so movement speed is consistent regardless of FPS.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Frame rate varies between machines and scenes. Multiplying velocity (units per second) by deltaTime (seconds elapsed since the last frame) calculates distance traveled in that frame, standardizing movement regardless of whether the game runs at 30, 60, or 144 FPS.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_eng_03',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-engine-architecture',
    questionText: 'In a component-based game engine architecture, why is the Composition pattern (attaching modular components) favored over deep Class Inheritance hierarchies?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Compilers cannot resolve virtual method tables deeper than two levels of inheritance in 64-bit systems.',
      'Composition allows entities to dynamically assemble varied behaviors at runtime without brittle and inflexible inheritance trees.',
      'Inheritance trees consume 10 times more video memory than independent component structs.',
      'Game engine scene serialization formats do not permit polymorphic base classes.'
    ],
    correctAnswer: 'Composition allows entities to dynamically assemble varied behaviors at runtime without brittle and inflexible inheritance trees.',
    difficulty: 3,
    difficultyLevel: 'HARD',
    explanation: 'In game development, inheritance hierarchies suffer from the diamond problem and rigid categorization (e.g., trying to create an entity that is both a FlyingUnit and a DamageableObject). Composition allows developers to assemble behaviors like Lego bricks on any entity dynamically.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_math_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-math-physics',
    questionText: 'How can a game developer calculate the normalized direction vector pointing from a player\'s position A to an enemy\'s position B?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Add vector A to vector B (A + B), then multiply by scalar -1.',
      'Compute the cross product of A and B, then invert the Z coordinate.',
      'Subtract vector A from vector B (B - A), and divide the resulting vector by its magnitude.',
      'Multiply the components of vector A by the components of vector B.'
    ],
    correctAnswer: 'Subtract vector A from vector B (B - A), and divide the resulting vector by its magnitude.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'The displacement vector from position A to position B is target minus origin (B - A). Dividing that displacement vector by its length (magnitude) yields a unit vector of length 1 pointing towards B.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_math_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-math-physics',
    questionText: 'A developer needs to check whether a target character is located in front of a guard character (within a forward 180-degree field of view). Which mathematical operation accomplishes this?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'The scalar dot product between the guard\'s forward vector and the direction vector to the target is greater than 0.',
      'The cross product magnitude of the guard\'s forward vector and target position vector equals 1.',
      'The determinant of the guard\'s orientation transformation matrix equals -1.',
      'The Manhattan distance between the guard and the target is smaller than the Euclidean distance.'
    ],
    correctAnswer: 'The scalar dot product between the guard\'s forward vector and the direction vector to the target is greater than 0.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'The dot product of two normalized vectors equals the cosine of the angle between them. When the angle is between -90 and +90 degrees (the forward half-plane), cos(theta) > 0. A dot product > 0 indicates the target lies in front of the forward vector.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_math_03',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-math-physics',
    questionText: 'Why do modern 3D game engines represent 3D rotations using Quaternions rather than three sequential Euler angles (X, Y, Z)?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Euler angles cannot represent angles greater than 90 degrees in any coordinate system.',
      'Quaternions prevent Gimbal Lock and provide smooth, unambiguous spherical linear interpolation (Slerp) between orientations.',
      'Quaternions require only two 16-bit floating point registers, whereas Euler angles require six 64-bit registers.',
      'Graphics pipelines do not support transformation matrices constructed from trigonometric Euler formulas.'
    ],
    correctAnswer: 'Quaternions prevent Gimbal Lock and provide smooth, unambiguous spherical linear interpolation (Slerp) between orientations.',
    difficulty: 3,
    difficultyLevel: 'HARD',
    explanation: 'Euler angles suffer from Gimbal Lock (loss of one degree of freedom when two rotation axes align) and interpolation artifacts. Quaternions represent rotations as a 4-tuple on a 4D hypersphere, avoiding singularities and enabling smooth Slerp.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_des_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-design',
    questionText: 'In game design terminology, what is a "Core Gameplay Loop"?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'The infinite background while-loop that renders frames at 60 FPS in game engine source code.',
      'The sequence of marketing and player onboarding funnels used to monetize mobile applications.',
      'The primary recurring cycle of actions a player repeatedly executes during a play session to achieve progression.',
      'The deterministic networking loop that resolves rollback netcode packet desyncs.'
    ],
    correctAnswer: 'The primary recurring cycle of actions a player repeatedly executes during a play session to achieve progression.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'A core loop (e.g., Explore -> Combat -> Collect Loot -> Upgrade Gear -> Explore) represents the primary minute-to-minute interaction cycle that drives player engagement and progression.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_des_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-design',
    questionText: 'When designing combat mechanics, why is immediate multi-sensory feedback ("game feel" / "juice") like hit flashes, screen shake, and impact audio crucial upon landing a strike?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'It communicates clear state confirmation to the player that their input successfully affected the game world.',
      'It reduces the computational cost of running physics checks by hiding collider penetration.',
      'It prevents the player from executing animation canceling inputs during recovery frames.',
      'It synchronizes the client simulation state with the authoritative multiplayer server.'
    ],
    correctAnswer: 'It communicates clear state confirmation to the player that their input successfully affected the game world.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Game feel and juice give physical weight and clear feedback to player agency. Responsive audio-visual cues provide instantaneous confirmation of intent and state changes, making mechanics intuitive and satisfying.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_des_03',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-design',
    questionText: 'What is a "Dominant Strategy" in game mechanics balancing, and why is it generally considered harmful to gameplay depth?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'A single tactic that is consistently more effective than all available alternatives regardless of opponent action, rendering other choices obsolete.',
      'A strategy that crashes the client due to memory overflow when chosen by multiple players.',
      'A tactic designed exclusively for AI boss characters that players cannot replicate.',
      'A strategy that is unlockable only after completing 100% of game achievements.'
    ],
    correctAnswer: 'A single tactic that is consistently more effective than all available alternatives regardless of opponent action, rendering other choices obsolete.',
    difficulty: 3,
    difficultyLevel: 'HARD',
    explanation: 'In game theory and mechanics design, a dominant strategy is one that yields the highest payoff regardless of the opposing player\'s or game system\'s actions. Its presence collapses decision diversity and strategic depth because rational players will only use that single option.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_ai_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-ai',
    questionText: 'In a classic Finite State Machine (FSM) controlling an enemy character, what defines a "State Transition"?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'The procedural generation algorithm that spawns new enemy entities in the scene.',
      'The rule or condition that causes an entity to exit its current active state and enter a new target state.',
      'The compilation process that transforms high-level script into native assembly instructions.',
      'The continuous interpolation of animation blend tree weights between walk and run clips.'
    ],
    correctAnswer: 'The rule or condition that causes an entity to exit its current active state and enter a new target state.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'An FSM consists of states, transitions, and actions. A transition evaluates specific conditions or triggers (such as `health <= 0` or `distanceToPlayer < detectionRange`) to switch from the current state to a target state.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_ai_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-ai',
    questionText: 'Why does the A* (A-Star) pathfinding algorithm use a heuristic function h(n) in addition to the accumulated movement cost g(n)?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'To estimate the remaining cost to the goal, directing the search towards the destination and dramatically reducing explored nodes.',
      'To smooth the jagged path geometry into Bezier splines after navigation completes.',
      'To dynamically recalculate obstacle colliders in real time when dynamic entities cross the grid.',
      'To enforce deterministic random numbers across networked multiplayer clients.'
    ],
    correctAnswer: 'To estimate the remaining cost to the goal, directing the search towards the destination and dramatically reducing explored nodes.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Dijkstra\'s algorithm searches uniformly in all directions (g(n) only). A* evaluates f(n) = g(n) + h(n), where h(n) estimates distance to target (e.g. Euclidean or Manhattan), prioritizing exploration of nodes pointing toward the goal.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_ai_03',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-game-ai',
    questionText: 'In complex game AI architectures, what is a primary maintainability limitation of flat Finite State Machines that led many action games to adopt hierarchical models like Behavior Trees?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Flat FSMs cannot process navigation mesh queries or calculate path distances.',
      'As the number of behaviors grows, managing the expanding web of explicit state transitions becomes increasingly brittle and difficult to maintain.',
      'Flat FSMs are restricted to 4 total states by CPU hardware thread architectures.',
      'Behavior Trees run in GPU compute shaders, whereas FSMs are restricted to single-threaded CPU execution.'
    ],
    correctAnswer: 'As the number of behaviors grows, managing the expanding web of explicit state transitions becomes increasingly brittle and difficult to maintain.',
    difficulty: 3,
    difficultyLevel: 'HARD',
    explanation: 'In flat FSMs, adding states requires evaluating and wiring transitions to and from many existing states, leading to an exponential combinatorial explosion of transition edges. Behavior Trees offer modular composability with sub-branches, selectors, and decorators.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_gfx_01',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-graphics-shaders',
    questionText: 'In the programmable graphics rendering pipeline, what is the primary role of a Vertex Shader?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'It reads disk textures and decompresses audio tracks into surround sound channels.',
      'It performs post-processing color grading and vignette screen effects on the final frame buffer.',
      'It transforms 3D model vertex coordinates from local object space into clip/screen space.',
      'It calculates volumetric shadow falloff for screen-space ambient occlusion.'
    ],
    correctAnswer: 'It transforms 3D model vertex coordinates from local object space into clip/screen space.',
    difficulty: 1,
    difficultyLevel: 'EASY',
    explanation: 'The vertex shader executes per-vertex, multiplying model positions by Model-View-Projection (MVP) matrices to project 3D geometry into normalized device / clip coordinates for subsequent rasterization.',
    createdAt: NOW_ISO
  },
  {
    id: 'q_gamedev_gfx_02',
    assessmentId: ASSESSMENT_ID,
    skillId: 'gd-graphics-shaders',
    questionText: 'What is the primary difference between a Vertex Shader and a Fragment (Pixel) Shader?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      'Vertex shaders process 3D geometric mesh points, whereas fragment shaders compute final colors and lighting values for individual rasterized pixels.',
      'Vertex shaders run exclusively on the CPU, whereas fragment shaders run exclusively on the GPU.',
      'Vertex shaders generate user interface elements, whereas fragment shaders simulate physics colliders.',
      'Vertex shaders write directly to disk files, whereas fragment shaders stream network assets.'
    ],
    correctAnswer: 'Vertex shaders process 3D geometric mesh points, whereas fragment shaders compute final colors and lighting values for individual rasterized pixels.',
    difficulty: 2,
    difficultyLevel: 'MEDIUM',
    explanation: 'Vertex shaders operate on geometric vertices early in the pipeline (transforming positions, normals, UVs). Fragment shaders run after rasterization for each fragment (potential pixel), computing surface lighting, textures, specular highlights, and color outputs.',
    createdAt: NOW_ISO
  }
];

// Validation checks prior to execution
function validateData() {
  console.log('--- Pre-Write Integrity Checks ---');
  if (questionsData.length !== 18) {
    throw new Error(`Expected 18 questions, found ${questionsData.length}`);
  }

  const ids = new Set();
  const validSkills = new Set(assessmentData.skillIds);

  questionsData.forEach((q, idx) => {
    if (ids.has(q.id)) {
      throw new Error(`Duplicate question ID: ${q.id}`);
    }
    ids.add(q.id);

    if (q.assessmentId !== ASSESSMENT_ID) {
      throw new Error(`Invalid assessmentId on ${q.id}: ${q.assessmentId}`);
    }

    if (!validSkills.has(q.skillId)) {
      throw new Error(`Invalid skillId on ${q.id}: ${q.skillId}`);
    }

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${q.id} must have exactly 4 options. Found ${q.options?.length}`);
    }

    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== 4) {
      throw new Error(`Question ${q.id} has duplicate options!`);
    }

    if (!uniqueOptions.has(q.correctAnswer)) {
      throw new Error(`Question ${q.id} correctAnswer does not match any option!`);
    }

    if (![1, 2, 3].includes(q.difficulty)) {
      throw new Error(`Question ${q.id} invalid difficulty: ${q.difficulty}`);
    }

    const diffMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
    if (q.difficultyLevel !== diffMap[q.difficulty]) {
      throw new Error(`Question ${q.id} difficultyLevel mismatch: ${q.difficultyLevel} vs ${diffMap[q.difficulty]}`);
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      throw new Error(`Question ${q.id} missing explanation`);
    }
  });

  console.log('All 18 question schemas passed validation.');
}

async function populate() {
  validateData();

  console.log('--- Checking Idempotency ---');
  const asmDoc = await db.collection('assessments').doc(ASSESSMENT_ID).get();
  if (asmDoc.exists) {
    throw new Error(`Assessment ${ASSESSMENT_ID} already exists in Firestore! Aborting.`);
  }

  for (const q of questionsData) {
    const qDoc = await db.collection('assessmentQuestions').doc(q.id).get();
    if (qDoc.exists) {
      throw new Error(`Question ${q.id} already exists in Firestore! Aborting.`);
    }
  }

  console.log('Idempotency verified. Performing atomic batch write (1 assessment + 18 questions)...');
  const batch = db.batch();

  // 1. Assessment
  const asmRef = db.collection('assessments').doc(ASSESSMENT_ID);
  batch.set(asmRef, assessmentData);

  // 2. 18 Questions
  for (const q of questionsData) {
    const qRef = db.collection('assessmentQuestions').doc(q.id);
    batch.set(qRef, q);
  }

  await batch.commit();
  console.log('Batch commit successful!');

  console.log('--- Post-Write Verification ---');
  const asmVerify = await db.collection('assessments').doc(ASSESSMENT_ID).get();
  console.log('Assessment written:', asmVerify.id, asmVerify.data().title);

  const qSnap = await db.collection('assessmentQuestions').where('assessmentId', '==', ASSESSMENT_ID).get();
  console.log('Questions written count:', qSnap.size);

  const collections = ['assessments', 'assessmentQuestions', 'assessmentAttempts', 'studentAnswers'];
  for (const c of collections) {
    const s = await db.collection(c).count().get();
    console.log(c, 'count:', s.data().count);
  }
}

populate().catch((err) => {
  console.error('Population failed:', err);
  process.exit(1);
});
