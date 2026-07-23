'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  loginCandidate,
  getCurrentUser,
  refreshSession,
  logoutCandidate,
  verifyMfaChallenge,
  isMfaChallenge,
} from '@/lib/api-client';
import type {
  LoginCandidatePayload,
  AuthenticatedUserData,
  LoginMfaChallengeResult,
  VerifyMfaChallengePayload,
} from '@/lib/api-client';
import { candidateLoginSchema } from '@nexthire/validation';

interface AuthState {
  status: 'unknown' | 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthenticatedUserData | null;
  accessToken: string | null;
}

export type LoginOutcome = { mfaRequired: false } | LoginMfaChallengeResult;

interface AuthContextValue extends AuthState {
  login: (payload: LoginCandidatePayload) => Promise<LoginOutcome>;
  completeMfaChallenge: (payload: VerifyMfaChallengePayload) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'unknown',
    user: null,
    accessToken: null,
  });
  const accessTokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    if (token) {
      try {
        sessionStorage.setItem('nexthire_at', token);
      } catch {
        // sessionStorage may be unavailable
      }
    } else {
      try {
        sessionStorage.removeItem('nexthire_at');
      } catch {
        // ignore
      }
    }
  }, []);

  const getAccessToken = useCallback(() => {
    return accessTokenRef.current;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const result = await refreshSession();
      const token = result.accessToken;
      setAccessToken(token);

      const user = await getCurrentUser(token);
      setState({
        status: 'authenticated',
        user,
        accessToken: token,
      });
    } catch {
      setAccessToken(null);
      setState({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
      });
    }
  }, [setAccessToken]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await bootstrap();
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [bootstrap]);

  const login = useCallback(
    async (payload: LoginCandidatePayload): Promise<LoginOutcome> => {
      const validation = candidateLoginSchema.safeParse(payload);
      if (!validation.success) {
        const err = validation.error.flatten().fieldErrors;
        throw new Error(err.email?.[0] ?? err.password?.[0] ?? 'Validation failed');
      }

      setState((prev) => ({ ...prev, status: 'loading' }));

      let result;
      try {
        result = await loginCandidate(payload);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: prev.user ? 'authenticated' : 'unauthenticated',
        }));
        throw error;
      }

      if (isMfaChallenge(result)) {
        setState((prev) => ({
          ...prev,
          status: prev.user ? 'authenticated' : 'unauthenticated',
        }));
        return result;
      }

      setAccessToken(result.accessToken);
      setState({
        status: 'authenticated',
        user: result.user,
        accessToken: result.accessToken,
      });
      return { mfaRequired: false };
    },
    [setAccessToken],
  );

  const completeMfaChallenge = useCallback(
    async (payload: VerifyMfaChallengePayload) => {
      const result = await verifyMfaChallenge(payload);
      setAccessToken(result.accessToken);
      setState({
        status: 'authenticated',
        user: result.user,
        accessToken: result.accessToken,
      });
    },
    [setAccessToken],
  );

  const logout = useCallback(async () => {
    const token = accessTokenRef.current;
    if (token) {
      try {
        await logoutCandidate(token);
      } catch {
        // Logout best-effort; clear local state regardless
      }
    }
    setAccessToken(null);
    setState({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
    });
  }, [setAccessToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, completeMfaChallenge, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
