import {
  calculateGripStrengthPercentile,
  getGripStrengthPerformanceLevel,
  getGripStrengthReferenceValues
} from '@/constants/grip-strength-norms';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
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
      colors={theme.gradients.background}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.backButton, { shadowColor: theme.shadow }]}>
          <LinearGradient
            colors={theme.gradients.card}
            style={[styles.backButtonGradient, { borderColor: theme.cardBorder, borderWidth: 1 }]}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <Text style={[styles.stepText, { color: theme.primary }]}>{currentTest + 1}</Text>
          <Text style={[styles.stepDivider, { color: theme.textSecondary }]}>/</Text>
          <Text style={[styles.stepTotal, { color: theme.textSecondary }]}>{assessmentTests.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
          <LinearGradient
            colors={theme.gradients.primary}
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
        <View style={[styles.testCardWrapper, { shadowColor: theme.shadow }]}>
          <LinearGradient
            colors={theme.gradients.card}
            style={[styles.testCard, { borderColor: theme.cardBorder, borderWidth: 1 }]}
          >
            <View style={[styles.testIconContainer, { backgroundColor: theme.input }]}>
              <Text style={styles.testIcon}>{currentTestData.icon}</Text>
            </View>
            <Text style={[styles.testTitle, { color: theme.text }]}>{currentTestData.title}</Text>
            <Text style={[styles.testDescription, { color: theme.textSecondary }]}>{currentTestData.description}</Text>
          </LinearGradient>
        </View>

        {'inputType' in currentTestData ? (
          // Input field for numeric tests
          <>
            <Text style={[styles.selectText, { color: theme.text }]}>Enter your measurement:</Text>
            <View style={[styles.inputContainer, { shadowColor: theme.shadow }]}>
              <LinearGradient
                colors={theme.gradients.card}
                style={[styles.inputGradient, { borderColor: theme.primary, borderWidth: 1 }]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={currentTestData.placeholder || 'Enter value'}
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.inputUnit, { color: theme.primary }]}>{currentTestData.unit}</Text>
              </LinearGradient>
            </View>
            
            <TouchableOpacity
              style={[styles.submitButton, { shadowColor: theme.shadow }]}
              onPress={handleInputSubmit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.button}
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
                <View style={[styles.referenceContainer, { shadowColor: theme.shadow }]}>
                  <LinearGradient
                    colors={theme.gradients.card}
                    style={[styles.referenceGradient, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                  >
                    <Text style={[styles.referenceTitle, { color: theme.text }]}>
                      Reference Values ({refs.ageGroup} years, {sex})
                    </Text>
                    <View style={styles.referenceGrid}>
                      <View style={[styles.referenceItem, { backgroundColor: theme.input }]}>
                        <Text style={styles.referenceEmoji}>⭐</Text>
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Below Average</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>&lt;{refs.poor.toFixed(1)} kg</Text>
                      </View>
                      <View style={[styles.referenceItem, { backgroundColor: theme.input }]}>
                        <Text style={styles.referenceEmoji}>⭐⭐</Text>
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Average</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>~{refs.average.toFixed(1)} kg</Text>
                      </View>
                      <View style={[styles.referenceItem, { backgroundColor: theme.input }]}>
                        <Text style={styles.referenceEmoji}>⭐⭐⭐</Text>
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Excellent</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>&gt;{refs.excellent.toFixed(1)} kg</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })()}
          </>
        ) : (
          // Multiple choice options
          <>
            <Text style={[styles.selectText, { color: theme.text }]}>Select your answer:</Text>
            <View style={styles.optionsContainer}>
              {'options' in currentTestData && currentTestData.options?.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, { shadowColor: theme.shadow }]}
                  onPress={() => handleAnswer(option)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={answers[currentTestData.id] === option ? theme.gradients.primary : theme.gradients.card}
                    style={[
                      styles.optionGradient,
                      { borderColor: answers[currentTestData.id] === option ? theme.primary : theme.cardBorder, borderWidth: 1 }
                    ]}
                  >
                    <View style={[
                      styles.optionNumber,
                      { backgroundColor: answers[currentTestData.id] === option ? 'rgba(255,255,255,0.2)' : theme.input }
                    ]}>
                      <Text style={[
                        styles.optionNumberText,
                        { color: answers[currentTestData.id] === option ? '#FFFFFF' : theme.primary }
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      { color: answers[currentTestData.id] === option ? '#FFFFFF' : theme.text }
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

      <View style={[styles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.glass }]}>
        <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: theme.input }]} 
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip Assessment</Text>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  stepText: {
    fontSize: 32,
    fontWeight: '800',
  },
  stepDivider: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
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
    paddingBottom: 100,
  },
  testCardWrapper: {
    marginBottom: 32,
    borderRadius: 32,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  testDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  selectText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionNumberText: {
    fontSize: 16,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    paddingVertical: 20,
  },
  inputUnit: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  submitButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  referenceGradient: {
    padding: 24,
  },
  referenceTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 4,
    textAlign: 'center',
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  skipButton: {
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
