import AsyncStorage from '@react-native-async-storage/async-storage';
import users from '../assets/data/users.json';
import { apiCall, API_ENDPOINTS, getApiConfig } from './api';

// Types
export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  testHistory: TestAttempt[];
}

export interface TestAttempt {
  testId: number;
  date: string;
  score: number;
  totalQuestions: number;
}

// Key constants
const USER_STORAGE_KEY = 'ent_user';

// Service methods
export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('Login attempt for user:', username);
    
    // Check if we should use the real backend
    const config = await getApiConfig();
    console.log('API config for auth:', config.auth);
    
    if (config.auth.useBackend) {
      console.log('Using backend for login...');
      // Use real backend API
      try {
        const user = await apiCall<User>(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        
        console.log('Login successful with backend');
        // Store user in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
      } catch (apiError) {
        console.error('Backend login error:', apiError);
        return null;
      }
    } else {
      console.log('Using local simulation for login...');
      // Simulate API call with local data
      const user = users.find(
        (user) => user.username === username && user.password === password
      );

      if (user) {
        console.log('Login successful with local data');
        // Store user in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
      }
      console.log('Invalid credentials in local data');
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (userData: Omit<User, 'id' | 'testHistory'>): Promise<User | null> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      // Use real backend API
      const newUser = await apiCall<User>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    } else {
      // In a real app, this would be an API call
      // For now, we'll just check if username exists in our mock data
      const userExists = users.some((user) => user.username === userData.username);
      
      if (userExists) {
        return null; // User already exists
      }
      
      // Create new user
      const newUser: User = {
        id: users.length + 1,
        ...userData,
        testHistory: []
      };
      
      // In a real app, we would make an API call to save the user
      // For now, just save to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      
      return newUser;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      try {
        // Use real backend API with a catch to handle network errors
        await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST'
        });
      } catch (error) {
        console.warn('Could not connect to backend for logout, continuing with local logout');
        // Continue with local logout even if API call fails
      }
    }
    
    // Always remove from local storage
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Try to remove from local storage even if there was an error
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      try {
        // Try to get from backend first
        const user = await apiCall<User>(API_ENDPOINTS.AUTH.CURRENT_USER, {
          method: 'GET'
        });
        return user;
      } catch (apiError) {
        // Fallback to local storage if API fails
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
      }
    } else {
      // Use local storage
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    }
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const updateUserTestHistory = async (testAttempt: TestAttempt): Promise<boolean> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      // Use real backend API
      await apiCall(API_ENDPOINTS.AUTH.UPDATE_TEST_HISTORY, {
        method: 'POST',
        body: JSON.stringify(testAttempt)
      });
      
      // Update local user data for offline access
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          testHistory: [...currentUser.testHistory, testAttempt],
        };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      
      return true;
    } else {
      // Simulate with local storage only
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        return false;
      }
      
      const updatedUser = {
        ...currentUser,
        testHistory: [...currentUser.testHistory, testAttempt],
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return true;
    }
  } catch (error) {
    console.error('Update test history error:', error);
    return false;
  }
}; 