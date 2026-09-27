/**
 * Helper utilities for formatting ML Gateway contract outputs into student-friendly labels.
 */

export function formatSkillName(raw: string): string {
  if (!raw) return 'Unknown Skill';
  return raw
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatStatusLabel(status: string): { label: string; variant: 'yellow' | 'deepGreen' | 'outline' } {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'MASTERED':
    case 'STRONG':
      return { label: 'Mastered', variant: 'deepGreen' };
    case 'DEVELOPING':
      return { label: 'Developing', variant: 'yellow' };
    case 'WEAK':
    case 'NOT_READY':
    case 'NOT_MASTERED':
      return { label: 'Needs Attention', variant: 'outline' };
    default:
      return { label: formatSkillName(status), variant: 'outline' };
  }
}

export function formatPriorityLabel(priority: string): { label: string; className: string } {
  const p = (priority || '').toUpperCase();
  switch (p) {
    case 'HIGH':
      return { label: 'High Priority', className: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'MEDIUM':
      return { label: 'Medium Priority', className: 'text-dark-green bg-warm-ivory border-deep-green/30' };
    case 'LOW':
      return { label: 'Low Priority', className: 'text-muted bg-ivory border-deep-green/20' };
    default:
      return { label: priority, className: 'text-muted bg-ivory border-deep-green/20' };
  }
}

export function formatActionLabel(action: string): string {
  if (!action) return 'Continue Study';
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
