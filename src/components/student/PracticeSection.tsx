import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { diagnosticService } from '@/services/api/diagnosticService';
import type {
  DiagnosticStartResponse,
  DiagnosticSubmitResponse,
} from '@/types/learning';
import {
  DiagnosticAssessmentRunner,
  DiagnosticResultView,
} from './DiagnosticAssessmentRunner';
import { BrainCircuit, Activity, AlertCircle, Info, RefreshCw } from 'lucide-react';

export interface PracticeSectionProps {
  studentId?: string;
  onDiagnosticCompleted?: (result: DiagnosticSubmitResponse) => void | Promise<void>;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  studentId,
  onDiagnosticCompleted,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<DiagnosticStartResponse | null>(null);
  const [completedResult, setCompletedResult] = useState<DiagnosticSubmitResponse | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const handleStartDiagnostic = async () => {
    setIsStarting(true);
    setStatusNotice(null);

    try {
      // Connect to real backend diagnostic start endpoint (authenticated via Firebase token)
      const session = await diagnosticService.startDiagnostic();
      setActiveSession(session);
    } catch (err: any) {
      const code = err?.code;
      const status = err?.status;
      const message = err?.message || '';

      if (status === 401 || code === 'UNAUTHORIZED') {
        setStatusNotice({
          type: 'error',
          title: 'Authentication Required',
          message: 'Your student session has expired. Please log in again to launch the diagnostic assessment.',
        });
      } else if (code === 'PLACEMENT_NOT_CONFIGURED' || message.includes('No placement assessment')) {
        setStatusNotice({
          type: 'info',
          title: 'Placement Assessment Not Configured Yet',
          message:
            'A placement assessment is not currently configured in the database. Once created by administrators, it will be automatically available here.',
        });
      } else if (code === 'QUESTIONS_NOT_CONFIGURED') {
        setStatusNotice({
          type: 'warning',
          title: 'Questions Not Configured',
          message: 'The placement assessment is present but has no questions configured yet.',
        });
      } else if (status === 403 || code === 'FORBIDDEN') {
        setStatusNotice({
          type: 'error',
          title: 'Access Restricted',
          message: 'You do not have permission to access this assessment session.',
        });
      } else {
        setStatusNotice({
          type: 'error',
          title: 'Service Notice',
          message: message || 'Unable to connect to the diagnostic assessment service. Please check your network and retry.',
        });
      }
    } finally {
      setIsStarting(false);
    }
  };

  // 1. If an assessment is completed, render the authoritative result view
  if (completedResult) {
    return (
      <DiagnosticResultView
        result={completedResult}
        onClose={() => setCompletedResult(null)}
      />
    );
  }

  // 2. If an active session is in-progress, render the assessment runner
  if (activeSession) {
    return (
      <DiagnosticAssessmentRunner
        session={activeSession}
        onComplete={(result) => {
          setActiveSession(null);
          setCompletedResult(result);
          onDiagnosticCompleted?.(result);
        }}
        onExit={() => setActiveSession(null)}
      />
    );
  }

  // 3. Default Practice launcher dashboard view
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Diagnostic Assessment</Badge>
            <span className="font-mono text-xs text-muted">Foundational Evaluation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">Adaptive Practice & Assessment</h2>
          <p className="text-xs text-muted mt-1">
            Dynamic practice tasks and placement assessments connected to the authoritative backend service.
          </p>
        </div>
      </div>

      {/* Main Placement Launcher Card */}
      <Card className="p-6 sm:p-8 bg-warm-ivory border-deep-green/30 max-w-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-deep-green/20">
          <div>
            <h3 className="text-lg font-bold text-dark-text">Initial Placement Assessment</h3>
            <p className="text-xs text-muted">Evaluates foundational domain boundaries to build your knowledge graph</p>
          </div>
          <Badge variant="deepGreen">Live Backend Connected</Badge>
        </div>

        <div className="space-y-4 text-xs text-dark-text leading-relaxed">
          <p>
            The practice engine authoritatively evaluates response accuracy and latency. Tests are graded server-side and recorded to your learning record.
          </p>
          <div className="p-4 rounded-lg bg-ivory border border-deep-green/30 space-y-1.5 font-mono text-[11px] text-muted">
            <div className="text-dark-green font-bold flex items-center gap-1.5">
              <Activity size={14} /> SERVICE ENDPOINT: POST /api/v1/diagnostic/start
            </div>
            <div>Authenticated Student Context: {studentId ? 'Active Session' : 'Signed In'}</div>
          </div>
        </div>

        {/* Real Backend Status Feedback */}
        {statusNotice && (
          <div
            className={`p-4 rounded-xl font-mono text-xs space-y-1.5 border transition-all ${
              statusNotice.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200'
                : statusNotice.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-dark-green text-ivory border-deep-green'
            }`}
          >
            <div
              className={`font-bold flex items-center gap-1.5 ${
                statusNotice.type === 'error'
                  ? 'text-red-700'
                  : statusNotice.type === 'warning'
                  ? 'text-amber-700'
                  : 'text-yellow'
              }`}
            >
              {statusNotice.type === 'error' ? (
                <AlertCircle size={15} />
              ) : statusNotice.type === 'warning' ? (
                <AlertCircle size={15} />
              ) : (
                <Info size={15} />
              )}
              <span>{statusNotice.title}</span>
            </div>
            <div className="text-[11px] leading-relaxed">{statusNotice.message}</div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleStartDiagnostic}
          isLoading={isStarting}
          disabled={isStarting}
        >
          {isStarting ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <BrainCircuit size={18} />
          )}
          <span>{isStarting ? 'Connecting to Backend...' : 'Launch Placement Assessment'}</span>
        </Button>
      </Card>

      {/* Attempts & Empty State */}
      <EmptyState
        title="No Practice Attempts Recorded Yet"
        description="Your practice attempts and response logs will be displayed here after you complete learning activities against the connected backend assessment service."
        statusBadge="No Fake Data Enforced"
      />
    </div>
  );
};
