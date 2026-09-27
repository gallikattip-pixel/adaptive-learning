import React from 'react';
import type { UnifiedPersonalizedPlan } from '@/types/ml';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatSkillName, formatStatusLabel, formatActionLabel } from '@/lib/mlFormatters';
import { TrendingUp, BarChart2, ShieldCheck, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export interface ProgressSectionProps {
  plan: UnifiedPersonalizedPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  onRetryPlan: () => void;
  onStartDiagnostic: () => void;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  plan,
  isLoadingPlan,
  planError,
  onRetryPlan,
  onStartDiagnostic,
}) => {
  const masteryItems = plan?.mastery || [];
  const riskAssessment = plan?.risk;
  const intervention = plan?.intervention;

  const masteredCount = masteryItems.filter(
    (m) => m.mastery_status === 'MASTERED' || m.mastery_probability >= 0.8
  ).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Model 2 Mastery & Model 4 Risk Telemetry</Badge>
            {isLoadingPlan && (
              <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Calibrating...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">
            Learning Analytics & Mastery Progression
          </h2>
          <p className="text-xs text-muted mt-1">
            Real-time competency calibration and risk mitigation telemetry from the ML pipeline.
          </p>
        </div>

        {plan && (
          <Button variant="outline" size="sm" onClick={onRetryPlan} disabled={isLoadingPlan}>
            <RefreshCw size={14} className={isLoadingPlan ? 'animate-spin' : ''} />
            <span>Recalibrate</span>
          </Button>
        )}
      </div>

      {/* Error state */}
      {planError && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-dark-text flex items-center justify-between">
          <span className="text-xs text-amber-900">
            Could not retrieve latest analytics telemetry from backend.
          </span>
          <Button variant="outline" size="sm" onClick={onRetryPlan}>
            Retry
          </Button>
        </Card>
      )}

      {/* Analytics Metric Cards Structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model 2 Mastery Count */}
        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Verified Mastery</span>
            <TrendingUp size={16} className="text-dark-green" />
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono">
            {masteryItems.length > 0 ? `${masteredCount} / ${masteryItems.length}` : '0 / --'}
          </div>
          <p className="text-[11px] text-muted">
            {masteryItems.length > 0
              ? `${masteredCount} verified mastered competencies`
              : 'Awaiting initial diagnostic evaluation'}
          </p>
        </Card>

        {/* Model 4 Risk Score */}
        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Learning Risk Status</span>
            {riskAssessment?.risk_level === 'NORMAL' ? (
              <ShieldCheck size={16} className="text-deep-green" />
            ) : (
              <AlertCircle size={16} className="text-amber-700" />
            )}
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono flex items-center gap-2">
            <span>{riskAssessment?.risk_level || 'NORMAL'}</span>
            {typeof riskAssessment?.risk_score === 'number' && (
              <span className="text-sm font-normal text-muted">
                ({Math.round(riskAssessment.risk_score * 100)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">
            {intervention?.recommended_action
              ? `Action: ${formatActionLabel(intervention.recommended_action)}`
              : 'Pacing optimal and progression nominal'}
          </p>
        </Card>

        {/* Dynamic Difficulty Recommendation */}
        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Adaptive Difficulty Calibration</span>
            <Zap size={16} className="text-dark-green" />
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono">
            {masteryItems.length > 0 && masteryItems[0]?.recommended_next_difficulty
              ? masteryItems[0].recommended_next_difficulty
              : 'DYNAMIC'}
          </div>
          <p className="text-[11px] text-muted">Calibrated to optimize concept retention</p>
        </Card>
      </div>

      {/* Model 2: Competency Mastery Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-dark-green" />
            <h3 className="text-lg font-bold text-dark-text">Competency Mastery Evaluations</h3>
            <Badge variant="deepGreen">Model 2</Badge>
          </div>
        </div>

        {isLoadingPlan && !plan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 bg-warm-ivory border-deep-green/20 space-y-3">
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-1/3" />
                <div className="h-2 bg-deep-green/10 rounded-full animate-pulse w-full" />
              </Card>
            ))}
          </div>
        ) : masteryItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {masteryItems.map((item, idx) => {
              const statusInfo = formatStatusLabel(item.mastery_status);
              const percentage = Math.round((item.mastery_probability || 0) * 100);

              return (
                <Card
                  key={`${item.skill}-${idx}`}
                  className="p-5 bg-warm-ivory border-deep-green/30 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-dark-text">
                      {formatSkillName(item.skill)}
                    </h4>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Real Mastery Probability Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-muted">
                      <span>Mastery Probability</span>
                      <span className="font-bold text-dark-text">{percentage}%</span>
                    </div>
                    <div className="w-full bg-deep-green/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-deep-green h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-deep-green/10 flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>
                      Target Level:{' '}
                      <strong className="text-dark-text">
                        {item.recommended_next_difficulty || 'Standard'}
                      </strong>
                    </span>
                    {typeof item.confidence === 'number' && (
                      <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Your Progress History Will Appear Here"
            description="After you complete learning activities and placement assessments, your mastery trajectory and concept retention metrics will be logged in real time."
            actionLabel="Complete First Assessment"
            onAction={onStartDiagnostic}
            statusBadge="Model 2 Calibration Ready"
          />
        )}
      </div>
    </div>
  );
};
