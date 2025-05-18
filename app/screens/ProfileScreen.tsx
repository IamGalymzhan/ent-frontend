import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { getTests, analyzePerformance } from '../services/testService';
import Button from '../components/Button';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [performance, setPerformance] = useState<{
    totalTests: number;
    averageScore: number;
    weakestAreas: { testId: number; title: string; averageScore: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadPerformance();
  }, [user]);
  
  const loadPerformance = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const performanceData = await analyzePerformance();
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Шығу',
      'Сіз шынымен шыққыңыз келе ме?',
      [
        { text: 'Жоқ', style: 'cancel' },
        { 
          text: 'Иә', 
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };
  
  if (!user) {
    return (
      <ScreenContainer className="bg-white p-4">
        <View className="flex-1 justify-center items-center">
          <MaterialIcons name="person-off" size={48} color="#64748b" />
          <Text className="text-xl font-bold mt-4 text-center">
            Профильді көру үшін жүйеге кіріңіз
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            Тест тарихыңызды көру және жетістіктеріңізді қадағалау үшін жүйеге кіріңіз.
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  const testHistory = user.testHistory.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('kk-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <ScreenContainer scroll className="bg-gray-50">
      <View className="bg-blue-600 p-6 pt-10 rounded-b-3xl">
        <View className="items-center mb-4">
          <View className="h-24 w-24 rounded-full bg-white items-center justify-center mb-3">
            <MaterialIcons name="person" size={60} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-white">{user.fullName}</Text>
          <Text className="text-white opacity-80">{user.email}</Text>
        </View>
      </View>
      
      <View className="px-4 py-6">
        <Text className="text-xl font-bold mb-4">Жалпы статистика</Text>
        
        <View className="flex-row justify-between mb-4">
          <Card className="flex-1 mr-2">
            <View className="items-center">
              <Text className="text-gray-600 mb-1">Тест саны</Text>
              <Text className="text-2xl font-bold text-blue-600">{testHistory.length}</Text>
            </View>
          </Card>
          
          <Card className="flex-1 ml-2">
            <View className="items-center">
              <Text className="text-gray-600 mb-1">Орташа балл</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {performance ? `${(performance.averageScore * 100).toFixed(1)}%` : '-'}
              </Text>
            </View>
          </Card>
        </View>
        
        {performance && performance.weakestAreas.length > 0 && (
          <Card className="mb-4">
            <Text className="font-bold mb-2">Жақсартуды қажет ететін пәндер</Text>
            {performance.weakestAreas.map((area, index) => (
              <View key={index} className="flex-row items-center mb-1">
                <MaterialIcons name="priority-high" size={18} color="#dc2626" />
                <Text className="text-gray-700 ml-2">
                  {area.title}: {(area.averageScore * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </Card>
        )}
        
        <Text className="text-xl font-bold mb-4 mt-2">Тест тарихы</Text>
        
        {testHistory.length > 0 ? (
          testHistory.map((test, index) => {
            const tests = getTests();
            const testInfo = tests.find(t => t.id === test.testId);
            
            return (
              <Card key={index} className="mb-3">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold">{testInfo?.title || `Тест ${test.testId}`}</Text>
                  <Text className={`font-bold ${getScoreColor(test.score, test.totalQuestions)}`}>
                    {test.score}/{test.totalQuestions}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm mt-1">{formatDate(test.date)}</Text>
              </Card>
            );
          })
        ) : (
          <View className="items-center py-6">
            <MaterialIcons name="history" size={48} color="#64748b" />
            <Text className="text-gray-500 mt-2">Тест тарихы бос</Text>
          </View>
        )}
        
        <Button
          title="Шығу"
          variant="danger"
          onPress={handleLogout}
          className="mt-6"
        />
      </View>
    </ScreenContainer>
  );
};

export default ProfileScreen; 