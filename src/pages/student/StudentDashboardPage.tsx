import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { mlService } from '@/services/ml/mlService';
import { apiClient } from '@/services/api/apiClient';
import type { LearningPathway, SkillNode } from '@/types/learning';

// Sidebar & Header
import { StudentSidebar, type DashboardTab } from '@/components/student/StudentSidebar';
import { DashboardHeader } from '@/components/student/DashboardHeader';

// Dashboard Sub-Sections
import { OverviewSection } from '@/components/student/OverviewSection';
import { MySkillsSection } from '@/components/student/MySkillsSection';
import { RoadmapSection } from '@/components/student/RoadmapSection';
import { LearningSection } from '@/components/student/LearningSection';
import { PracticeSection } from '@/components/student/PracticeSection';
import { ProgressSection } from '@/components/student/ProgressSection';
import { ProfileSection } from '@/components/student/ProfileSection';

// Modals
import { SkillDetailModal } from '@/components/student/SkillDetailModal';

export const StudentDashboardPage: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Navigation State
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data & API States
  const [pathways, setPathways] = useState<LearningPathway[]>([]);
  const [isLoadingPathways, setIsLoadingPathways] = useState<boolean>(true);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'testing' | 'offline' | 'online'>('testing');
  const [mlEndpointStatus, setMlEndpointStatus] = useState<'unconfigured' | 'active'>('unconfigured');

  // Selected Skill for Detail Inspection Modal
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStudentPathways() {
      setIsLoadingPathways(true);
      try {
        const response = await apiClient.get<LearningPathway[]>('/student/pathways');
        if (isMounted) {
          setPathways(response.data || []);
          setApiConnectionStatus('online');
        }
      } catch {
        if (isMounted) {
          setPathways([]);
          setApiConnectionStatus('offline');
        }
      } finally {
        if (isMounted) setIsLoadingPathways(false);
      }
    }

    async function checkMlGateway() {
      if (!user) return;
      const res = await mlService.predictSkillGaps({
        studentId: user.uid || user.id || '',
        targetSkillId: 'diagnostic_check',
      });
      if (isMounted) {
        setMlEndpointStatus(res ? 'active' : 'unconfigured');
      }
    }

    fetchStudentPathways();
    checkMlGateway();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getSectionTitle = (): string => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'skills':
        return 'My Skills Inventory';
      case 'roadmap':
        return 'Learning Roadmap';
      case 'learning':
        return 'Learning Objects';
      case 'practice':
        return 'Adaptive Practice';
      case 'progress':
        return 'Progress & Performance';
      case 'profile':
        return 'Student Profile & Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-dark-text flex flex-col lg:flex-row">
      {/* 1. Side Navigation (Persistent on Desktop, Drawer on Mobile) */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <DashboardHeader
          title={getSectionTitle()}
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          apiStatus={apiConnectionStatus}
          mlStatus={mlEndpointStatus}
        />

        {/* Main Dashboard Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            >
              {activeTab === 'overview' && (
                <OverviewSection
                  user={user}
                  pathways={pathways}
                  isLoading={isLoadingPathways}
                  onNavigateTab={(tab) => {
                    if (tab === 'diagnostics') setActiveTab('practice');
                    else setActiveTab(tab);
                  }}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                />
              )}

              {activeTab === 'skills' && (
                <MySkillsSection
                  pathways={pathways}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                  onStartDiagnostic={() => setActiveTab('practice')}
                />
              )}

              {activeTab === 'roadmap' && (
                <RoadmapSection
                  pathways={pathways}
                  onSelectSkill={(skill) => setSelectedSkill(skill)}
                  onStartDiagnostic={() => setActiveTab('practice')}
                />
              )}

              {activeTab === 'learning' && (
                <LearningSection
                  onStartDiagnostic={() => setActiveTab('practice')}
                />
              )}

              {activeTab === 'practice' && (
                <PracticeSection studentId={user?.id} />
              )}

              {activeTab === 'progress' && (
                <ProgressSection
                  onStartDiagnostic={() => setActiveTab('practice')}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileSection
                  user={user}
                  onUpdateProfile={(updates) => updateProfile(updates)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Interactive Skill Detail Modal */}
      <SkillDetailModal
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
        onStartPractice={() => setActiveTab('practice')}
      />
    </div>
  );
};
