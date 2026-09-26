import React from 'react';
import type { SkillNode } from '@/types/learning';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { X, GitBranch, Layers } from 'lucide-react';

export interface SkillDetailModalProps {
  skill: SkillNode | null;
  onClose: () => void;
  onStartPractice?: (skillId: string) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  onClose,
  onStartPractice,
}) => {
  if (!skill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-green/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg bg-warm-ivory border-deep-green/40 shadow-2xl p-6 sm:p-8 space-y-6 relative text-dark-text">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-deep-green/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="yellow">{skill.code || 'SKILL_NODE'}</Badge>
              <span className="font-mono text-xs text-muted">{skill.domain}</span>
            </div>
            <h2 className="text-xl font-extrabold text-dark-text">{skill.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-dark-text hover:bg-deep-green/10 focus:outline-none focus:ring-2 focus:ring-yellow"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-dark-text leading-relaxed">
          <div>
            <h4 className="font-bold text-dark-text uppercase tracking-wider mb-1 text-[11px]">Description</h4>
            <p className="text-muted leading-relaxed">{skill.description}</p>
          </div>

          <div>
            <h4 className="font-bold text-dark-text uppercase tracking-wider mb-1.5 text-[11px] flex items-center gap-1.5">
              <GitBranch size={14} className="text-dark-green" />
              Prerequisite Dependencies ({skill.prerequisiteIds.length})
            </h4>
            {skill.prerequisiteIds.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skill.prerequisiteIds.map((preId) => (
                  <span
                    key={preId}
                    className="px-2.5 py-1 rounded bg-ivory border border-deep-green/30 font-mono text-[11px] text-dark-text"
                  >
                    {preId}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted italic">Root foundational concept (0 prerequisites required).</p>
            )}
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-deep-green/30 space-y-1.5 font-mono text-[11px]">
            <div className="text-dark-green font-bold flex items-center gap-1.5">
              <Layers size={14} /> Item Response Difficulty Parameter
            </div>
            <p className="text-muted">Target Discrimination: Standard IRT Model</p>
          </div>
        </div>

        {/* Action */}
        <div className="pt-4 border-t border-deep-green/20 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {onStartPractice && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onStartPractice(skill.id);
                onClose();
              }}
            >
              Start Diagnostic Task
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
