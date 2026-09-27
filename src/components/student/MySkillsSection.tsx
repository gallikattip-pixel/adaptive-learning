import React, { useState } from 'react';
import type { SkillNode, LearningPathway } from '@/types/learning';
import type { UnifiedPersonalizedPlan } from '@/types/ml';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatSkillName, formatStatusLabel, formatPriorityLabel } from '@/lib/mlFormatters';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export interface MySkillsSectionProps {
  pathways: LearningPathway[];
  plan: UnifiedPersonalizedPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  onRetryPlan: () => void;
  onSelectSkill: (skill: SkillNode) => void;
  onStartDiagnostic: () => void;
}

export const MySkillsSection: React.FC<MySkillsSectionProps> = ({
  pathways,
  plan,
  isLoadingPlan,
  planError,
  onRetryPlan,
  onSelectSkill,
  onStartDiagnostic,
}) => {
  const [filter, setFilter] = useState<'all' | 'gaps' | 'mastered' | 'in_progress'>('all');

  const pathwaySkills: SkillNode[] = pathways.flatMap((p) => p.nodes);
  const mlSkillGaps = plan?.skill_gaps || [];

  // Filter ML skill gaps
  const filteredGaps = mlSkillGaps.filter((item) => {
    if (filter === 'all' || filter === 'gaps') return true;
    const isMastered = item.status === 'STRONG' || item.status === 'MASTERED';
    if (filter === 'mastered') return isMastered;
    if (filter === 'in_progress') return !isMastered;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="deepGreen">Model 1 Skill-Gap Diagnostics</Badge>
            {isLoadingPlan && (
              <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Updating...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">
            Competency & Skill Inventory
          </h2>
          <p className="text-xs text-muted">
            Evaluated directly by the ML Skill Gap & Prerequisite Reasoning Engine.
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
            All Evaluated ({mlSkillGaps.length})
          </button>
          <button
            onClick={() => setFilter('gaps')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'gaps'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            Skill Gaps ({mlSkillGaps.filter((g) => g.status === 'NOT_READY' || g.status === 'WEAK').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              filter === 'in_progress'
                ? 'bg-yellow text-dark-green border-yellow font-bold'
                : 'bg-warm-ivory text-dark-text border-deep-green/30 hover:border-deep-green'
            }`}
          >
            Developing
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
        </div>
      </div>

      {/* Error state */}
      {planError && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-dark-text flex items-center justify-between">
          <span className="text-xs text-amber-900">
            Could not fetch latest ML skill gaps. Showing current pathway skills.
          </span>
          <Button variant="outline" size="sm" onClick={onRetryPlan}>
            Retry
          </Button>
        </Card>
      )}

      {/* Loading Skeletons */}
      {isLoadingPlan && !plan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 bg-warm-ivory border-deep-green/20 space-y-3">
              <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-1/3" />
              <div className="h-5 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
              <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-full" />
            </Card>
          ))}
        </div>
      ) : filteredGaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGaps.map((item, idx) => {
            const statusInfo = formatStatusLabel(item.status);
            const priorityInfo = formatPriorityLabel(item.priority);
            const isBlocked = item.prerequisite_status && item.prerequisite_status.startsWith('BLOCKED');

            return (
              <Card
                key={`${item.skill}-${idx}`}
                className="p-6 bg-warm-ivory border-deep-green/30 hover:border-deep-green space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${priorityInfo.className}`}>
                      {priorityInfo.label}
                    </span>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-dark-text text-base">
                    {formatSkillName(item.skill)}
                  </h3>

                  {isBlocked ? (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-700" />
                      <span>{item.prerequisite_status}</span>
                    </div>
                  ) : item.status === 'STRONG' || item.status === 'MASTERED' ? (
                    <div className="text-xs text-muted flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-deep-green" />
                      <span>Prerequisites validated and mastered</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted flex items-center gap-1.5">
                      <Clock size={14} className="text-dark-green" />
                      <span>Ready for active practice and reinforcement</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-deep-green/10 flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>Score: {typeof item.score === 'number' ? Math.round(item.score * 100) / 100 : '--'}</span>
                  {typeof item.confidence === 'number' && (
                    <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : pathwaySkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pathwaySkills.map((skill) => (
            <Card
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className="p-6 bg-warm-ivory border-deep-green/30 hover:border-deep-green cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-dark-green">{skill.code}</span>
                <Badge variant={skill.status === 'mastered' ? 'deepGreen' : 'yellow'}>
                  {skill.status || 'unlocked'}
                </Badge>
              </div>
              <h3 className="font-bold text-dark-text text-sm">{skill.title}</h3>
              <p className="text-xs text-muted line-clamp-2">{skill.description}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Skill Gaps Identified"
          description="Your skill inventory is evaluated in real time from diagnostic assessments. Launch an assessment to calibrate your prerequisite status."
          actionLabel="Launch Diagnostic Assessment"
          onAction={onStartDiagnostic}
          statusBadge="Model 1 Pipeline Ready"
        />
      )}
    </div>
  );
};
