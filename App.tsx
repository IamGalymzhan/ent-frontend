import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './app/contexts/AuthContext';
import AppNavigator from './app/navigation';
import { initializeApiConfig, setApiServiceConfig } from './app/services/api';

import './global.css';

export default function App() {
  useEffect(() => {
    const setupApi = async () => {
      try {
        // Force auth.useBackend to true - TEMPORARY FIX
        await setApiServiceConfig('auth', true);
        console.log('Forced auth.useBackend to true');
        
        // Initialize API configuration
        await initializeApiConfig();
      } catch (error) {
        console.error('Failed to initialize API config:', error);
      }
    };
    
    setupApi();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
