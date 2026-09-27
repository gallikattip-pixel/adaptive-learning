import React from 'react';
import { Menu } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import type { StudentUser } from '@/types/auth';

export interface DashboardHeaderProps {
  title: string;
  user: StudentUser | null;
  onOpenMobileMenu: () => void;
  apiStatus: 'testing' | 'offline' | 'online';
  mlStatus: 'unconfigured' | 'loading' | 'active' | 'offline';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  user,
  onOpenMobileMenu,
  apiStatus,
  mlStatus,
}) => {
  const getMlLabel = () => {
    switch (mlStatus) {
      case 'active':
        return 'ML Pipeline: Connected';
      case 'loading':
        return 'ML Pipeline: Syncing';
      case 'offline':
        return 'ML Pipeline: Offline';
      default:
        return 'ML Pipeline: Ready';
    }
  };

  const getMlDotColor = () => {
    switch (mlStatus) {
      case 'active':
        return 'bg-yellow';
      case 'loading':
        return 'bg-amber-400 animate-pulse';
      case 'offline':
        return 'bg-red-400';
      default:
        return 'bg-muted';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-dark-green border-b border-deep-green/60 py-3.5 px-4 sm:px-6 lg:px-8 text-ivory flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-ivory/80 hover:text-ivory hover:bg-deep-green/60 focus:outline-none focus:ring-2 focus:ring-yellow"
          aria-label="Open mobile navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-ivory tracking-tight">{title}</h1>
          <p className="text-[11px] font-mono text-ivory/60">
            {user?.primaryGoal ? `Goal: ${user.primaryGoal}` : 'Autonomous Real-Time Mastery'}
          </p>
        </div>
      </div>

      {/* API Readiness Indicators & Student Profile Chip */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px]">
          <span
            className={`px-2.5 py-1 rounded bg-deep-green/60 border border-deep-green flex items-center gap-1.5 ${
              apiStatus === 'online' ? 'text-yellow' : 'text-ivory/70'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'online' ? 'bg-yellow' : 'bg-muted'
              }`}
            />
            REST API: {apiStatus === 'online' ? 'Live' : 'Standby'}
          </span>

          <span
            className={`px-2.5 py-1 rounded bg-deep-green/60 border border-deep-green flex items-center gap-1.5 ${
              mlStatus === 'active' ? 'text-yellow' : 'text-ivory/70'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getMlDotColor()}`} />
            {getMlLabel()}
          </span>
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-deep-green/60">
          <Badge variant="yellow" className="hidden xs:inline-flex text-[10px]">
            Student
          </Badge>
          <div className="w-8 h-8 rounded-full bg-deep-green border border-yellow/40 flex items-center justify-center font-bold text-yellow text-xs shadow-xs">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'S'}
          </div>
        </div>
      </div>
    </header>
  );
};
