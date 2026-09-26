import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading, error: authError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim()) {
      setFormError('Please enter your first name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid student email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        primaryGoal: primaryGoal.trim() || undefined,
      });
      navigate('/dashboard');
    } catch {
      // Error managed in hook
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-ivory">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="yellow" className="px-3 py-0.5 text-[10px]">
            New Student Registration
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-dark-text">Create Student Account</h1>
          <p className="text-xs text-muted">Initialize your autonomous adaptive learning workspace</p>
        </div>

        {/* Card Form */}
        <Card variant="default" className="p-6 sm:p-8 space-y-5 border-deep-green/30 bg-warm-ivory shadow-lg">
          {(formError || authError) && (
            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-800/40 text-amber-900 text-xs flex items-start gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1 shrink-0" />
              <span>{formError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                placeholder="Student"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Student Email Address"
              type="email"
              placeholder="student@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Input
              label="Primary Target Learning Domain (Optional)"
              placeholder="e.g. Computer Science, Linear Algebra, Systems"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              hint="Helps scope initial diagnostic placement endpoints."
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Register Student Account
            </Button>
          </form>

          <div className="pt-4 border-t border-deep-green/20 text-center text-xs text-muted">
            Already registered?{' '}
            <Link to="/login" className="text-dark-green font-bold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow rounded">
              Sign In
            </Link>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="text-center font-mono text-[11px] text-muted">
          SECURE CLIENT ISOLATION • API GATEWAY READY
        </div>
      </div>
    </div>
  );
};
