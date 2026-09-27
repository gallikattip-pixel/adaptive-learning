import React from 'react';
import type { PathwayNode, SkillNode, StudentPathway } from '@/types/learning';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { RoadmapNode } from './RoadmapNode';

export interface RoadmapSectionProps {
  pathway: StudentPathway | null;
  onSelectSkill: (skill: PathwayNode | SkillNode) => void;
  onStartDiagnostic: () => void;
}

export const RoadmapSection: React.FC<RoadmapSectionProps> = ({
  pathway,
  onSelectSkill,
  onStartDiagnostic,
}) => {
  const nodes = pathway?.nodes || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Dynamic Graph Sequence</Badge>
            <span className="font-mono text-xs text-muted">Prerequisite Hierarchy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">Prerequisite Learning Roadmap</h2>
          <p className="text-xs text-muted mt-1">
            Master prerequisite nodes sequentially. Locked nodes unlock automatically as prior dependencies are verified.
          </p>
        </div>
      </div>

      {/* Pathway Roadmap Visual */}
      {nodes.length > 0 ? (
        <Card className="p-8 bg-warm-ivory border-deep-green/30 shadow-md max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-deep-green/20">
            <div>
              <h3 className="text-base font-bold text-dark-text">Target Learning Sequence</h3>
              <p className="text-xs text-muted">Prerequisite dependency graph from backend engine</p>
            </div>
            <Badge variant="deepGreen">{nodes.length} Nodes</Badge>
          </div>

          <div className="py-4">
            {nodes.map((skill, index) => (
              <RoadmapNode
                key={skill.skill_id || (skill as any).id || index}
                skill={skill}
                isLast={index === nodes.length - 1}
                onSelectSkill={onSelectSkill}
              />
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No Prerequisite Roadmap Generated Yet"
          description="Your personalized prerequisite roadmap will be dynamically generated as soon as real pathway data is fetched from the backend API or after you complete an initial placement assessment."
          actionLabel="Complete Placement Diagnostic"
          onAction={onStartDiagnostic}
          statusBadge="Dynamic DAG Ready"
        />
      )}
    </div>
  );
};
