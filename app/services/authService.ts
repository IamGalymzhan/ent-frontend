import AsyncStorage from '@react-native-async-storage/async-storage';
import users from '../assets/data/users.json';

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
    // Simulate API call with local data
    const user = users.find(
      (user) => user.username === username && user.password === password
    );

    if (user) {
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (userData: Omit<User, 'id' | 'testHistory'>): Promise<User | null> => {
  try {
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
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const updateUserTestHistory = async (testAttempt: TestAttempt): Promise<boolean> => {
  try {
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
  } catch (error) {
    console.error('Update test history error:', error);
    return false;
  }
}; 