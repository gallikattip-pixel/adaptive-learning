import React, { useState } from 'react';
import type { StudentUser } from '@/types/auth';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { User, Info } from 'lucide-react';

export interface ProfileSectionProps {
  user: StudentUser | null;
  onUpdateProfile: (updates: Partial<StudentUser>) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onUpdateProfile }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [primaryGoal, setPrimaryGoal] = useState(user?.primaryGoal || '');

  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;

    onUpdateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      primaryGoal: primaryGoal.trim() || undefined,
    });

    setSavedNotice('Local session profile updated. Real database synchronization requires a connected backend user management endpoint.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Student Settings</Badge>
            <span className="font-mono text-xs text-muted">ID: {user?.id}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">Student Profile & Goal Settings</h2>
          <p className="text-xs text-muted mt-1">
            Manage your account preferences, primary domain learning goal, and diagnostic configurations.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-8 bg-warm-ivory border-deep-green/30 space-y-6">
        {/* Persistence Notice */}
        <div className="p-3.5 rounded-lg bg-ivory text-dark-text text-xs border border-deep-green/30 flex items-start gap-2.5">
          <Info size={16} className="text-dark-green shrink-0 mt-0.5" />
          <p className="leading-relaxed text-muted">
            <strong className="text-dark-text">Backend Persistence Notice:</strong> Profile updates currently modify local session state. Permanent database persistence requires connection to the backend user management API.
          </p>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-lg bg-dark-green text-ivory text-xs font-semibold flex items-center gap-2 border border-deep-green font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
            <span>{savedNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-deep-green/20">
            <div className="w-14 h-14 rounded-full bg-dark-green text-yellow font-extrabold text-xl flex items-center justify-center border border-deep-green">
              {firstName ? firstName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h3 className="font-bold text-dark-text text-base">
                {firstName} {lastName}
              </h3>
              <p className="text-xs text-muted font-mono">{email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            label="Student Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Primary Target Learning Goal / Domain"
            placeholder="e.g. Computer Science, Linear Algebra, Systems"
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            hint="Used to scope prerequisite pathway and diagnostic placement generation."
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md">
              <User size={16} />
              <span>Update Local Session Profile</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
