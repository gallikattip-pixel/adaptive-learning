import React from 'react';
import { BrandLogo } from '@/components/common/BrandLogo';
import {
  LayoutDashboard,
  Target,
  GitBranch,
  BookOpen,
  BrainCircuit,
  TrendingUp,
  User,
  LogOut,
  X,
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'skills'
  | 'roadmap'
  | 'learning'
  | 'practice'
  | 'progress'
  | 'profile';

export interface StudentSidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'skills', label: 'My Skills', icon: Target },
  { id: 'roadmap', label: 'Roadmap', icon: GitBranch },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: BrainCircuit },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'profile', label: 'Profile', icon: User },
];

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) => {
  const renderNavList = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Student Sidebar Navigation">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelectTab(item.id);
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow ${
              isActive
                ? 'bg-deep-green text-yellow border-l-4 border-yellow shadow-xs font-bold'
                : 'text-ivory/80 hover:text-ivory hover:bg-deep-green/40 border-l-4 border-transparent'
            }`}
          >
            <IconComponent size={18} className={isActive ? 'text-yellow' : 'text-ivory/60'} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-dark-green border-r border-deep-green/60 text-ivory min-h-screen shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-deep-green/60">
          <BrandLogo />
          <div className="mt-2 text-[10px] font-mono text-ivory/60 tracking-wider uppercase">
            Student Portal Workspace
          </div>
        </div>

        {renderNavList()}

        {/* Footer Logout */}
        <div className="p-4 border-t border-deep-green/60">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-ivory/70 hover:text-ivory hover:bg-deep-green/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
          >
            <LogOut size={18} className="text-ivory/60" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-dark-green/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-dark-green border-r border-deep-green text-ivory z-10 shadow-2xl">
            <div className="p-4 border-b border-deep-green/60 flex items-center justify-between">
              <BrandLogo />
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-ivory/70 hover:text-ivory hover:bg-deep-green/60 focus:outline-none focus:ring-2 focus:ring-yellow"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {renderNavList()}

            <div className="p-4 border-t border-deep-green/60">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-ivory/70 hover:text-ivory hover:bg-deep-green/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
              >
                <LogOut size={18} className="text-ivory/60" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
