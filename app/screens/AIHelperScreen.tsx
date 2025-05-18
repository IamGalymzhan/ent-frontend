import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { getTests } from '../services/testService';
import { generateAIFeedback, AIFeedback } from '../services/aiHelperService';
import Card from '../components/Card';
import ScreenContainer from '../components/ScreenContainer';

const AIHelperScreen = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFeedback();
  }, [user]);
  
  const loadFeedback = async () => {
    setLoading(true);
    try {
      if (!user) {
        setFeedback({
          overview: 'Кеңес алу үшін жүйеге кіріңіз.',
          strengths: [],
          weaknesses: [],
          recommendations: ['Дәлірек талдау алу үшін, алдымен жүйеге кіріп, бірнеше тест тапсырыңыз.']
        });
        setLoading(false);
        return;
      }
      
      const tests = await getTests();
      const generatedFeedback = await generateAIFeedback(user, tests);
      setFeedback(generatedFeedback);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <ScreenContainer className="bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">AI талдау жасалуда...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  if (!feedback) {
    return (
      <ScreenContainer className="bg-white">
        <View className="flex-1 justify-center items-center">
          <MaterialIcons name="error-outline" size={48} color="#dc2626" />
          <Text className="mt-4 text-gray-600">Талдау жасау кезінде қате орын алды. Кейінірек қайталап көріңіз.</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer scroll className="bg-gray-50">
      <View className="bg-blue-600 p-6 rounded-b-3xl">
        <Text className="text-2xl font-bold text-white mb-2">AI Көмекші</Text>
        <Text className="text-white opacity-80">
          Жеке оқу жоспарыңызды жасаңыз және ЕНТ-ге дайындықты жақсартыңыз
        </Text>
      </View>
      
      <View className="px-4 py-6">
        <Card>
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="insights" size={24} color="#3b82f6" />
            <Text className="text-lg font-bold ml-2">Жалпы шолу</Text>
          </View>
          <Text className="text-gray-700">{feedback.overview}</Text>
        </Card>
        
        <Card>
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="trending-up" size={24} color="#16a34a" />
            <Text className="text-lg font-bold ml-2">Күшті жақтарыңыз</Text>
          </View>
          
          {feedback.strengths.length > 0 ? (
            feedback.strengths.map((strength, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">{strength}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">Күшті жақтарыңыз әлі анықталған жоқ.</Text>
          )}
        </Card>
        
        <Card>
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="trending-down" size={24} color="#dc2626" />
            <Text className="text-lg font-bold ml-2">Жақсартуды қажет ететін салалар</Text>
          </View>
          
          {feedback.weaknesses.length > 0 ? (
            feedback.weaknesses.map((weakness, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <MaterialIcons name="error-outline" size={20} color="#dc2626" />
                <Text className="ml-2 text-gray-700">{weakness}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">Әлсіз жақтарыңыз анықталған жоқ немесе жеткілікті деректер жоқ.</Text>
          )}
        </Card>
        
        <Card>
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="lightbulb" size={24} color="#eab308" />
            <Text className="text-lg font-bold ml-2">Кеңестер</Text>
          </View>
          
          {feedback.recommendations.map((recommendation, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <MaterialIcons name="star" size={20} color="#eab308" className="mt-0.5" />
              <Text className="ml-2 text-gray-700 flex-1">{recommendation}</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScreenContainer>
  );
};

export default AIHelperScreen; 