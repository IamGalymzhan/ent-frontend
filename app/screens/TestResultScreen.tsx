import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { TestStackParamList } from '../navigation';
import { getTestById, Question } from '../services/testService';
import Button from '../components/Button';
import Card from '../components/Card';

type TestResultScreenRouteProp = RouteProp<TestStackParamList, 'TestResult'>;
type TestResultScreenNavigationProp = NativeStackNavigationProp<TestStackParamList, 'TestResult'>;

const TestResultScreen = () => {
  const route = useRoute<TestResultScreenRouteProp>();
  const navigation = useNavigation<TestResultScreenNavigationProp>();
  
  const { testId, score, answers } = route.params;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  
  useEffect(() => {
    const test = getTestById(testId);
    if (test) {
      setQuestions(test.questions);
    }
  }, [testId]);
  
  const totalQuestions = questions.length;
  const percentageScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  const getScoreColor = () => {
    if (percentageScore >= 80) return 'text-green-600';
    if (percentageScore >= 60) return 'text-blue-600';
    if (percentageScore >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreMessage = () => {
    if (percentageScore >= 80) return 'Өте жақсы!';
    if (percentageScore >= 60) return 'Жақсы!';
    if (percentageScore >= 40) return 'Орташа.';
    return 'Көбірек дайындалу керек.';
  };
  
  const handleTryAgain = () => {
    navigation.navigate('Test', { testId });
  };
  
  const handleGoToList = () => {
    navigation.navigate('TestList');
  };
  
  const toggleShowAnswers = () => {
    setShowAnswers(!showAnswers);
  };
  
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 rounded-b-3xl shadow-sm mb-4">
        <View className="items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Тест нәтижесі</Text>
          
          <View className="my-4 items-center">
            <View className="h-32 w-32 rounded-full bg-blue-100 items-center justify-center">
              <Text className={`text-4xl font-bold ${getScoreColor()}`}>
                {percentageScore}%
              </Text>
            </View>
            <Text className="mt-2 text-lg font-medium">
              {score} / {totalQuestions} дұрыс
            </Text>
            <Text className={`mt-1 text-lg font-medium ${getScoreColor()}`}>
              {getScoreMessage()}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between">
          <Button
            title="Қайта тапсыру"
            variant="outline"
            onPress={handleTryAgain}
            className="flex-1 mr-2"
          />
          <Button
            title="Тесттер тізімі"
            onPress={handleGoToList}
            className="flex-1 ml-2"
          />
        </View>
      </View>
      
      <Button
        title={showAnswers ? "Жауаптарды жасыру" : "Жауаптарды көрсету"}
        variant="secondary"
        onPress={toggleShowAnswers}
        className="mx-4 mb-4"
      />
      
      {showAnswers && (
        <View className="px-4 pb-6">
          <Text className="text-lg font-bold mb-4">Сұрақтар мен жауаптар</Text>
          
          {questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <Card key={index} className="mb-4">
                <Text className="text-lg font-medium mb-2">
                  {index + 1}. {question.text}
                </Text>
                
                {question.options.map((option, optionIndex) => (
                  <View 
                    key={optionIndex}
                    className={`flex-row items-center p-3 rounded-lg mb-2 ${
                      optionIndex === question.correctAnswer
                        ? 'bg-green-100'
                        : userAnswer === optionIndex && userAnswer !== question.correctAnswer
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text 
                      className={`flex-1 ${
                        optionIndex === question.correctAnswer
                          ? 'text-green-800'
                          : userAnswer === optionIndex && userAnswer !== question.correctAnswer
                          ? 'text-red-800'
                          : 'text-gray-800'
                      }`}
                    >
                      {option}
                    </Text>
                    
                    {optionIndex === question.correctAnswer && (
                      <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                    )}
                    
                    {userAnswer === optionIndex && userAnswer !== question.correctAnswer && (
                      <MaterialIcons name="cancel" size={24} color="#dc2626" />
                    )}
                  </View>
                ))}
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default TestResultScreen; 