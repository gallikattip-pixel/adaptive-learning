import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid student email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch {
      // Error is handled in hook or displayed via authError
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-ivory">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="yellow" className="px-3 py-0.5 text-[10px]">
            Student Authentication
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-dark-text">Sign in to Student Portal</h1>
          <p className="text-xs text-muted">Access your adaptive learning pathways and diagnostic assessments</p>
        </div>

        {/* Card Form */}
        <Card variant="default" className="p-6 sm:p-8 space-y-6 border-deep-green/30 bg-warm-ivory shadow-lg">
          {(formError || authError) && (
            <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-800/40 text-amber-900 text-xs flex items-start gap-2 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1 shrink-0" />
              <span>{formError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-deep-green/20 text-center text-xs text-muted">
            Don't have a student account?{' '}
            <Link to="/signup" className="text-dark-green font-bold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow rounded">
              Create Account
            </Link>
          </div>
        </Card>

        {/* System Notice */}
        <div className="text-center font-mono text-[11px] text-muted">
          STUDENT-ONLY PLATFORM • NO HUMAN INTERVENTION REQUIRED
        </div>
      </div>
    </div>
  );
};
