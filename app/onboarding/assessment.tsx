import {
  calculateGripStrengthPercentile,
  getGripStrengthPerformanceLevel,
  getGripStrengthReferenceValues
} from '@/constants/grip-strength-norms';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const assessmentTests = [
  {
    id: 'gripStrength',
    title: 'Grip Strength Test',
    description: 'Using a handgrip dynamometer (or estimate), how many kilograms can you hold at 90° arm angle?',
    icon: '🤝',
    inputType: 'number' as const,
    unit: 'kg',
    placeholder: 'Enter kg (e.g., 45)',
    gradient: ['#F3E8FF', '#FCE7F3'] as const,
  },
  {
    id: 'endurance',
    title: 'Endurance Test',
    description: 'How long does it take you to run/walk 2km?',
    icon: '🏃',
    options: ['20+ min', '15-20 min', '12-15 min', '10-12 min', '<10 min'],
    unit: 'minutes',
    gradient: ['#DDD6FE', '#FBCFE8'] as const,
  },
  {
    id: 'flexibility',
    title: 'Flexibility Test',
    description: 'Standing with straight legs, how far can you reach?',
    icon: '🤸',
    options: ['Above knees', 'Touch knees', 'Touch ankles', 'Touch toes', 'Palms flat on floor'],
    unit: 'reach',
    gradient: ['#C4B5FD', '#F9A8D4'] as const,
  },
  {
    id: 'cardio',
    title: 'Cardiovascular Test',
    description: 'What is your typical resting heart rate? (Check in the morning)',
    icon: '❤️',
    options: ['90+ bpm', '80-90 bpm', '70-80 bpm', '65-70 bpm', '<65 bpm'],
    unit: 'bpm',
    gradient: ['#A78BFA', '#F472B6'] as const,
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
    const sex = userProfile.sex || 'male';
    const ageGroup = getAgeGroup(actualAge);
    
    // Calculate fitness score using age-adjusted benchmarks
    let totalScore = 0;
    let maxScore = 0;
    const detailedScores: Record<string, number | string> = {};

    assessmentTests.forEach((test) => {
      const answer = testAnswers[test.id];
      let testScore = 0;
      
      if (test.id === 'gripStrength') {
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
        const answerIndex = test.options.indexOf(answer);
        testScore = answerIndex;
        detailedScores[test.id] = testScore;
      }
      
      totalScore += testScore;
      maxScore += 4;
    });

    const performancePercentage = (totalScore / maxScore) * 100;
    
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
    <LinearGradient
      colors={['#FAF5FF', '#FFFFFF', '#FDF2F8']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <LinearGradient
            colors={['#F3E8FF', '#FFFFFF']}
            style={styles.backButtonGradient}
          >
            <Text style={styles.backText}>←</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{currentTest + 1}</Text>
          <Text style={styles.stepDivider}>/</Text>
          <Text style={styles.stepTotal}>{assessmentTests.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill, 
              { width: `${((currentTest + 1) / assessmentTests.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Test Card */}
        <View style={styles.testCardWrapper}>
          <LinearGradient
            colors={currentTestData.gradient}
            style={styles.testCard}
          >
            <View style={styles.testIconContainer}>
              <Text style={styles.testIcon}>{currentTestData.icon}</Text>
            </View>
            <Text style={styles.testTitle}>{currentTestData.title}</Text>
            <Text style={styles.testDescription}>{currentTestData.description}</Text>
          </LinearGradient>
        </View>

        {'inputType' in currentTestData ? (
          // Input field for numeric tests (e.g., grip strength)
          <>
            <Text style={styles.selectText}>Enter your measurement:</Text>
            <View style={styles.inputContainer}>
              <LinearGradient
                colors={['#F3E8FF', '#FCE7F3']}
                style={styles.inputGradient}
              >
                <TextInput
                  style={styles.input}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={currentTestData.placeholder || 'Enter value'}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#C4B5FD"
                />
                <Text style={styles.inputUnit}>{currentTestData.unit}</Text>
              </LinearGradient>
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleInputSubmit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>
                  {isLastTest ? 'Complete Assessment ✓' : 'Next →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Show reference values */}
            {currentTestData.id === 'gripStrength' && userProfile && (() => {
              const sex = userProfile.sex || 'male';
              const age = userProfile.age || 30;
              const refs = getGripStrengthReferenceValues(sex, age);
              
              return (
                <View style={styles.referenceContainer}>
                  <LinearGradient
                    colors={['#F3E8FF', '#FCE7F3']}
                    style={styles.referenceGradient}
                  >
                    <Text style={styles.referenceTitle}>
                      Reference Values ({refs.ageGroup} years, {sex})
                    </Text>
                    <View style={styles.referenceGrid}>
                      <View style={styles.referenceItem}>
                        <Text style={styles.referenceEmoji}>⭐</Text>
                        <Text style={styles.referenceLabel}>Below Average</Text>
                        <Text style={styles.referenceValue}>&lt;{refs.poor.toFixed(1)} kg</Text>
                      </View>
                      <View style={styles.referenceItem}>
                        <Text style={styles.referenceEmoji}>⭐⭐</Text>
                        <Text style={styles.referenceLabel}>Average</Text>
                        <Text style={styles.referenceValue}>~{refs.average.toFixed(1)} kg</Text>
                      </View>
                      <View style={styles.referenceItem}>
                        <Text style={styles.referenceEmoji}>⭐⭐⭐</Text>
                        <Text style={styles.referenceLabel}>Excellent</Text>
                        <Text style={styles.referenceValue}>&gt;{refs.excellent.toFixed(1)} kg</Text>
                      </View>
                    </View>
                  </LinearGradient>
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
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={answers[currentTestData.id] === option 
                    ? ['#8B5CF6', '#EC4899'] as const
                    : ['#FFFFFF', '#F9FAFB'] as const
                  }
                  style={styles.optionGradient}
                >
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
                    {answers[currentTestData.id] === option && (
                      <Text style={styles.optionCheck}>✓</Text>
                    )}
                  </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#8B5CF6',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  stepText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  stepDivider: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  stepTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C4B5FD',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  testCardWrapper: {
    marginBottom: 32,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  testCard: {
    padding: 40,
    alignItems: 'center',
  },
  testIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  testIcon: {
    fontSize: 48,
  },
  testTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  testDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  selectText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  optionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionNumberSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  optionNumberTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  optionCheck: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inputContainer: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    paddingVertical: 20,
  },
  inputUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginLeft: 12,
  },
  submitButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  referenceContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  referenceGradient: {
    padding: 24,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  referenceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  referenceItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 16,
    borderRadius: 16,
  },
  referenceEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  skipButton: {
    backgroundColor: '#F3E8FF',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});
