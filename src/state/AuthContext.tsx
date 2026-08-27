import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthContextValue = {
  token: string | null;
  hasToken: boolean;
  /** Stores the token in memory only - it is never written to storage. */
  setToken: (token: string) => void;
  clearToken: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the bearer token in React state for the lifetime of the tab. Nothing is
 * persisted to localStorage/sessionStorage, so a refresh requires re-entry.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = useCallback((next: string) => {
    const trimmed = next.trim();
    setTokenState(trimmed ? trimmed : null);
  }, []);

  const clearToken = useCallback(() => {
    setTokenState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, hasToken: Boolean(token), setToken, clearToken }),
    [token, setToken, clearToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
