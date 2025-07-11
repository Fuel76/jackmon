import React, { createContext, useContext, useEffect, useState } from 'react';
import { signIn as authSignIn, signOut as authSignOut, getUser } from '../lib/auth';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('session');
    if (sessionData) {
      const { token } = JSON.parse(sessionData);
      getUser(token)
        .then((user) => setUser(user))
        .catch(() => localStorage.removeItem('session'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { user, token } = await authSignIn(email, password);
      setUser(user);
      localStorage.setItem('session', JSON.stringify({ token }));
    } catch (error) {
      console.error('Ошибка при входе:', error);
      throw new Error('Не удалось войти. Проверьте email и пароль.');
    }
  };

  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      localStorage.removeItem('session');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      throw new Error('Не удалось выйти.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}