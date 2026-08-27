import {
  createContext,
  ReactNode,
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

  useEffect(() => {
    async function loadSession() {
      try {
        const restoredUser = await restoreSession();
        setUser(restoredUser);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function signIn(email: string, password: string) {
    const authenticatedUser = await login(email, password);

    setUser(authenticatedUser);
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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