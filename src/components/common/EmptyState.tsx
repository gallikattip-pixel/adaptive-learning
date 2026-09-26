import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  statusBadge?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  statusBadge = 'API Connected',
}) => {
  return (
    <Card className="flex flex-col items-center justify-center text-center py-16 px-6 border-dashed border-deep-green/30 bg-warm-ivory/60">
      <div className="w-12 h-12 rounded-full bg-deep-green border border-deep-green/80 flex items-center justify-center text-yellow font-mono text-xs font-bold mb-4 shadow-sm">
        00
      </div>

      {statusBadge && (
        <span className="inline-block px-2.5 py-0.5 mb-3 text-[10px] font-mono tracking-wider uppercase text-dark-text bg-ivory border border-deep-green/30 rounded">
          {statusBadge}
        </span>
      )}

      <h3 className="text-lg font-bold text-dark-text mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-md mb-6 leading-relaxed">{description}</p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
