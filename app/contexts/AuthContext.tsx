import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authService from '../services/authService';
import { User } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_STORAGE_KEY, DEBUG_AUTH_TOKEN } from '../services/storageConstants';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'testHistory'>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserToken: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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
        
        // Ensure user has a token if logged in
        if (user && !user.token) {
          console.log('User found but missing token, adding debug token');
          user.token = DEBUG_AUTH_TOKEN;
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
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
        // Ensure user has a token
        if (!user.token) {
          console.log('Logged in user has no token, adding debug token');
          user.token = DEBUG_AUTH_TOKEN;
          // Update in storage
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
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
        // Ensure user has a token
        if (!user.token) {
          console.log('Registered user has no token, adding debug token');
          user.token = DEBUG_AUTH_TOKEN;
          // Update in storage
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
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
  
  // Function to update user token
  const updateUserToken = async (token: string): Promise<void> => {
    try {
      if (!user) {
        console.error('Cannot update token: No user is logged in');
        return;
      }
      
      // Update in memory
      const updatedUser = { ...user, token };
      setUser(updatedUser);
      
      // Update in storage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      console.log('User token updated successfully');
    } catch (error) {
      console.error('Error updating user token:', error);
    }
  };

  // Function to refresh user data from storage
  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (userData) {
        const updatedUser = JSON.parse(userData);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      updateUserToken,
      refreshUser
    }}>
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