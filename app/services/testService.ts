import AsyncStorage from '@react-native-async-storage/async-storage';
import testsData from '../assets/data/tests.json';

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
export const getTests = (): Test[] => {
  // In a real app, this would be an API call
  return testsData;
};

export const getTestById = (id: number): Test | undefined => {
  return testsData.find((test) => test.id === id);
};

export const saveTestResult = async (result: TestResult): Promise<boolean> => {
  try {
    // Get existing results
    const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
    const results: TestResult[] = resultsJSON ? JSON.parse(resultsJSON) : [];
    
    // Add new result
    results.push(result);
    
    // Save updated results
    await AsyncStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(results));
    return true;
  } catch (error) {
    console.error('Save test result error:', error);
    return false;
  }
};

export const getTestResults = async (): Promise<TestResult[]> => {
  try {
    const resultsJSON = await AsyncStorage.getItem(TEST_RESULTS_KEY);
    return resultsJSON ? JSON.parse(resultsJSON) : [];
  } catch (error) {
    console.error('Get test results error:', error);
    return [];
  }
};

export const getTestResultsByTestId = async (testId: number): Promise<TestResult[]> => {
  try {
    const results = await getTestResults();
    return results.filter((result) => result.testId === testId);
  } catch (error) {
    console.error('Get test results by test ID error:', error);
    return [];
  }
};

export const analyzePerformance = async (testIds?: number[]): Promise<{
  totalTests: number;
  averageScore: number;
  weakestAreas: { testId: number; title: string; averageScore: number }[];
}> => {
  try {
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
    const testPerformance = testsData.map((test) => {
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
  } catch (error) {
    console.error('Analyze performance error:', error);
    return {
      totalTests: 0,
      averageScore: 0,
      weakestAreas: []
    };
  }
}; 