import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import { isGlobalAppAdminEmail } from '@/domain/family-access';
import {
  getFirebaseErrorMessage,
  loginWithEmail,
  loadUserAccountStatus,
  logout,
  observeAuth,
  registerWithEmail,
  resolveFamilyAccess,
  type FamilyAccess,
} from '@/services/firebase';

type AuthStatus = 'loading' | 'signed-out' | 'resolving-family' | 'ready' | 'admin' | 'blocked' | 'no-family' | 'error';

type AuthContextValue = {
  user: User | null;
  access: FamilyAccess | null;
  status: AuthStatus;
  error: string;
  submitting: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshAccess: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<FamilyAccess | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAccess = useCallback(async (nextUser: User) => {
    if (isGlobalAppAdminEmail(nextUser.email)) {
      setAccess(null);
      setError('');
      setStatus('admin');
      return;
    }
    setStatus('resolving-family');
    setError('');
    try {
      const accountStatus = await loadUserAccountStatus(nextUser);
      if (['blocked', 'suspended', 'disabled'].includes(accountStatus)) {
        setAccess(null);
        setStatus('blocked');
        return;
      }
      const nextAccess = await resolveFamilyAccess(nextUser);
      setAccess(nextAccess);
      setStatus(nextAccess ? 'ready' : 'no-family');
    } catch (loadError) {
      setAccess(null);
      setError(getFirebaseErrorMessage(loadError));
      setStatus('error');
    }
  }, []);

  useEffect(() => observeAuth((nextUser) => {
    setUser(nextUser);
    setAccess(null);
    setError('');
    if (!nextUser) {
      setStatus('signed-out');
      return;
    }
    void loadAccess(nextUser);
  }), [loadAccess]);

  const login = useCallback(async (email: string, password: string) => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      return true;
    } catch (loginError) {
      setStatus('signed-out');
      setError(getFirebaseErrorMessage(loginError));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError('');
    setSubmitting(true);
    try {
      await registerWithEmail(email, password);
      return true;
    } catch (registerError) {
      setStatus('signed-out');
      setError(getFirebaseErrorMessage(registerError));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError('');
    await logout();
  }, []);

  const refreshAccess = useCallback(async () => {
    if (user) await loadAccess(user);
  }, [loadAccess, user]);

  const value = useMemo(() => ({ user, access, status, error, submitting, login, register, signOut, refreshAccess }), [user, access, status, error, submitting, login, register, signOut, refreshAccess]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useNinouAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useNinouAuth deve ser usado dentro de AuthProvider');
  return context;
}
