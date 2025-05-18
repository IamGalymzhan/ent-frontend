import AsyncStorage from '@react-native-async-storage/async-storage';
import testsData from '../assets/data/tests.json';
import { apiCall, API_ENDPOINTS, getApiConfig } from './api';

// Types
export interface Test {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface TestResult {
  testId: number;
  score: number;
  answers: number[];
  date: string;
}

// Key constants
const TEST_RESULTS_KEY = 'ent_test_results';

// Service methods
export const getTests = async (): Promise<Test[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      return await apiCall<Test[]>(API_ENDPOINTS.TESTS.GET_ALL, {
        method: 'GET'
      });
    } else {
      // Add safety check for testsData
      if (!testsData || !Array.isArray(testsData)) {
        console.error('testsData is undefined or not an array');
        return [];
      }
      return testsData;
    }
  } catch (error) {
    console.error('Get tests error:', error);
    // Fallback to local data if API fails, with safety check
    if (!testsData || !Array.isArray(testsData)) {
      console.error('testsData is undefined or not an array in error fallback');
      return [];
    }
    return testsData;
  }
};

export const getTestById = async (id: number): Promise<Test | undefined> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      return await apiCall<Test>(API_ENDPOINTS.TESTS.GET_BY_ID(id), {
        method: 'GET'
      });
    } else {
      // Add safety check for testsData
      if (!testsData || !Array.isArray(testsData)) {
        console.error('testsData is undefined or not an array');
        return undefined;
      }
      return testsData.find((test) => test.id === id);
    }
  } catch (error) {
    console.error(`Get test by ID (${id}) error:`, error);
    // Fallback to local data if API fails, with safety check
    if (!testsData || !Array.isArray(testsData)) {
      console.error('testsData is undefined or not an array in error fallback');
      return undefined;
    }
    return testsData.find((test) => test.id === id);
  }
};

export const saveTestResult = async (result: TestResult): Promise<boolean> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      await apiCall(API_ENDPOINTS.TESTS.SAVE_RESULT, {
        method: 'POST',
        body: JSON.stringify(result)
      });
      
      // Also update local storage for offline access
      const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
      const results: TestResult[] = resultsJSON ? JSON.parse(resultsJSON) : [];
      results.push(result);
      await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
      
      return true;
    } else {
      // Get existing results
      const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
      const results: TestResult[] = resultsJSON ? JSON.parse(resultsJSON) : [];
      
      // Add new result
      results.push(result);
      
      // Save updated results
      await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
      return true;
    }
  } catch (error) {
    console.error('Save test result error:', error);
    return false;
  }
};

export const getTestResults = async (): Promise<TestResult[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      return await apiCall<TestResult[]>(API_ENDPOINTS.TESTS.GET_RESULTS, {
        method: 'GET'
      });
    } else {
      const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
      return resultsJSON ? JSON.parse(resultsJSON) : [];
    }
  } catch (error) {
    console.error('Get test results error:', error);
    // Fallback to local storage if API fails
    const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
    return resultsJSON ? JSON.parse(resultsJSON) : [];
  }
};

export const getTestResultsByTestId = async (testId: number): Promise<TestResult[]> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      return await apiCall<TestResult[]>(API_ENDPOINTS.TESTS.GET_RESULTS_BY_TEST(testId), {
        method: 'GET'
      });
    } else {
      const results = await getTestResults();
      return results.filter((result) => result.testId === testId);
    }
  } catch (error) {
    console.error('Get test results by test ID error:', error);
    // Fallback to local filter if API fails
    const results = await getTestResults();
    return results.filter((result) => result.testId === testId);
  }
};

export const analyzePerformance = async (testIds?: number[]): Promise<{
  totalTests: number;
  averageScore: number;
  weakestAreas: { testId: number; title: string; averageScore: number }[];
}> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.tests.useBackend) {
      // Use real backend API
      const params = testIds ? `?testIds=${testIds.join(',')}` : '';
      return await apiCall(API_ENDPOINTS.TESTS.ANALYZE_PERFORMANCE + params, {
        method: 'GET'
      });
    } else {
      const results = await getTestResults();
      
      // Filter by test IDs if provided
      const filteredResults = testIds 
        ? results.filter((result) => testIds.includes(result.testId))
        : results;
      
      if (filteredResults.length === 0) {
        return {
          totalTests: 0,
          averageScore: 0,
          weakestAreas: []
        };
      }
      
      // Calculate total tests and average score
      const totalTests = filteredResults.length;
      const totalScore = filteredResults.reduce((sum, result) => sum + result.score, 0);
      const averageScore = totalScore / totalTests;
      
      // Calculate performance by test
      const tests = await getTests();
      const testPerformance = tests.map((test) => {
        const testResults = filteredResults.filter((result) => result.testId === test.id);
        
        if (testResults.length === 0) {
          return {
            testId: test.id,
            title: test.title,
            averageScore: 0,
            attempts: 0
          };
        }
        
        const testTotalScore = testResults.reduce((sum, result) => sum + result.score, 0);
        const testAverageScore = testTotalScore / testResults.length;
        
        return {
          testId: test.id,
          title: test.title,
          averageScore: testAverageScore,
          attempts: testResults.length
        };
      });
      
      // Filter out tests with no attempts
      const attemptedTests = testPerformance.filter((performance) => performance.attempts > 0);
      
      // Sort by average score (ascending) to find weakest areas
      const weakestAreas = [...attemptedTests]
        .sort((a, b) => a.averageScore - b.averageScore)
        .slice(0, 3)
        .map(({ testId, title, averageScore }) => ({ testId, title, averageScore }));
      
      return {
        totalTests,
        averageScore,
        weakestAreas
      };
    }
  } catch (error) {
    console.error('Analyze performance error:', error);
    return {
      totalTests: 0,
      averageScore: 0,
      weakestAreas: []
    };
  }
}; 