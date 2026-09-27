import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type {
  DiagnosticStartResponse,
  DiagnosticQuestion,
  DiagnosticSubmitResponse,
} from '@/types/learning';
import { diagnosticService } from '@/services/api/diagnosticService';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  LogOut,
  BarChart3,
  Award,
} from 'lucide-react';

export interface DiagnosticAssessmentRunnerProps {
  session: DiagnosticStartResponse;
  onComplete: (result: DiagnosticSubmitResponse) => void;
  onExit: () => void;
}

export const DiagnosticAssessmentRunner: React.FC<DiagnosticAssessmentRunnerProps> = ({
  session,
  onComplete,
  onExit,
}) => {
  const { questions, attemptId, assessment } = session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [questionLatencies, setQuestionLatencies] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // High-precision client-side latency timer
  const questionStartTimeRef = useRef<number>(performance.now());

  // Record elapsed latency when changing questions or unmounting
  const flushCurrentQuestionLatency = useCallback(() => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const now = performance.now();
    const elapsed = now - questionStartTimeRef.current;
    if (elapsed > 0 && Number.isFinite(elapsed)) {
      setQuestionLatencies((prev) => ({
        ...prev,
        [currentQ.id]: (prev[currentQ.id] || 0) + elapsed,
      }));
    }
    questionStartTimeRef.current = now;
  }, [currentIndex, questions]);

  // Reset timer on index change
  useEffect(() => {
    questionStartTimeRef.current = performance.now();
  }, [currentIndex]);

  const currentQuestion: DiagnosticQuestion | undefined = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k] && selectedAnswers[k].trim()
  ).length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelectOption = (option: string) => {
    if (!currentQuestion || isSubmitting) return;
    flushCurrentQuestionLatency();
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      flushCurrentQuestionLatency();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flushCurrentQuestionLatency();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    flushCurrentQuestionLatency();

    // Verify all questions have an answer
    const unanswered = questions.filter(
      (q) => !selectedAnswers[q.id] || !selectedAnswers[q.id].trim()
    );
    if (unanswered.length > 0) {
      setSubmitError(
        `Please answer all questions before submitting. Unanswered: Question ${
          questions.findIndex((q) => q.id === unanswered[0].id) + 1
        }`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payloadAnswers = questions.map((q) => {
        const rawLatency = questionLatencies[q.id];
        const validLatency =
          typeof rawLatency === 'number' && Number.isFinite(rawLatency) && rawLatency >= 0
            ? Math.round(rawLatency)
            : undefined;

        return {
          questionId: q.id,
          answer: selectedAnswers[q.id].trim(),
          ...(validLatency !== undefined ? { latencyMs: validLatency } : {}),
        };
      });

      const result = await diagnosticService.submitDiagnostic({
        attemptId,
        answers: payloadAnswers,
      });

      onComplete(result);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to submit diagnostic assessment. Please retry.';
      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="p-8 bg-warm-ivory border-deep-green/30 text-center space-y-4">
        <p className="text-sm text-dark-text">No active question to display.</p>
        <Button variant="outline" onClick={onExit}>
          Return to Practice
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Assessment Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="deepGreen">{assessment.domain || 'Game Development'}</Badge>
            <span className="font-mono text-xs text-muted">Placement Diagnostic</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">{assessment.title}</h2>
          {assessment.description && (
            <p className="text-xs text-muted mt-1">{assessment.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showExitConfirm ? (
            <div className="flex items-center gap-2 bg-warm-ivory p-2 rounded-lg border border-deep-green/30 text-xs">
              <span className="text-muted">Exit without saving?</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 h-7 px-2"
                onClick={onExit}
              >
                Exit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setShowExitConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitConfirm(true)}
              className="text-muted hover:text-dark-text"
            >
              <LogOut size={14} />
              <span>Exit Assessment</span>
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted font-mono">
          <span>
            Question <strong className="text-dark-green">{currentIndex + 1}</strong> of{' '}
            <strong>{totalQuestions}</strong>
          </span>
          <span>{answeredCount} of {totalQuestions} answered</span>
        </div>
        <div className="w-full bg-deep-green/10 h-2 rounded-full overflow-hidden">
          <div
            className="bg-deep-green h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Card */}
      <Card className="p-6 sm:p-8 bg-warm-ivory border-deep-green/30 space-y-6">
        {/* Question Header & Category Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-deep-green/15">
          <Badge variant="outline" className="font-mono text-[11px]">
            {currentQuestion.skillId}
          </Badge>
          {currentQuestion.difficultyLevel && (
            <span className="font-mono text-[11px] text-muted uppercase">
              Difficulty: {currentQuestion.difficultyLevel}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-semibold text-dark-text leading-relaxed">
          {currentQuestion.questionText}
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow ${
                    isSelected
                      ? 'bg-deep-green text-ivory border-deep-green shadow-sm'
                      : 'bg-ivory/80 hover:bg-ivory text-dark-text border-deep-green/20 hover:border-deep-green/40'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      isSelected
                        ? 'border-yellow text-yellow bg-deep-green'
                        : 'border-muted/50 text-muted bg-white'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium leading-normal pt-0.5">{option}</span>
                </button>
              );
            })
          ) : (
            <p className="text-xs text-muted italic">No options configured for this item.</p>
          )}
        </div>

        {/* Submit Error Notice */}
        {submitError && (
          <div className="p-4 rounded-lg bg-red-50 text-red-800 text-xs flex items-center gap-2 border border-red-200">
            <AlertTriangle size={16} className="flex-shrink-0 text-red-600" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-deep-green/20">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isSubmitting}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </Button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {currentIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestion.id] || isSubmitting}
              >
                <span>Next Question</span>
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={answeredCount < totalQuestions}
                className="bg-yellow text-dark-green font-bold shadow-md"
              >
                <Send size={16} />
                <span>Submit Assessment</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export interface DiagnosticResultViewProps {
  result: DiagnosticSubmitResponse;
  onClose: () => void;
}

export const DiagnosticResultView: React.FC<DiagnosticResultViewProps> = ({
  result,
  onClose,
}) => {
  const percentage = Math.round(result.score * 100);
  const skillEntries = Object.entries(result.skillSummary || {});

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-dark-green text-ivory border border-deep-green shadow-lg space-y-4 text-center">
        <div className="inline-flex p-3 rounded-full bg-deep-green text-yellow mb-1">
          <Award size={32} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Diagnostic Assessment Complete
        </h2>
        <p className="text-xs sm:text-sm text-ivory/80 max-w-xl mx-auto">
          Your diagnostic evaluation has been authoritatively recorded on the server. Your learning
          pathway and skill gaps reflect this performance.
        </p>

        {/* Aggregate Score Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl mx-auto text-dark-text">
          <div className="p-4 rounded-xl bg-warm-ivory border border-deep-green/30 text-center">
            <div className="text-2xl font-black text-dark-green">{percentage}%</div>
            <div className="text-[11px] font-mono text-muted uppercase mt-0.5">Overall Accuracy</div>
          </div>
          <div className="p-4 rounded-xl bg-warm-ivory border border-deep-green/30 text-center">
            <div className="text-2xl font-black text-dark-green">
              {result.correctCount} / {result.totalQuestions}
            </div>
            <div className="text-[11px] font-mono text-muted uppercase mt-0.5">Correct Answers</div>
          </div>
          <div className="p-4 rounded-xl bg-warm-ivory border border-deep-green/30 text-center">
            <div className="text-2xl font-black text-dark-green">
              {result.status}
            </div>
            <div className="text-[11px] font-mono text-muted uppercase mt-0.5">Attempt Status</div>
          </div>
        </div>
      </div>

      {/* Per-Skill Diagnostic Breakdown */}
      {skillEntries.length > 0 && (
        <Card className="p-6 bg-warm-ivory border-deep-green/30 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-deep-green/20">
            <BarChart3 size={18} className="text-dark-green" />
            <h3 className="text-base font-bold text-dark-text">Skill Competency Summary</h3>
          </div>

          <div className="space-y-3">
            {skillEntries.map(([skillId, summary]) => {
              const skillPercent = Math.round(summary.score * 100);
              return (
                <div
                  key={skillId}
                  className="p-3.5 rounded-lg bg-ivory border border-deep-green/20 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-dark-text">{skillId}</span>
                    <span className="font-mono text-muted">
                      {summary.correctCount} / {summary.totalQuestions} ({skillPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-deep-green/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-deep-green h-full rounded-full"
                      style={{ width: `${skillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Footer Return Action */}
      <div className="flex justify-center pt-2">
        <Button variant="primary" size="lg" onClick={onClose}>
          <span>Return to Dashboard</span>
        </Button>
      </div>
    </div>
  );
};
