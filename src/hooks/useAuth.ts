import { useState, useEffect, useCallback } from 'react';
import type { StudentUser, LoginCredentials, SignUpPayload } from '@/types/auth';
import { authService } from '@/services/auth/authService';

export function useAuth() {
  const [user, setUser] = useState<StudentUser | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setIsAuthenticated(Boolean(current));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      setIsAuthenticated(true);
      return loggedUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.signUp(payload);
      setUser(newUser);
      setIsAuthenticated(true);
      return newUser;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<StudentUser>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await authService.updateProfile(updates);
      setUser(updated);
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Profile update failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signUp,
    updateProfile,
    logout,
  };
}
