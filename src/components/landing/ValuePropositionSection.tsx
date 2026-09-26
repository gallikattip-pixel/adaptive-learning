import React from 'react';
import { Card } from '@/components/common/Card';
import { Check, X } from 'lucide-react';

export const ValuePropositionSection: React.FC = () => {
  return (
    <section className="py-20 bg-ivory border-b border-deep-green/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-mono tracking-widest text-dark-green uppercase bg-warm-ivory border border-deep-green/30 px-3 py-1 rounded-full inline-block">
            Architectural Contrast
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-text tracking-tight">
            Designed Exclusively for Student Mastery
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Eliminating artificial classroom pace barriers and one-size-fits-all lecture timelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Model */}
          <Card className="bg-warm-ivory/60 border-deep-green/20 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-deep-green/20">
              <h3 className="text-lg font-bold text-dark-text/90">Legacy Static Platforms</h3>
              <span className="text-xs font-mono text-muted bg-ivory border border-deep-green/20 px-2.5 py-1 rounded">
                Fixed Pacing
              </span>
            </div>

            <ul className="space-y-4 text-xs text-muted">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-deep-green/10 border border-deep-green/30 flex items-center justify-center text-dark-text shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>Rigid chapter-by-chapter progression regardless of student speed</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-deep-green/10 border border-deep-green/30 flex items-center justify-center text-dark-text shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>Unresolved prerequisite gaps lead to compounding frustration</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-deep-green/10 border border-deep-green/30 flex items-center justify-center text-dark-text shrink-0 mt-0.5">
                  <X size={12} />
                </div>
                <span>Static quiz questions without Item Response difficulty adjustment</span>
              </li>
            </ul>
          </Card>

          {/* Adaptive Learning Model */}
          <Card className="bg-dark-green border-deep-green p-8 space-y-6 relative overflow-hidden text-ivory ring-1 ring-yellow/30 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-deep-green">
              <h3 className="text-lg font-bold text-ivory flex items-center gap-2">
                <span>Adaptive Learning</span>
              </h3>
              <span className="text-xs font-mono text-yellow bg-deep-green border border-deep-green/80 px-2.5 py-1 rounded font-bold">
                Autonomous Mastery
              </span>
            </div>

            <ul className="space-y-4 text-xs text-ivory/90">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow/20 border border-yellow/50 flex items-center justify-center text-yellow shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>Dynamic graph traversal that adapts instantly to every response signal</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow/20 border border-yellow/50 flex items-center justify-center text-yellow shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>Automated backward micro-branching to repair specific missing concepts</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-yellow/20 border border-yellow/50 flex items-center justify-center text-yellow shrink-0 mt-0.5">
                  <Check size={12} />
                </div>
                <span>Calibrated item parameters ensuring optimal cognitive growth state</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
};
