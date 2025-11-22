import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const assessmentTests = [
  {
    id: 'pushups',
    title: 'Push-ups Test',
    description: 'How many push-ups can you do in 1 minute?',
    icon: '💪',
    options: ['0-10', '11-20', '21-30', '31-40', '40+'],
  },
  {
    id: 'plank',
    title: 'Plank Hold Test',
    description: 'How long can you hold a plank?',
    icon: '🧘',
    options: ['<30 sec', '30-60 sec', '1-2 min', '2-3 min', '3+ min'],
  },
  {
    id: 'flexibility',
    title: 'Flexibility Test',
    description: 'Can you touch your toes while standing?',
    icon: '🤸',
    options: ['Not at all', 'Almost', 'Just barely', 'Easily', 'Palm flat'],
  },
  {
    id: 'cardio',
    title: 'Cardio Test',
    description: 'Can you run for 10 minutes without stopping?',
    icon: '🏃',
    options: ['No', 'With difficulty', 'Yes, moderate pace', 'Yes, fast pace', 'Yes, very fast'],
  },
];

export default function Assessment() {
  const router = useRouter();
  const [currentTest, setCurrentTest] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentTestData = assessmentTests[currentTest];
  const isLastTest = currentTest === assessmentTests.length - 1;

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentTestData.id]: answer };
    setAnswers(newAnswers);

    if (isLastTest) {
      // Calculate fitness age based on answers
      calculateAndSaveResults(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentTest(currentTest + 1);
      }, 300);
    }
  };

  const calculateAndSaveResults = async (testAnswers: Record<string, string>) => {
    const userProfileStr = await AsyncStorage.getItem('userProfile');
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : {};
    
    // Simple fitness age calculation (this is a simplified version)
    const actualAge = userProfile.age || 30;
    let fitnessScore = 0;

    // Score each test (0-4 points)
    Object.values(testAnswers).forEach((answer) => {
      const index = assessmentTests.find(t => testAnswers[t.id] === answer)?.options.indexOf(answer) || 0;
      fitnessScore += index;
    });

    // Calculate fitness age (lower score = older fitness age)
    const maxScore = assessmentTests.length * 4;
    const scorePercentage = (fitnessScore / maxScore) * 100;
    
    let fitnessAge: number;
    if (scorePercentage >= 80) {
      fitnessAge = actualAge - 10;
    } else if (scorePercentage >= 60) {
      fitnessAge = actualAge - 5;
    } else if (scorePercentage >= 40) {
      fitnessAge = actualAge;
    } else if (scorePercentage >= 20) {
      fitnessAge = actualAge + 5;
    } else {
      fitnessAge = actualAge + 10;
    }

    const assessmentResults = {
      tests: testAnswers,
      fitnessScore,
      fitnessAge: Math.max(18, fitnessAge),
      actualAge,
      assessmentDate: new Date().toISOString(),
    };

    await AsyncStorage.setItem('assessmentResults', JSON.stringify(assessmentResults));
    await AsyncStorage.setItem('hasOnboarded', 'true');
    
    // Navigate to results or main app
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (currentTest > 0) {
      setCurrentTest(currentTest - 1);
    } else {
      router.back();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>
          Test {currentTest + 1} / {assessmentTests.length}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[
          styles.progress, 
          { width: `${((currentTest + 1) / assessmentTests.length) * 100}%` }
        ]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#F3E8FF', '#FFFFFF']}
          style={styles.testCard}
        >
          <Text style={styles.testIcon}>{currentTestData.icon}</Text>
          <Text style={styles.testTitle}>{currentTestData.title}</Text>
          <Text style={styles.testDescription}>{currentTestData.description}</Text>
        </LinearGradient>

        <Text style={styles.selectText}>Select your answer:</Text>

        <View style={styles.optionsContainer}>
          {currentTestData.options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                answers[currentTestData.id] === option && styles.optionButtonSelected,
              ]}
              onPress={() => handleAnswer(option)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionNumber,
                  answers[currentTestData.id] === option && styles.optionNumberSelected,
                ]}>
                  <Text style={[
                    styles.optionNumberText,
                    answers[currentTestData.id] === option && styles.optionNumberTextSelected,
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentTestData.id] === option && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip Assessment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#1F2937',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  testCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  testIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  testTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  testDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: Colors.light.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionNumberSelected: {
    backgroundColor: Colors.light.primary,
  },
  optionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  optionNumberTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});

