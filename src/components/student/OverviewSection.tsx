import React from 'react';
import type { StudentUser } from '@/types/auth';
import type { LearningPathway, SkillNode } from '@/types/learning';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { GitBranch, Target, BrainCircuit, ArrowRight } from 'lucide-react';

export interface OverviewSectionProps {
  user: StudentUser | null;
  pathways: LearningPathway[];
  isLoading: boolean;
  onNavigateTab: (tab: 'roadmap' | 'skills' | 'practice' | 'diagnostics' | 'learning') => void;
  onSelectSkill: (skill: SkillNode) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  user,
  pathways,
  isLoading,
  onNavigateTab,
  onSelectSkill,
}) => {
  const activePathway = pathways.length > 0 ? pathways[0] : null;
  const currentSkill = activePathway?.nodes.find((n) => n.status === 'in_progress') || activePathway?.nodes[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome / Current Status Header */}
      <Card className="bg-dark-green border-deep-green text-ivory p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="yellow" className="text-[10px]">
              Active Student Workspace
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ivory">
              Welcome back, {user?.firstName || 'Student'}
            </h2>
            <p className="text-xs sm:text-sm text-ivory/80">
              {user?.primaryGoal
                ? `Target Learning Domain: ${user.primaryGoal}`
                : 'Real-Time Adaptive Mastery & Prerequisite Evaluation'}
            </p>
          </div>

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
      </Card>

      {/* 2. Key Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Target Skill */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Target size={16} className="text-dark-green" /> Current Skill Target
            </span>
            <Badge variant="yellow">Active</Badge>
          </div>

          {currentSkill ? (
            <div className="space-y-2">
              <h3 className="text-base font-bold text-dark-text">{currentSkill.title}</h3>
              <p className="text-xs text-muted line-clamp-2">{currentSkill.description}</p>
              <Button variant="outline" size="sm" onClick={() => onSelectSkill(currentSkill)}>
                Inspect Skill Details
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted italic">
              No active skill target set. Complete diagnostic placement test to set your first target.
            </div>
          )}
        </Card>

        {/* Skill Gap Status */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <GitBranch size={16} className="text-dark-green" /> Skill Gap Status
            </span>
            <Badge variant="deepGreen">Remediation Engine</Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-dark-text">Prerequisite Graph Analysis</h3>
            <p className="text-xs text-muted">
              Evaluates response latency and accuracy to isolate prerequisite missing nodes.
            </p>
            <Button variant="secondary" size="sm" onClick={() => onNavigateTab('skills')}>
              Check Skill Gaps
            </Button>
          </div>
        </Card>

        {/* Diagnostic Placement */}
        <Card className="bg-warm-ivory border-deep-green/30 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-dark-green" /> Diagnostic Placement
            </span>
            <Badge variant="yellow">Item Response</Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-dark-text">Adaptive IRT Diagnostic</h3>
            <p className="text-xs text-muted">
              Probes domain boundaries to calibrate item difficulty parameters.
            </p>
            <Button variant="primary" size="sm" onClick={() => onNavigateTab('practice')}>
              Launch Assessment
            </Button>
          </div>
        </Card>
      </div>

      {/* 3. Main Pathway Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-dark-text flex items-center gap-2">
          <span>Active Learning Sequence</span>
        </h3>

        {isLoading ? (
          <Card className="py-12 text-center text-muted font-mono text-xs bg-warm-ivory">
            Querying active student pathways from backend API...
          </Card>
        ) : pathways.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pathways.map((pw) => (
              <Card key={pw.id} className="p-6 bg-warm-ivory border-deep-green/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-dark-text">{pw.title}</h4>
                  <Badge variant="yellow">{pw.nodes.length} Nodes</Badge>
                </div>
                <p className="text-xs text-muted leading-relaxed">{pw.description}</p>
                <Button variant="secondary" size="sm" onClick={() => onNavigateTab('roadmap')}>
                  Open Roadmap
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Active Learning Pathways Enrolled"
            description="Your student profile is ready. Complete your initial placement assessment to generate your personalized prerequisite roadmap from the backend."
            actionLabel="Begin Diagnostic Placement"
            onAction={() => onNavigateTab('practice')}
            statusBadge="Zero Dummy Data Enforced"
          />
        )}
      </div>
    </div>
  );
};
