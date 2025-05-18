/**
 * API Configuration and Endpoints
 * 
 * This file defines all API endpoints used in the application and provides
 * a mechanism to toggle between local simulation and actual backend calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Constants
export const API_BASE_URL = 'https://ent-backend-yllb.onrender.com';
export const API_TIMEOUT = 10000; // 10 seconds timeout

// Storage Key for API Mode
export const API_MODE_KEY = 'ent_api_mode';

// API Services Toggle
export interface ApiServiceConfig {
  useBackend: boolean;
}

export interface ApiConfig {
  auth: ApiServiceConfig;
  tests: ApiServiceConfig;
  aiHelper: ApiServiceConfig;
}

// Default config (all simulated)
const DEFAULT_API_CONFIG: ApiConfig = {
  auth: { useBackend: true },
  tests: { useBackend: false },
  aiHelper: { useBackend: false }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    CURRENT_USER: '/auth/current-user',
    UPDATE_TEST_HISTORY: '/auth/test-history'
  },
  
  // Test endpoints
  TESTS: {
    GET_ALL: '/tests',
    GET_BY_ID: (id: number) => `/tests/${id}`,
    SAVE_RESULT: '/tests/results',
    GET_RESULTS: '/tests/results',
    GET_RESULTS_BY_TEST: (testId: number) => `/tests/${testId}/results`,
    ANALYZE_PERFORMANCE: '/tests/performance'
  },
  
  // AI Helper endpoints
  AI_HELPER: {
    GENERATE_FEEDBACK: '/ai/feedback'
  }
};

// Initialize API configuration on app startup
export const initializeApiConfig = async (): Promise<void> => {
  try {
    const existingConfig = await AsyncStorage.getItem(API_MODE_KEY);
    
    if (!existingConfig) {
      // No config exists yet, set the default config
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
      console.log('API config initialized with defaults');
    } else {
      // Config exists, but ensure auth.useBackend is true
      const parsedConfig = JSON.parse(existingConfig);
      
      // Check if auth.useBackend is false and update it
      if (!parsedConfig.auth?.useBackend) {
        parsedConfig.auth = { 
          ...parsedConfig.auth,
          useBackend: true 
        };
        
        // Save the updated config
        await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(parsedConfig));
        console.log('API config updated: auth.useBackend set to true');
      } else {
        console.log('API config already exists with auth.useBackend=true');
      }
    }
  } catch (error) {
    console.error('Error initializing API config:', error);
    // Attempt to set default config as fallback
    try {
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
    } catch (secondError) {
      console.error('Failed to set default API config:', secondError);
    }
  }
};

// Get current API configuration
export const getApiConfig = async (): Promise<ApiConfig> => {
  try {
    const config = await AsyncStorage.getItem(API_MODE_KEY);
    if (!config) {
      console.log('No API config found, initializing with defaults');
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
      return DEFAULT_API_CONFIG;
    }
    
    const parsedConfig = JSON.parse(config);
    console.log('Retrieved API config:', parsedConfig);
    return parsedConfig;
  } catch (error) {
    console.error('Error loading API config:', error);
    return DEFAULT_API_CONFIG;
  }
};

// Set API configuration for a specific service
export const setApiServiceConfig = async (
  service: keyof ApiConfig,
  useBackend: boolean
): Promise<boolean> => {
  try {
    const currentConfig = await getApiConfig();
    const newConfig = {
      ...currentConfig,
      [service]: { useBackend }
    };
    
    await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(newConfig));
    console.log(`API config updated for ${service}:`, { useBackend });
    return true;
  } catch (error) {
    console.error(`Error setting API config for ${service}:`, error);
    return false;
  }
};

// Set full API configuration
export const setApiConfig = async (config: ApiConfig): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(config));
    console.log('Full API config updated:', config);
    return true;
  } catch (error) {
    console.error('Error setting API config:', error);
    return false;
  }
};

// Helper function to make API calls with proper error handling
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('API Call:', url, 'Method:', options.method || 'GET', 'Timeout:', API_TIMEOUT, 'ms');
    
    // Set default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Request to ${endpoint} timed out after ${API_TIMEOUT}ms`);
    }, API_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId); // Ensure timeout is cleared even if fetch fails
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`API request timed out after ${API_TIMEOUT}ms`);
        throw new Error(`Request timed out after ${API_TIMEOUT/1000} seconds. The server might be overloaded or temporarily unavailable.`);
      }
      
      console.error('API call error:', error.message);
    } else {
      console.error('Unknown API call error');
    }
    throw error;
  }
}; 