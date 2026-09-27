import React from 'react';
import type { StudentUser } from '@/types/auth';
import type { StudentPathway, PathwayNode, SkillNode } from '@/types/learning';
import type { UnifiedPersonalizedPlan } from '@/types/ml';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatSkillName, formatActionLabel } from '@/lib/mlFormatters';
import {
  Target,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  BookOpen,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export interface OverviewSectionProps {
  user: StudentUser | null;
  pathway: StudentPathway | null;
  isLoading: boolean;
  plan: UnifiedPersonalizedPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  onRetryPlan: () => void;
  onNavigateTab: (tab: 'roadmap' | 'skills' | 'practice' | 'diagnostics' | 'learning' | 'progress') => void;
  onSelectSkill: (skill: PathwayNode | SkillNode) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  user,
  pathway,
  isLoading,
  plan,
  isLoadingPlan,
  planError,
  onRetryPlan,
  onNavigateTab,
  onSelectSkill,
}) => {

  // Model 4 Risk & Intervention
  const riskLevel = plan?.risk?.risk_level || 'NORMAL';
  const isElevatedRisk = riskLevel !== 'NORMAL';
  const interventionAction = plan?.intervention?.recommended_action;
  const interventionUrgency = plan?.intervention?.urgency;

  // Model 5 Interests
  const topInterests = plan?.interest?.top_interests || [];
  const interestConcept = plan?.interest?.concept;

  // Model 1 Skill Gaps count
  const skillGaps = plan?.skill_gaps || [];
  const activeGapsCount = skillGaps.filter(
    (g) => g.status === 'NOT_READY' || g.status === 'WEAK' || g.priority === 'HIGH'
  ).length;

  // Model 3 Recommendations
  const recommendations = plan?.recommendations || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome / Personalized Status Header */}
      <Card className="bg-dark-green border-deep-green text-ivory p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="yellow" className="text-[10px]">
                Active Personalized Plan
              </Badge>
              {isLoadingPlan && (
                <span className="text-[11px] font-mono text-yellow/80 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Synchronizing ML pipeline...
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ivory">
              Welcome back, {user?.firstName || 'Student'}
            </h2>
            <p className="text-xs sm:text-sm text-ivory/80">
              {user?.primaryGoal
                ? `Learning Goal: ${user.primaryGoal}`
                : interestConcept
                ? `Inferred Focus: ${formatSkillName(interestConcept)}`
                : 'Adaptive Learning Pipeline Active'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryPlan}
              disabled={isLoadingPlan}
              className="text-ivory border-ivory/30 hover:bg-deep-green/60"
            >
              <RefreshCw size={14} className={isLoadingPlan ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Plan</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              className="shrink-0"
              onClick={() => onNavigateTab('roadmap')}
            >
              <span>View Learning Roadmap</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Banner with Retry */}
      {planError && (
        <Card className="p-4 bg-amber-50/80 border-amber-200 text-dark-text flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-700 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Personalized Plan Notice</p>
              <p className="text-xs text-amber-800">{planError}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRetryPlan} disabled={isLoadingPlan}>
            Retry
          </Button>
        </Card>
      )}

      {/* 2. Model 4 Learning Attention & Intervention Guidance Card */}
      {plan && (
        <Card
          className={`p-5 border transition-all ${
            isElevatedRisk
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-warm-ivory border-deep-green/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isElevatedRisk
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-dark-green text-yellow'
                }`}
              >
                {isElevatedRisk ? <AlertCircle size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-dark-text">Adaptive Learning Guidance</h3>
                  <Badge variant={isElevatedRisk ? 'yellow' : 'deepGreen'}>
                    Attention: {riskLevel}
                  </Badge>
                  {interventionUrgency && (
                    <span className="text-[10px] font-mono text-muted uppercase">
                      Urgency: {interventionUrgency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {interventionAction
                    ? `Recommended Action: ${formatActionLabel(interventionAction)}`
                    : 'Pacing optimal. Continue through structured sequence.'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateTab('progress')}
              className="shrink-0"
            >
              <span>View Diagnostics</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}

      {/* 3. Key Status Grid: Interests (Model 5), Skill Gaps (Model 1), and Practice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model 5: Interest Signals */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles size={16} className="text-dark-green" /> Interest Signals
            </span>
            <Badge variant="yellow">Model 5</Badge>
          </div>

          <div className="space-y-2">
            {isLoadingPlan ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-1/2" />
              </div>
            ) : topInterests.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-dark-text mb-2">Inferred Concept Focus</h4>
                <div className="flex flex-wrap gap-1.5">
                  {topInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-dark-green/10 text-dark-green border border-deep-green/20"
                    >
                      {formatSkillName(interest)}
                    </span>
                  ))}
                </div>
                {typeof plan?.interest?.confidence === 'number' && (
                  <p className="text-[10px] font-mono text-muted mt-2">
                    Signal Confidence: {Math.round(plan.interest.confidence * 100)}%
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted italic py-2">
                No interest signals yet. Complete assessments to establish interest affinities.
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => onNavigateTab('roadmap')}>
            Explore Pathways
          </Button>
        </Card>

        {/* Model 1: Skill Gap Diagnostic Status */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Target size={16} className="text-dark-green" /> Prerequisite Skill Gaps
            </span>
            <Badge variant="deepGreen">Model 1</Badge>
          </div>

          <div className="space-y-2">
            {isLoadingPlan ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-2/3" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-4/5" />
              </div>
            ) : (
              <>
                <h4 className="text-sm font-bold text-dark-text">
                  {activeGapsCount > 0
                    ? `${activeGapsCount} Skill Gap${activeGapsCount > 1 ? 's' : ''} Identified`
                    : 'Prerequisite Graph Clear'}
                </h4>
                <p className="text-xs text-muted">
                  {activeGapsCount > 0
                    ? 'Targeted remediation items recommended to unlock advanced nodes.'
                    : 'No critical prerequisite blockages detected across sequence.'}
                </p>
              </>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={() => onNavigateTab('skills')}>
            Inspect Skill Gaps
          </Button>
        </Card>

        {/* Adaptive Practice & Placement */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-dark-green" /> Adaptive Practice
            </span>
            <Badge variant="yellow">Model 2</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-dark-text">IRT Mastery Calibration</h4>
            <p className="text-xs text-muted">
              {plan?.mastery?.length
                ? `${plan.mastery.length} competencies monitored with dynamic item difficulty.`
                : 'Calibrate your competency level through adaptive diagnostic items.'}
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={() => onNavigateTab('practice')}>
            Launch Assessment
          </Button>
        </Card>
      </div>

      {/* 4. Model 3: Real Recommended Learning Objects Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-dark-green" />
            <h3 className="text-lg font-bold text-dark-text">Recommended Learning Objects</h3>
            <Badge variant="yellow">Model 3</Badge>
          </div>
          {recommendations.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => onNavigateTab('learning')}>
              View All ({recommendations.length})
            </Button>
          )}
        </div>

        {isLoadingPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 bg-warm-ivory border-deep-green/20 space-y-3">
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-full" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-1/2" />
              </Card>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <Card
                key={rec.resource_id}
                className="p-5 bg-warm-ivory border-deep-green/30 hover:border-deep-green transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted">{rec.resource_id}</span>
                    <Badge variant={rec.difficulty === 'BEGINNER' || rec.difficulty === 'EASY' ? 'deepGreen' : 'yellow'}>
                      {rec.difficulty}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-dark-text line-clamp-2">{rec.title}</h4>
                  {rec.concept && (
                    <p className="text-xs text-muted font-mono">{formatSkillName(rec.concept)}</p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-muted border-t border-deep-green/10">
                  <span>{rec.estimated_minutes ? `${rec.estimated_minutes} mins` : 'Self-paced'}</span>
                  {typeof rec.score === 'number' && (
                    <span className="font-mono font-semibold text-dark-green">
                      Match: {Math.round(rec.score * 100)}%
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 bg-warm-ivory border-deep-green/20 text-center text-xs text-muted">
            No recommendations generated yet. Complete a diagnostic assessment to generate targeted resources.
          </Card>
        )}
      </div>

      {/* 5. Main Pathway Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
          <TrendingUp size={18} className="text-dark-green" />
          <span>Active Learning Sequence</span>
        </h3>

        {isLoading ? (
          <Card className="py-12 text-center text-muted font-mono text-xs bg-warm-ivory">
            Querying active student pathways from backend API...
          </Card>
        ) : pathway && pathway.nodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-dark-text">Prerequisite Learning Sequence</h4>
                <Badge variant="yellow">{pathway.nodes.length} Nodes</Badge>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Dynamic skill graph generated from prerequisite dependencies and mastery states.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onNavigateTab('roadmap')}>
                  Open Roadmap
                </Button>
                {pathway.nodes.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => onSelectSkill(pathway.nodes[0])}>
                    Inspect Skill
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <EmptyState
            title="No Active Learning Pathways Enrolled"
            description="Your student profile is ready. Complete your initial placement assessment to generate your personalized prerequisite roadmap from the backend."
            actionLabel="Begin Diagnostic Placement"
            onAction={() => onNavigateTab('practice')}
            statusBadge="Real ML Model Plan Integrated"
          />
        )}
      </div>
    </div>
  );
};
