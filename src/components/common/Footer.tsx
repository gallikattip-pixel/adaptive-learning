import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-deep-green/60 bg-dark-green py-12 text-ivory/70 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <BrandLogo />
            <p className="text-ivory/80 text-xs leading-relaxed max-w-md pt-1">
              A student-dedicated real-time mastery platform. Built on prerequisite graph evaluation, automated skill-gap remediation, and dynamic difficulty optimization.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-deep-green/40 border border-deep-green font-mono text-[11px] text-ivory/90">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow"></span>
              <span>REST & ML Microservice API Gateway Architecture</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-ivory text-xs uppercase tracking-wider">Student Platform</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/login" className="hover:text-yellow transition-colors">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-yellow transition-colors">
                  Create Student Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-yellow transition-colors">
                  Student Portal Foundation
                </Link>
              </li>
            </ul>
          </div>

          {/* System Specs */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-ivory text-xs uppercase tracking-wider">Architecture & Specs</h4>
            <ul className="space-y-1.5 text-ivory/70">
              <li>Knowledge Dependency Graphs</li>
              <li>Adaptive Difficulty Item Analysis</li>
              <li>Skill-Gap Remediation Loops</li>
              <li>Zero Dummy Data Enforcement</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-deep-green/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-ivory/60 text-[11px]">
          <p>© {new Date().getFullYear()} Adaptive Learning. All rights reserved. Autonomous Student Mastery Platform.</p>
          <div className="flex items-center gap-6">
            <span>Student-Only Architecture</span>
            <span>No Hardcoded Credentials</span>
            <span>API Integration Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
