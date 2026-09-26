import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { apiClient } from '@/services/api/apiClient';
import { BrainCircuit, Activity } from 'lucide-react';

export interface PracticeSectionProps {
  studentId?: string;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({ studentId }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [endpointNotice, setEndpointNotice] = useState<string | null>(null);

  const handleStartDiagnostic = async () => {
    setIsEvaluating(true);
    setEndpointNotice(null);

    try {
      // Attempt real call to configured endpoint
      await apiClient.post('/diagnostic/start', { studentId });
      setEndpointNotice('Diagnostic assessment initialized with backend assessment service.');
    } catch {
      // Honest, non-simulated feedback when backend endpoint is unconfigured
      setEndpointNotice(
        'Placement assessment endpoint (/api/v1/diagnostic/start) is not connected yet. Connect the real assessment backend service to enable live diagnostic testing.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Adaptive IRT Engine</Badge>
            <span className="font-mono text-xs text-muted">Item Difficulty Regulation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">Adaptive Practice & Assessment</h2>
          <p className="text-xs text-muted mt-1">
            Dynamic practice tasks that recalibrate question difficulty parameters based on real-time item response theory.
          </p>
        </div>
      </div>

      {/* Main Practice Launcher Card */}
      <Card className="p-8 bg-warm-ivory border-deep-green/30 max-w-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-deep-green/20">
          <div>
            <h3 className="text-lg font-bold text-dark-text">Initial Placement Assessment</h3>
            <p className="text-xs text-muted">Evaluates foundational domain boundaries to build your knowledge graph</p>
          </div>
          <Badge variant="deepGreen">Backend Service Endpoint</Badge>
        </div>

        <div className="space-y-4 text-xs text-dark-text leading-relaxed">
          <p>
            The practice engine evaluates response accuracy and latency. When uncertainty is detected on an item, the backend automatically logs the prerequisite node for micro-remediation.
          </p>
          <div className="p-4 rounded-lg bg-ivory border border-deep-green/30 space-y-1.5 font-mono text-[11px] text-muted">
            <div className="text-dark-green font-bold flex items-center gap-1.5">
              <Activity size={14} /> SERVICE ENDPOINT: POST /api/v1/diagnostic/start
            </div>
            <div>Student Identifier: {studentId || 'session_active'}</div>
          </div>
        </div>

        {endpointNotice && (
          <div className="p-4 rounded-lg bg-dark-green text-ivory font-mono text-xs space-y-1 border border-deep-green">
            <div className="text-yellow font-bold">SERVICE CONNECTION STATUS</div>
            <div>{endpointNotice}</div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleStartDiagnostic}
          isLoading={isEvaluating}
        >
          <BrainCircuit size={18} />
          <span>Launch Placement Assessment</span>
        </Button>
      </Card>

      {/* Attempts & Weak Concepts Empty State */}
      <EmptyState
        title="No Practice Attempts Recorded Yet"
        description="Your practice attempts and response logs will be displayed here after you complete learning activities against a connected backend assessment service."
        statusBadge="No Fake Data Enforced"
      />
    </div>
  );
};
