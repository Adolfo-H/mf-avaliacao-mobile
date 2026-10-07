import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  AuthUser,
  login,
  logout,
  restoreSession,
} from '@/services/auth';

type AuthContextData = {
  user: AuthUser | null;
  loading: boolean;
  sessionError: string | null;
  retrySession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [
    sessionError,
    setSessionError,
  ] = useState<string | null>(null);

  const loadSession = useCallback(
    async () => {
      try {
        setLoading(true);
        setSessionError(null);

        const restoredUser =
          await restoreSession();

        setUser(restoredUser);
      } catch {
        setSessionError(
          'Não foi possível validar sua sessão. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  async function retrySession() {
    await loadSession();
  }

  async function signIn(email: string, password: string) {
    const authenticatedUser = await login(email, password);

    setSessionError(null);
    setUser(authenticatedUser);
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      setSessionError(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionError,
        retrySession,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth precisa ser utilizado dentro de AuthProvider.'
    );
  }

  return context;
}