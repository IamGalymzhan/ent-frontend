import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authService from '../services/authService';
import { User } from '../services/authService';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'testHistory'>) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUserLoggedIn = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user logged in:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.login(username, password);
      
      if (user) {
        setUser(user);
        return true;
      } else {
        setError('Қолданушы аты немесе құпия сөз қате');
        return false;
      }
    } catch (error) {
      setError('Жүйеге кіру барысында қате орын алды');
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'testHistory'>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.register(userData);
      
      if (user) {
        setUser(user);
        return true;
      } else {
        setError('Бұл қолданушы аты бұрыннан тіркелген');
        return false;
      }
    } catch (error) {
      setError('Тіркелу барысында қате орын алды');
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const success = await authService.logout();
      if (success) {
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 