import React, { useState } from 'react';
import type { SkillNode, LearningPathway } from '@/types/learning';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';

export interface MySkillsSectionProps {
  pathways: LearningPathway[];
  onSelectSkill: (skill: SkillNode) => void;
  onStartDiagnostic: () => void;
}

export const MySkillsSection: React.FC<MySkillsSectionProps> = ({
  pathways,
  onSelectSkill,
  onStartDiagnostic,
}) => {
  const [filter, setFilter] = useState<'all' | 'mastered' | 'in_progress' | 'gap_detected'>('all');

  const allSkills: SkillNode[] = pathways.flatMap((p) => p.nodes);

  const filteredSkills = allSkills.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <h2 className="text-xl font-extrabold text-dark-text">Competency & Skill Inventory</h2>
          <p className="text-xs text-muted">
            Track learned concepts, skills in progress, and identified prerequisite gaps.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'all'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            All Skills ({allSkills.length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'in_progress'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('mastered')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'mastered'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            Mastered
          </button>
          <button
            onClick={() => setFilter('gap_detected')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'gap_detected'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            Skill Gaps
          </button>
        </div>
      </div>

      {/* Skills Content Grid or Empty State */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className="p-6 bg-warm-ivory border-deep-green/30 hover:border-deep-green cursor-pointer space-y-3 shadow-xs hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-dark-green">{skill.code}</span>
                <Badge variant={skill.status === 'mastered' ? 'deepGreen' : 'yellow'}>
                  {skill.status || 'unlocked'}
                </Badge>
              </div>

              <h3 className="font-bold text-dark-text text-sm">{skill.title}</h3>
              <p className="text-xs text-muted line-clamp-2">{skill.description}</p>

              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-muted">
                <span>{skill.domain}</span>
                <span>{skill.prerequisiteIds.length} Prereqs</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Skills Logged in this Category"
          description="Skills are automatically added to your competency inventory as you participate in diagnostic assessments and complete adaptive learning tasks."
          actionLabel="Launch Diagnostic Assessment"
          onAction={onStartDiagnostic}
          statusBadge="API Contract Ready"
        />
      )}
    </div>
  );
};
