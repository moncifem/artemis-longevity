import {
  calculateGripStrengthPercentile,
  getGripStrengthPerformanceLevel,
  getGripStrengthReferenceValues
} from '@/constants/grip-strength-norms';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Age-adjusted fitness benchmarks
const ageBenchmarks = {
  strength: {
    '20-30': [0, 5, 10, 15, 20],      // pull-ups: poor, below avg, avg, good, excellent
    '31-40': [0, 4, 8, 12, 16],
    '41-50': [0, 3, 6, 9, 12],
    '51-60': [0, 2, 5, 8, 10],
    '60+': [0, 1, 3, 5, 7],
  },
  endurance: {
    '20-30': [15, 12, 10, 8, 6],      // 2km run time in minutes: poor, below avg, avg, good, excellent
    '31-40': [17, 14, 12, 10, 8],
    '41-50': [20, 17, 14, 12, 10],
    '51-60': [30, 25, 20, 17, 15],
    '60+': [40, 35, 30, 25, 20],
  },
  flexibility: {
    '20-30': [0, 1, 2, 3, 4],         // 0=can't reach, 1=ankles, 2=mid-shin, 3=toes, 4=palm flat
    '31-40': [0, 1, 2, 3, 4],
    '41-50': [0, 1, 2, 3, 4],
    '51-60': [0, 1, 2, 3, 4],
    '60+': [0, 1, 2, 3, 4],
  },
  cardio: {
    '20-30': [90, 80, 70, 65, 60],    // resting heart rate: poor, below avg, avg, good, excellent
    '31-40': [95, 85, 75, 70, 65],
    '41-50': [100, 90, 80, 75, 70],
    '51-60': [105, 95, 85, 80, 75],
    '60+': [110, 100, 90, 85, 80],
  },
};

const assessmentTests = [
  {
    id: 'gripStrength',
    title: 'Grip Strength Test',
    description: 'Using a handgrip dynamometer (or estimate), how many kilograms can you hold at 90° arm angle?',
    icon: '🤝',
    inputType: 'number' as const,
    unit: 'kg',
    placeholder: 'Enter kg (e.g., 45)',
  },
  {
    id: 'endurance',
    title: 'Endurance Test',
    description: 'How long does it take you to run/walk 2km?',
    icon: '🏃',
    options: ['20+ min', '15-20 min', '12-15 min', '10-12 min', '<10 min'],
    unit: 'minutes',
  },
  {
    id: 'flexibility',
    title: 'Flexibility Test',
    description: 'Standing with straight legs, how far can you reach?',
    icon: '🤸',
    options: ['Above knees', 'Touch knees', 'Touch ankles', 'Touch toes', 'Palms flat on floor'],
    unit: 'reach',
  },
  {
    id: 'cardio',
    title: 'Cardiovascular Test',
    description: 'What is your typical resting heart rate? (Check in the morning)',
    icon: '❤️',
    options: ['90+ bpm', '80-90 bpm', '70-80 bpm', '65-70 bpm', '<65 bpm'],
    unit: 'bpm',
  },
];

export default function Assessment() {
  const router = useRouter();
  const [currentTest, setCurrentTest] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [ouraDataLoaded, setOuraDataLoaded] = useState(false);

  // Load user profile and Oura data on mount
  useEffect(() => {
    const loadProfileAndOuraData = async () => {
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (userProfileStr) {
        setUserProfile(JSON.parse(userProfileStr));
      }

      // Check if Oura is connected and pre-fill assessment
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (ouraToken && !ouraDataLoaded) {
        try {
          const { preFillAssessmentFromOura } = await import('@/services/oura-data-mapper');
          const ouraAssessment = await preFillAssessmentFromOura(7);
          
          if (ouraAssessment) {
            setAnswers({
              endurance: ouraAssessment.endurance,
              cardio: ouraAssessment.cardio,
            });
            setOuraDataLoaded(true);
            Alert.alert(
              'Oura Data Loaded! 💍',
              'Your endurance and cardio assessments have been pre-filled from your Oura Ring data.',
              [{ text: 'Great!' }]
            );
          }
        } catch (error) {
          console.log('Could not load Oura data:', error);
        }
      }
    };
    loadProfileAndOuraData();
  }, []);

  const currentTestData = assessmentTests[currentTest];
  const isLastTest = currentTest === assessmentTests.length - 1;

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [currentTestData.id]: answer };
    setAnswers(newAnswers);
    setInputValue(''); // Clear input for next test

    if (isLastTest) {
      // Calculate fitness age based on answers
      calculateAndSaveResults(newAnswers);
    } else {
      setTimeout(() => {
        setCurrentTest(currentTest + 1);
      }, 300);
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) {
      Alert.alert('Required', 'Please enter a value');
      return;
    }

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert('Invalid', 'Please enter a valid positive number');
      return;
    }

    // Validate grip strength range (reasonable values)
    if (currentTestData.id === 'gripStrength' && (numValue < 5 || numValue > 150)) {
      Alert.alert('Invalid Range', 'Please enter a realistic grip strength value (5-150 kg)');
      return;
    }

    handleAnswer(inputValue);
  };

  const getAgeGroup = (age: number): string => {
    if (age <= 30) return '20-30';
    if (age <= 40) return '31-40';
    if (age <= 50) return '41-50';
    if (age <= 60) return '51-60';
    return '60+';
  };

  const calculateAndSaveResults = async (testAnswers: Record<string, string>) => {
    const userProfileStr = await AsyncStorage.getItem('userProfile');
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : {};
    
    const actualAge = userProfile.age || 30;
    const sex = userProfile.sex || 'male'; // Default to male if not specified
    const ageGroup = getAgeGroup(actualAge);
    
    // Calculate fitness score using age-adjusted benchmarks
    let totalScore = 0;
    let maxScore = 0;
    const detailedScores: Record<string, number | string> = {};

    assessmentTests.forEach((test) => {
      const answer = testAnswers[test.id];
      let testScore = 0;
      
      if (test.id === 'gripStrength') {
        // Calculate grip strength score using normative data
        const gripStrength = parseFloat(answer);
        if (!isNaN(gripStrength)) {
          const percentile = calculateGripStrengthPercentile(gripStrength, sex, actualAge);
          const performance = getGripStrengthPerformanceLevel(percentile);
          testScore = performance.score;
          detailedScores[test.id] = testScore;
          detailedScores[`${test.id}_percentile`] = Math.round(percentile);
          detailedScores[`${test.id}_level`] = performance.level;
        }
      } else if ('options' in test && test.options) {
        // Original scoring for multiple choice tests
        const answerIndex = test.options.indexOf(answer);
        testScore = answerIndex;
        detailedScores[test.id] = testScore;
      }
      
      totalScore += testScore;
      maxScore += 4; // Maximum 4 points per test
    });

    // Calculate performance percentage
    const performancePercentage = (totalScore / maxScore) * 100;
    
    // Calculate fitness age based on performance
    // Excellent (80-100%): 10 years younger
    // Good (60-79%): 5 years younger
    // Average (40-59%): Same age
    // Below Average (20-39%): 5 years older
    // Poor (0-19%): 10 years older
    
    let fitnessAgeAdjustment = 0;
    let performanceLevel = 'Average';
    
    if (performancePercentage >= 80) {
      fitnessAgeAdjustment = -10;
      performanceLevel = 'Excellent';
    } else if (performancePercentage >= 60) {
      fitnessAgeAdjustment = -5;
      performanceLevel = 'Good';
    } else if (performancePercentage >= 40) {
      fitnessAgeAdjustment = 0;
      performanceLevel = 'Average';
    } else if (performancePercentage >= 20) {
      fitnessAgeAdjustment = 5;
      performanceLevel = 'Below Average';
    } else {
      fitnessAgeAdjustment = 10;
      performanceLevel = 'Needs Improvement';
    }

    const fitnessAge = Math.max(18, actualAge + fitnessAgeAdjustment);

    const assessmentResults = {
      tests: testAnswers,
      detailedScores,
      totalScore,
      maxScore,
      performancePercentage: Math.round(performancePercentage),
      performanceLevel,
      fitnessAge,
      actualAge,
      ageGroup,
      fitnessAgeAdjustment,
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

        {'inputType' in currentTestData ? (
          // Input field for numeric tests (e.g., grip strength)
          <>
            <Text style={styles.selectText}>Enter your measurement:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={currentTestData.placeholder || 'Enter value'}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>{currentTestData.unit}</Text>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleInputSubmit}
            >
              <Text style={styles.submitButtonText}>
                {isLastTest ? 'Complete Assessment' : 'Next'}
              </Text>
            </TouchableOpacity>
            
            {/* Show reference values */}
            {currentTestData.id === 'gripStrength' && userProfile && (() => {
              const sex = userProfile.sex || 'male';
              const age = userProfile.age || 30;
              const refs = getGripStrengthReferenceValues(sex, age);
              
              return (
                <View style={styles.referenceContainer}>
                  <Text style={styles.referenceTitle}>Reference Values ({refs.ageGroup} years, {sex}):</Text>
                  <View style={styles.referenceRow}>
                    <Text style={styles.referenceLabel}>Below Average: &lt;{refs.poor.toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.referenceRow}>
                    <Text style={styles.referenceLabel}>Average: ~{refs.average.toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.referenceRow}>
                    <Text style={styles.referenceLabel}>Excellent: &gt;{refs.excellent.toFixed(1)} kg</Text>
                  </View>
                </View>
              );
            })()}
          </>
        ) : (
          // Multiple choice options for other tests
          <>
            <Text style={styles.selectText}>Select your answer:</Text>
            <View style={styles.optionsContainer}>
              {'options' in currentTestData && currentTestData.options?.map((option, index) => (
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
          </>
        )}
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
    backgroundColor: Colors.light.accent,
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
    color: Colors.light.accent,
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
    backgroundColor: '#FCE7F3',
    borderColor: Colors.light.accent,
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
    backgroundColor: Colors.light.accent,
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
    color: Colors.light.accent,
    fontWeight: '700',
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
    color: Colors.light.accent,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3E8FF',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 20,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: Colors.light.accent,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  referenceContainer: {
    backgroundColor: '#FCE7F3',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  referenceRow: {
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
});

