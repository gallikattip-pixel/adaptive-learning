import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-deep-green/40 bg-dark-green/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow rounded-md p-1"
          aria-label="Adaptive Learning Home"
        >
          <BrandLogo />
        </Link>

        {/* Desktop Navigation Links */}
        {isLandingPage && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ivory/80" aria-label="Main Navigation">
            <a href="#adaptive-model" className="hover:text-yellow transition-colors">
              Adaptive Architecture
            </a>
            <a href="#prerequisites" className="hover:text-yellow transition-colors">
              Prerequisite Graph
            </a>
            <a href="#personalization" className="hover:text-yellow transition-colors">
              Personalization
            </a>
            <a href="#ml-integration" className="hover:text-yellow transition-colors">
              ML Gateway Specs
            </a>
          </nav>
        )}

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-xs text-ivory/70 font-mono mr-1">
                Student: <span className="text-ivory font-sans font-medium">{user?.firstName}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
                Student Portal
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Create Account
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-ivory/80 hover:text-ivory hover:bg-deep-green/60 focus:outline-none focus:ring-2 focus:ring-yellow"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-deep-green bg-dark-green px-4 pt-3 pb-6 space-y-4">
          {isLandingPage && (
            <div className="flex flex-col gap-3 text-sm font-medium text-ivory/80">
              <a href="#adaptive-model" onClick={() => setMobileMenuOpen(false)} className="hover:text-yellow">
                Adaptive Architecture
              </a>
              <a href="#prerequisites" onClick={() => setMobileMenuOpen(false)} className="hover:text-yellow">
                Prerequisite Graph
              </a>
              <a href="#personalization" onClick={() => setMobileMenuOpen(false)} className="hover:text-yellow">
                Personalization
              </a>
              <a href="#ml-integration" onClick={() => setMobileMenuOpen(false)} className="hover:text-yellow">
                ML Gateway Specs
              </a>
            </div>
          )}
          <div className="pt-2 border-t border-deep-green flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="secondary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
                  Student Portal
                </Button>
                <Button variant="outline" size="md" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                  Sign In
                </Button>
                <Button variant="primary" size="md" onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}>
                  Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
