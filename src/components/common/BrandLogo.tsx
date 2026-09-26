import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
}

/**
 * Replaceable Single-Source Brand Logo Component.
 * Swap out the simple neutral placeholder mark below when the final logo asset is provided.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Simple neutral placeholder mark using design tokens */}
      <div className="w-8 h-8 rounded-lg bg-deep-green border border-yellow/30 flex items-center justify-center text-yellow font-mono text-xs font-bold shrink-0 shadow-sm">
        AL
      </div>
      {showText && (
        <span className="font-bold text-ivory text-base tracking-tight">
          Adaptive Learning
        </span>
      )}
    </div>
  );
};
