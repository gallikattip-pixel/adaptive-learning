import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ConceptStage {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  graphState: {
    activeNodeId: string;
    gapNodeId?: string;
    remediationNodeId?: string;
    masteredNodeId?: string;
    flowStatus: string;
  };
}

const STAGES: ConceptStage[] = [
  {
    id: 1,
    code: 'STAGE_01',
    title: 'Diagnostic Baseline Evaluation',
    subtitle: 'Assessing Foundational Competencies',
    description:
      'Rather than forcing students through fixed linear modules, Adaptive Learning maps current understanding across a multi-dimensional prerequisite node graph.',
    graphState: {
      activeNodeId: 'node-root',
      flowStatus: 'Evaluating baseline diagnostic items across core domain nodes...',
    },
  },
  {
    id: 2,
    code: 'STAGE_02',
    title: 'Precision Skill-Gap Detection',
    subtitle: 'Pinpointing Missing Prerequisite Concepts',
    description:
      'When an evaluation item indicates uncertainty, the system instantly isolates the specific underlying prerequisite concept responsible for the gap.',
    graphState: {
      activeNodeId: 'node-root',
      gapNodeId: 'node-gap-01',
      flowStatus: 'Isolating missing prerequisite: Sub-Graph Dependency #04B',
    },
  },
  {
    id: 3,
    code: 'STAGE_03',
    title: 'Dynamic Prerequisite Remediation',
    subtitle: 'Automated Pathway Recalibration',
    description:
      'Adaptive Learning automatically inserts targeted micro-remediation units into the learner pathway, bypassing already-mastered concepts to save time.',
    graphState: {
      activeNodeId: 'node-root',
      gapNodeId: 'node-gap-01',
      remediationNodeId: 'node-remediation',
      flowStatus: 'Inserting targeted prerequisite remediation branch into pathway',
    },
  },
  {
    id: 4,
    code: 'STAGE_04',
    title: 'Continuous Mastery Verification',
    subtitle: 'Adaptive Difficulty Escalation',
    description:
      'Once prerequisite competency is verified, item difficulty escalates dynamically to reinforce deep retention and domain fluency.',
    graphState: {
      activeNodeId: 'node-target',
      masteredNodeId: 'node-remediation',
      flowStatus: 'Competency verified. Escalating item difficulty parameter to Target Mastery',
    },
  },
];

export const AdaptiveConceptVisual: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const activeStage = STAGES[currentStageIndex];

  return (
    <section id="adaptive-model" className="py-20 bg-dark-green border-b border-deep-green/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-mono tracking-widest text-yellow uppercase bg-deep-green border border-deep-green/80 px-3 py-1 rounded-full inline-block">
            Adaptive Architecture Model
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-ivory tracking-tight">
            How Real-Time Adaptive Learning Works
          </h2>
          <p className="text-ivory/80 text-base leading-relaxed">
            Unlike static linear curriculums, Adaptive Learning operates on a real-time prerequisite dependency graph that continuously recalibrates based on student mastery signals.
          </p>
        </div>

        {/* Interactive Stage Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {STAGES.map((stage, idx) => {
            const isActive = idx === currentStageIndex;
            return (
              <button
                key={stage.id}
                onClick={() => setCurrentStageIndex(idx)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow ${
                  isActive
                    ? 'bg-deep-green border-yellow shadow-lg shadow-black/20 ring-1 ring-yellow/60'
                    : 'bg-dark-green/60 border-deep-green/60 hover:bg-deep-green/40 hover:border-deep-green'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-ivory/70 uppercase tracking-wider">
                    {stage.code}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-yellow animate-pulse' : 'bg-deep-green'
                    }`}
                  />
                </div>
                <h3 className="text-xs font-semibold text-ivory line-clamp-1">{stage.title}</h3>
              </button>
            );
          })}
        </div>

        {/* Visual Interactive Graph Stage */}
        <div className="bg-deep-green/40 border border-deep-green rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Text Explanation */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-block font-mono text-xs text-yellow bg-dark-green border border-deep-green px-2.5 py-1 rounded">
                {activeStage.code}: {activeStage.subtitle}
              </div>

              <h3 className="text-2xl font-bold text-ivory">{activeStage.title}</h3>
              <p className="text-ivory/90 text-sm leading-relaxed">{activeStage.description}</p>

              {/* Status Box */}
              <div className="p-4 rounded-xl bg-dark-green border border-deep-green font-mono text-xs space-y-1.5">
                <div className="text-ivory/60 uppercase text-[10px]">Platform Status Signal</div>
                <div className="text-yellow flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow animate-ping" />
                  <span>{activeStage.graphState.flowStatus}</span>
                </div>
              </div>
            </div>

            {/* Right: Pure Animated Graphic */}
            <div className="lg:col-span-7 bg-dark-green border border-deep-green rounded-xl p-6 sm:p-8 min-h-[340px] flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono text-ivory/70 pb-4 border-b border-deep-green/60">
                <span>GRAPH_ID: DOMAIN_PREREQUISITE_TREE</span>
                <span className="text-yellow">STATE_ALIGNED</span>
              </div>

              {/* Node Diagram Visual */}
              <div className="my-8 relative flex items-center justify-between px-4 sm:px-8">
                {/* Connection Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <line x1="15%" y1="50%" x2="40%" y2="25%" stroke="#1F5D45" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="15%" y1="50%" x2="40%" y2="75%" stroke="#1F5D45" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="40%" y1="75%" x2="70%" y2="75%" stroke="#1F5D45" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="70%" y1="75%" x2="88%" y2="50%" stroke="#1F5D45" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="40%" y1="25%" x2="88%" y2="50%" stroke="#1F5D45" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {/* Node 1: Root Prerequisite */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      scale: activeStage.graphState.activeNodeId === 'node-root' ? [1, 1.08, 1] : 1,
                      borderColor: activeStage.graphState.activeNodeId === 'node-root' ? '#E7C547' : '#1F5D45',
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-14 h-14 rounded-xl bg-deep-green border-2 border-yellow/60 flex items-center justify-center text-xs font-mono text-ivory shadow-md"
                  >
                    ROOT
                  </motion.div>
                  <span className="text-[10px] font-mono text-ivory/70">Baseline</span>
                </div>

                {/* Branch Nodes Column */}
                <div className="relative z-10 flex flex-col justify-between h-44">
                  {/* Top Bypass Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-xl bg-deep-green/60 border border-deep-green flex items-center justify-center text-[10px] font-mono text-ivory/70">
                      NODE_A
                    </div>
                    <span className="text-[9px] font-mono text-ivory/60">Mastered</span>
                  </div>

                  {/* Bottom Remediation Trigger Node */}
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{
                        borderColor: activeStage.graphState.gapNodeId ? '#E7C547' : '#1F5D45',
                        scale: activeStage.graphState.gapNodeId ? [1, 1.06, 1] : 1,
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`w-12 h-12 rounded-xl bg-deep-green border-2 ${
                        activeStage.graphState.gapNodeId ? 'border-yellow bg-yellow/10' : 'border-deep-green'
                      } flex items-center justify-center text-[10px] font-mono text-ivory`}
                    >
                      GAP_04B
                    </motion.div>
                    <span className={`text-[9px] font-mono ${activeStage.graphState.gapNodeId ? 'text-yellow font-semibold' : 'text-ivory/60'}`}>
                      {activeStage.graphState.gapNodeId ? 'Gap Detected' : 'Prereq'}
                    </span>
                  </div>
                </div>

                {/* Remediation Insertion Node */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStageIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className={`w-14 h-14 rounded-xl bg-deep-green border-2 ${
                        activeStage.graphState.remediationNodeId
                          ? 'border-yellow bg-yellow/20'
                          : activeStage.graphState.masteredNodeId
                          ? 'border-yellow'
                          : 'border-deep-green opacity-60'
                      } flex items-center justify-center text-[11px] font-mono text-ivory text-center px-1`}
                    >
                      REMEDIATE
                    </motion.div>
                  </AnimatePresence>
                  <span className="text-[10px] font-mono text-ivory/70">Micro-Module</span>
                </div>

                {/* Target Competency Node */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      scale: activeStage.graphState.activeNodeId === 'node-target' ? [1, 1.1, 1] : 1,
                      borderColor: activeStage.graphState.activeNodeId === 'node-target' ? '#E7C547' : '#1F5D45',
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 rounded-xl bg-yellow border-2 border-yellow flex flex-col items-center justify-center text-center p-1 text-dark-green shadow-lg"
                  >
                    <span className="text-[9px] font-mono font-bold uppercase text-dark-green">TARGET</span>
                    <span className="text-[10px] font-mono font-semibold text-dark-green">Mastery</span>
                  </motion.div>
                  <span className="text-[10px] font-mono text-ivory/70">Goal Node</span>
                </div>
              </div>

              {/* Graphic Footer Legend */}
              <div className="pt-4 border-t border-deep-green/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-ivory/70">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-yellow/30 border border-yellow" /> Active Path
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-deep-green border border-yellow" /> Isolated Gap
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-deep-green/60 border border-deep-green" /> Unlocked Node
                  </span>
                </div>
                <span>Algorithm: IRT + Graph Remediation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
