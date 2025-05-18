import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { TestStackParamList } from '../navigation';
import { getTests, Test } from '../services/testService';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';

type TestListScreenNavigationProp = NativeStackNavigationProp<TestStackParamList, 'TestList'>;

const TestListScreen = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigation = useNavigation<TestListScreenNavigationProp>();
  
  useEffect(() => {
    loadTests();
  }, []);
  
  const loadTests = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      const testsData = await getTests();
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestSelect = (testId: number) => {
    navigation.navigate('Test', { testId });
  };
  
  const handleStartExamSimulation = () => {
    navigation.navigate('ExamSimulation');
  };
  
  const renderTestItem = ({ item }: { item: Test }) => {
    const questionCount = item.questions.length;
    
    return (
      <Card
        title={item.title}
        subtitle={item.description}
        onPress={() => handleTestSelect(item.id)}
        className="mx-4"
      >
        <View className="flex-row items-center justify-end mt-2">
          <View className="bg-blue-100 rounded-full px-3 py-1">
            <Text className="text-blue-800 font-medium">Бастау</Text>
          </View>
        </View>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <ScreenContainer className="bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Тесттер жүктелуде...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer className="bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-lg font-bold">ЕНТ тесттері</Text>
        <Text className="text-gray-600">Өзіңізді тексеру үшін тест таңдаңыз</Text>
        
        <TouchableOpacity
          className="mt-4 bg-blue-500 p-4 rounded-lg flex-row items-center justify-center"
          onPress={handleStartExamSimulation}
        >
          <MaterialIcons name="timer" size={24} color="white" />
          <Text className="text-white font-bold ml-2">Имитациялық емтихан бастау (120 минут)</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={tests}
        renderItem={renderTestItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          <View className="p-4 items-center">
            <Text className="text-gray-600">Тесттер табылмады</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

export default TestListScreen; 