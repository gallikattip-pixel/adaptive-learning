import React from 'react';
import type { UnifiedPersonalizedPlan } from '@/types/ml';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatSkillName } from '@/lib/mlFormatters';
import { BookOpen, Clock, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

export interface LearningSectionProps {
  plan: UnifiedPersonalizedPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  onRetryPlan: () => void;
  onStartDiagnostic: () => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  plan,
  isLoadingPlan,
  planError,
  onRetryPlan,
  onStartDiagnostic,
}) => {
  const recommendations = plan?.recommendations || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Model 3 Recommendation Engine</Badge>
            {isLoadingPlan && (
              <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Fetching recommendations...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">
            Recommended Learning Objects
          </h2>
          <p className="text-xs text-muted mt-1">
            Targeted micro-learning content allocated dynamically based on your active prerequisite skill gaps.
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
            Unable to retrieve personalized resource recommendations from backend.
          </span>
          <Button variant="outline" size="sm" onClick={onRetryPlan}>
            Retry
          </Button>
        </Card>
      )}

      {/* Loading Skeletons */}
      {isLoadingPlan && !plan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 bg-warm-ivory border-deep-green/20 space-y-4">
              <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-1/4" />
              <div className="h-5 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
              <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-full" />
            </Card>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => {
            const isBeginner = rec.difficulty === 'BEGINNER' || rec.difficulty === 'EASY';

            return (
              <Card
                key={rec.resource_id}
                className="p-6 bg-warm-ivory border-deep-green/30 hover:border-deep-green space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-dark-green bg-dark-green/10 px-2 py-0.5 rounded">
                      {rec.resource_id}
                    </span>
                    <Badge variant={isBeginner ? 'deepGreen' : 'yellow'}>
                      {rec.difficulty}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-dark-text text-base leading-snug">
                    {rec.title}
                  </h3>

                  {rec.concept && (
                    <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                      <Sparkles size={13} className="text-dark-green" />
                      <span>{formatSkillName(rec.concept)}</span>
                    </div>
                  )}

                  {rec.match_reasons && rec.match_reasons.length > 0 && (
                    <div className="space-y-1">
                      {rec.match_reasons.map((reason, idx) => (
                        <p key={idx} className="text-[11px] text-muted italic">
                          • {reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-deep-green/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {rec.estimated_minutes ? `${rec.estimated_minutes} mins` : 'Self-paced'}
                    </span>
                    {typeof rec.score === 'number' && (
                      <span className="font-mono font-bold text-dark-green">
                        Match: {Math.round(rec.score * 100)}%
                      </span>
                    )}
                  </div>

                  <Button variant="secondary" size="sm" className="w-full justify-center">
                    <BookOpen size={14} />
                    <span>Open Learning Object</span>
                    <ExternalLink size={12} className="ml-auto opacity-70" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Recommended Learning Objects Available Yet"
          description="Learning resources are automatically allocated by the Model 3 recommendation engine based on your active skill gaps and diagnostic assessments."
          actionLabel="Launch Diagnostic Assessment"
          onAction={onStartDiagnostic}
          statusBadge="Model 3 Allocation Ready"
        />
      )}
    </div>
  );
};
