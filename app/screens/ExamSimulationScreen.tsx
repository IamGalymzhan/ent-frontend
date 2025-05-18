import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getTests, Test, Question } from '../services/testService';
import Button from '../components/Button';

// Extend the Question interface to include a uniqueId 
interface ExamQuestion extends Question {
  uniqueId?: string;
}

const ExamSimulationScreen = () => {
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const tests = await getTests();
      const allQuestions: ExamQuestion[] = [];
      
      // Add questions from each test
      tests.forEach((test: Test) => {
        test.questions.forEach((question: Question) => {
          allQuestions.push({
            ...question,
            // Keep original numeric id, add a separate unique identifier
            uniqueId: `${test.id}-${question.id}` // Create unique ID combining test and question IDs
          });
        });
      });

      // Shuffle questions to randomize order
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      // Initialize selected answers array with -1 (no answer selected)
      setSelectedAnswers(new Array(shuffledQuestions.length).fill(-1));
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Қате', 'Сұрақтар жүктеу кезінде қате орын алды');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showResults) {
      handleFinishTest();
    }
  }, [timeLeft, showResults]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleFinishTest = () => {
    // Check if all questions are answered
    const unansweredQuestions = selectedAnswers.filter(answer => answer === -1).length;
    
    if (unansweredQuestions > 0) {
      Alert.alert(
        'Аяқтауға сенімдісіз бе?',
        `Сіз барлық сұрақтарға жауап бермедіңіз. ${unansweredQuestions} сұрақ қалды.`,
        [
          { text: 'Жоқ, жалғастыру', style: 'cancel' },
          { text: 'Иә, аяқтау', onPress: finishTest }
        ]
      );
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
  };

  if (showResults) {
    return (
      <View className="flex-1 p-4 bg-white">
        <Text className="text-2xl font-bold mb-4">Емтихан нәтижелері</Text>
        <Text className="text-xl mb-2">
          Ұпай: {score} / {questions.length}
        </Text>
        <Text className="text-lg mb-4">
          Пайыз: {((score / questions.length) * 100).toFixed(2)}%
        </Text>
        <Button
          title="Басты бетке оралу"
          onPress={() => navigation.goBack()}
          className="mt-4"
        />
      </View>
    );
  }

  if (loading || questions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Сұрақтар жүктелуде...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const questionNumber = currentQuestionIndex + 1;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4 py-3 bg-blue-500">
        <Text className="text-white text-xl font-bold text-center">
          Қалған уақыт: {formatTime(timeLeft)}
        </Text>
      </View>

      <View className="px-4 py-3 bg-blue-50">
        <Text className="text-blue-800 font-bold">
          Сұрақ {questionNumber}/{totalQuestions}
        </Text>
      </View>
      
      <View className="p-4">
        <Text className="text-lg font-medium mb-6">{currentQuestion.text}</Text>
        
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            className={`p-4 border rounded-lg mb-3 ${
              selectedAnswers[currentQuestionIndex] === index
                ? 'bg-blue-100 border-blue-500'
                : 'border-gray-300'
            }`}
            onPress={() => handleAnswerSelect(index)}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className="flex-row justify-between p-4 mt-2">
        <Button
          title="Артқа"
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onPress={goToPreviousQuestion}
          className="flex-1 mr-2"
        />
        
        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            title="Келесі"
            onPress={goToNextQuestion}
            className="flex-1 ml-2"
          />
        ) : (
          <Button
            title="Аяқтау"
            variant="primary"
            onPress={handleFinishTest}
            className="flex-1 ml-2"
          />
        )}
      </View>
      
      <View className="flex-row flex-wrap p-4 justify-center">
        {questions.map((_, index) => (
          <TouchableOpacity
            key={index}
            className={`w-10 h-10 rounded-full m-1 items-center justify-center ${
              index === currentQuestionIndex
                ? 'bg-blue-600'
                : selectedAnswers[index] !== -1
                ? 'bg-green-600'
                : 'bg-gray-300'
            }`}
            onPress={() => setCurrentQuestionIndex(index)}
          >
            <Text className={`font-bold ${index === currentQuestionIndex || selectedAnswers[index] !== -1 ? 'text-white' : 'text-gray-700'}`}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default ExamSimulationScreen; 