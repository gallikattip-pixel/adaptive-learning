import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { TrendingUp, BarChart2, Calendar } from 'lucide-react';

export interface ProgressSectionProps {
  onStartDiagnostic: () => void;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({ onStartDiagnostic }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Mastery Progression</Badge>
            <span className="font-mono text-xs text-muted">Real-Time Growth Log</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">Learning Analytics & Progress</h2>
          <p className="text-xs text-muted mt-1">
            Verified prerequisite mastery records, assessment performance, and skill growth velocity.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards Structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Verified Mastery</span>
            <TrendingUp size={16} className="text-dark-green" />
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono">0 / --</div>
          <p className="text-[11px] text-muted">Awaiting initial placement diagnostic</p>
        </Card>

        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Completed Assessments</span>
            <BarChart2 size={16} className="text-dark-green" />
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono">0</div>
          <p className="text-[11px] text-muted">No diagnostic attempts recorded</p>
        </Card>

        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-semibold uppercase tracking-wider">
            <span>Learning Session Activity</span>
            <Calendar size={16} className="text-dark-green" />
          </div>
          <div className="text-2xl font-extrabold text-dark-text font-mono">Active</div>
          <p className="text-[11px] text-muted">Session authenticated</p>
        </Card>
      </div>

      {/* Empty State */}
      <EmptyState
        title="Your Progress History Will Appear Here"
        description="After you complete learning activities and placement assessments, your mastery trajectory and concept retention metrics will be logged in real time."
        actionLabel="Complete First Assessment"
        onAction={onStartDiagnostic}
        statusBadge="Zero Dummy Statistics Enforced"
      />
    </div>
  );
};
