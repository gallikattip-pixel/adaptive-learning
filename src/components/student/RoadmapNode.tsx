import React from 'react';
import type { PathwayNode, SkillNode } from '@/types/learning';
import { Check, Lock, ArrowDown } from 'lucide-react';

export interface RoadmapNodeProps {
  skill: PathwayNode | SkillNode;
  isLast?: boolean;
  onSelectSkill: (skill: PathwayNode | SkillNode) => void;
}

export const RoadmapNode: React.FC<RoadmapNodeProps> = ({
  skill,
  isLast = false,
  onSelectSkill,
}) => {
  const rawStatus = (skill.status || 'UNLOCKED').toLowerCase();

  const getStatusBadge = () => {
    switch (rawStatus) {
      case 'mastered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-deep-green text-ivory border border-deep-green">
            <Check size={12} className="text-yellow" /> Mastered
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow text-dark-green border border-yellow">
            Current Target
          </span>
        );
      case 'gap_detected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-900/10 text-amber-900 border border-amber-800/40">
            Skill Gap
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-ivory text-muted border border-deep-green/30">
            <Lock size={10} /> Locked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-warm-ivory text-dark-text border border-deep-green/30">
            Available
          </span>
        );
    }
  };

  const skillCode =
    'skill_id' in skill && skill.skill_id
      ? skill.skill_id
      : 'code' in skill && skill.code
      ? skill.code
      : 'SKILL';

  const skillTitle =
    'skill_name' in skill && skill.skill_name
      ? skill.skill_name
      : 'title' in skill && skill.title
      ? skill.title
      : skillCode;

  const skillDesc = skill.description || 'Prerequisite learning node';

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Node Card */}
      <button
        onClick={() => onSelectSkill(skill)}
        className={`w-full text-left p-5 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow ${
          rawStatus === 'in_progress'
            ? 'bg-warm-ivory border-yellow shadow-md ring-2 ring-yellow/60'
            : rawStatus === 'mastered'
            ? 'bg-ivory border-deep-green/40 shadow-xs'
            : rawStatus === 'locked'
            ? 'bg-warm-ivory/40 border-deep-green/20 opacity-70'
            : 'bg-warm-ivory border-deep-green/30 hover:border-deep-green/60'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-bold text-dark-green">{skillCode}</span>
          {getStatusBadge()}
        </div>

        <h3 className="text-sm font-bold text-dark-text mb-1">{skillTitle}</h3>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{skillDesc}</p>
      </button>

      {/* Connection Down Arrow */}
      {!isLast && (
        <div className="py-3 text-deep-green/60 flex flex-col items-center">
          <ArrowDown size={18} className="animate-bounce" />
        </div>
      )}
    </div>
  );
};
