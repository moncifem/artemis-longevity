import {
  evaluateGaitSpeedPerformance,
  getGaitSpeedReferenceValues
} from '@/constants/gait-speed-norms';
import {
  calculateGripStrengthPercentile,
  getGripStrengthPerformanceLevel,
  getGripStrengthReferenceValues
} from '@/constants/grip-strength-norms';
import {
  SARC_F_QUESTIONS,
  calculateSarcFScore,
  interpretSarcFScore
} from '@/constants/sarc-f-questionnaire';
import {
  evaluateSingleLegStancePerformance,
  getSingleLegStanceReferenceValues
} from '@/constants/single-leg-stance-norms';
import {
  evaluateSitToStandPerformance,
  getSitToStandReferenceValues
} from '@/constants/sit-to-stand-norms';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const assessmentTests = [
  {
    id: 'gripStrength',
    title: 'Grip Strength Test',
    description: 'Using a handgrip dynamometer (or estimate), how many kilograms can you squeeze? Stand with your arm at 90°.',
    icon: '🤝',
    inputType: 'number' as const,
    unit: 'kg',
    placeholder: 'Enter kg (e.g., 30)',
    clinicalNote: 'Predicts mortality and functional decline (UK Biobank: 500,000 participants)',
  },
  {
    id: 'sitToStand',
    title: 'Five-Times Sit-to-Stand',
    description: 'Sit in a chair, then stand up and sit down 5 times as quickly as you can. How many seconds did it take?',
    icon: '💺',
    inputType: 'number' as const,
    unit: 'seconds',
    placeholder: 'Enter seconds (e.g., 12)',
    clinicalNote: 'Predicts frailty, falls, and sarcopenia (Validated: 45,470 adults)',
  },
  {
    id: 'gaitSpeed',
    title: '4-Metre Gait Speed',
    description: 'Walk 4 meters (13 feet) at your normal pace. How many seconds did it take?',
    icon: '🚶‍♀️',
    inputType: 'number' as const,
    unit: 'seconds',
    placeholder: 'Enter seconds (e.g., 3.5)',
    clinicalNote: 'The "6th Vital Sign" - Predicts mortality and hospitalization (10,000+ adults)',
  },
  {
    id: 'singleLegStance',
    title: 'Single-Leg Balance',
    description: 'Stand on one leg (eyes open) for as long as you can. Stop at 60 seconds. How long did you balance?',
    icon: '🦩',
    inputType: 'number' as const,
    unit: 'seconds',
    placeholder: 'Enter seconds (e.g., 25)',
    clinicalNote: 'Predicts fall risk and mortality (Validated: 2,000-5,000+ adults)',
  },
  {
    id: 'sarcF',
    title: 'SARC-F Questionnaire',
    description: 'Answer 5 questions about your functional abilities to screen for sarcopenia risk.',
    icon: '📋',
    questionnaire: SARC_F_QUESTIONS,
    clinicalNote: 'International sarcopenia screening tool (Validated: 10,000+ older adults)',
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
  const [sarcFAnswers, setSarcFAnswers] = useState<Record<string, number>>({});
  const [currentSarcFQuestion, setCurrentSarcFQuestion] = useState(0);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (userProfileStr) {
        setUserProfile(JSON.parse(userProfileStr));
      }
    };
    loadProfile();
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

    // Validate ranges for each test
    if (currentTestData.id === 'gripStrength' && (numValue < 5 || numValue > 150)) {
      Alert.alert('Invalid Range', 'Please enter a realistic grip strength value (5-150 kg)');
      return;
    }
    if (currentTestData.id === 'sitToStand' && (numValue < 3 || numValue > 120)) {
      Alert.alert('Invalid Range', 'Please enter a realistic time (3-120 seconds)');
      return;
    }
    if (currentTestData.id === 'gaitSpeed' && (numValue < 1 || numValue > 30)) {
      Alert.alert('Invalid Range', 'Please enter a realistic time (1-30 seconds)');
      return;
    }
    if (currentTestData.id === 'singleLegStance' && (numValue < 0 || numValue > 60)) {
      Alert.alert('Invalid Range', 'Please enter a time between 0-60 seconds');
      return;
    }

    handleAnswer(inputValue);
  };

  const handleSarcFAnswer = (score: number) => {
    const currentQuestion = SARC_F_QUESTIONS[currentSarcFQuestion];
    const newSarcFAnswers = { ...sarcFAnswers, [currentQuestion.id]: score };
    setSarcFAnswers(newSarcFAnswers);

    if (currentSarcFQuestion < SARC_F_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentSarcFQuestion(currentSarcFQuestion + 1);
      }, 300);
    } else {
      // SARC-F complete, move to next test or finish
      const totalScore = calculateSarcFScore(newSarcFAnswers);
      handleAnswer(totalScore.toString());
    }
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
    const sex = userProfile.sex || 'female'; // Default to female as app is for women
    const ageGroup = getAgeGroup(actualAge);
    
    // Calculate functional fitness score using clinical assessments
    let totalScore = 0;
    let maxScore = 0;
    const detailedScores: Record<string, number | string> = {};
    const clinicalAssessments: Record<string, any> = {};

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
          detailedScores[`${test.id}_value`] = gripStrength;
          detailedScores[`${test.id}_percentile`] = Math.round(percentile);
          detailedScores[`${test.id}_level`] = performance.level;
          clinicalAssessments.gripStrength = {
            value: gripStrength,
            percentile,
            level: performance.level,
            description: performance.description,
          };
        }
      } else if (test.id === 'sitToStand') {
        const time = parseFloat(answer);
        if (!isNaN(time)) {
          const performance = evaluateSitToStandPerformance(time, sex, actualAge);
          testScore = performance.score;
          detailedScores[test.id] = testScore;
          detailedScores[`${test.id}_value`] = time;
          detailedScores[`${test.id}_level`] = performance.level;
          detailedScores[`${test.id}_frailtyRisk`] = performance.frailtyRisk;
          clinicalAssessments.sitToStand = {
            value: time,
            level: performance.level,
            frailtyRisk: performance.frailtyRisk,
            description: performance.description,
          };
        }
      } else if (test.id === 'gaitSpeed') {
        const time = parseFloat(answer);
        if (!isNaN(time)) {
          const performance = evaluateGaitSpeedPerformance(time, sex, actualAge, true);
          testScore = performance.score;
          detailedScores[test.id] = testScore;
          detailedScores[`${test.id}_time`] = time;
          detailedScores[`${test.id}_speed`] = performance.speedMs.toFixed(2);
          detailedScores[`${test.id}_level`] = performance.level;
          detailedScores[`${test.id}_mortalityRisk`] = performance.mortalityRisk;
          clinicalAssessments.gaitSpeed = {
            time,
            speedMs: performance.speedMs,
            level: performance.level,
            mortalityRisk: performance.mortalityRisk,
            description: performance.description,
          };
        }
      } else if (test.id === 'singleLegStance') {
        const time = parseFloat(answer);
        if (!isNaN(time)) {
          const performance = evaluateSingleLegStancePerformance(time, sex, actualAge);
          testScore = performance.score;
          detailedScores[test.id] = testScore;
          detailedScores[`${test.id}_value`] = time;
          detailedScores[`${test.id}_level`] = performance.level;
          detailedScores[`${test.id}_fallRisk`] = performance.fallRisk;
          clinicalAssessments.singleLegStance = {
            value: time,
            level: performance.level,
            fallRisk: performance.fallRisk,
            description: performance.description,
            mortalityNote: performance.mortalityNote,
          };
        }
      } else if (test.id === 'sarcF') {
        const totalSarcF = parseFloat(answer);
        if (!isNaN(totalSarcF)) {
          const interpretation = interpretSarcFScore(totalSarcF);
          testScore = interpretation.performanceScore;
          detailedScores[test.id] = testScore;
          detailedScores[`${test.id}_score`] = totalSarcF;
          detailedScores[`${test.id}_level`] = interpretation.level;
          detailedScores[`${test.id}_sarcopeniaRisk`] = interpretation.sarcopeniaRisk;
          clinicalAssessments.sarcF = {
            score: totalSarcF,
            level: interpretation.level,
            sarcopeniaRisk: interpretation.sarcopeniaRisk,
            recommendation: interpretation.recommendation,
            componentScores: sarcFAnswers,
          };
        }
      }
      
      totalScore += testScore;
      maxScore += 4;
    });

    const performancePercentage = (totalScore / maxScore) * 100;
    
    // More nuanced fitness age calculation based on functional fitness
    let fitnessAgeAdjustment = 0;
    let performanceLevel = 'Average';
    
    if (performancePercentage >= 85) {
      fitnessAgeAdjustment = -12;
      performanceLevel = 'Exceptional';
    } else if (performancePercentage >= 70) {
      fitnessAgeAdjustment = -7;
      performanceLevel = 'Excellent';
    } else if (performancePercentage >= 55) {
      fitnessAgeAdjustment = -3;
      performanceLevel = 'Good';
    } else if (performancePercentage >= 40) {
      fitnessAgeAdjustment = 0;
      performanceLevel = 'Average';
    } else if (performancePercentage >= 25) {
      fitnessAgeAdjustment = 4;
      performanceLevel = 'Below Average';
    } else {
      fitnessAgeAdjustment = 8;
      performanceLevel = 'Needs Attention';
    }

    const fitnessAge = Math.max(18, actualAge + fitnessAgeAdjustment);

    const assessmentResults = {
      tests: testAnswers,
      detailedScores,
      clinicalAssessments,
      totalScore,
      maxScore,
      performancePercentage: Math.round(performancePercentage),
      performanceLevel,
      fitnessAge,
      actualAge,
      ageGroup,
      fitnessAgeAdjustment,
      assessmentDate: new Date().toISOString(),
      assessmentType: 'functional-fitness',
      validatedTests: ['gripStrength', 'sitToStand', 'gaitSpeed', 'singleLegStance', 'sarcF'],
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
            
            {/* Show instructional images for tests */}
            {currentTestData.id === 'gripStrength' && (
              <Image 
                source={require('@/assets/images/grip_test.jpg')}
                style={styles.instructionalImage}
                resizeMode="contain"
              />
            )}
            {currentTestData.id === 'sitToStand' && (
              <Image 
                source={require('@/assets/images/sit_to_stand.jpg')}
                style={styles.instructionalImage}
                resizeMode="contain"
              />
            )}
          </LinearGradient>
        </View>

        {'questionnaire' in currentTestData && currentTestData.questionnaire ? (
          // SARC-F Questionnaire
          <>
            <Text style={[styles.selectText, { color: theme.text }]}>
              Question {currentSarcFQuestion + 1} of {SARC_F_QUESTIONS.length}
            </Text>
            <View style={[styles.questionnaireContainer, { shadowColor: theme.shadow }]}>
              <LinearGradient
                colors={theme.gradients.card}
                style={[styles.questionnaireCard, { borderColor: theme.cardBorder, borderWidth: 1 }]}
              >
                <Text style={[styles.questionnaireText, { color: theme.text }]}>
                  {SARC_F_QUESTIONS[currentSarcFQuestion].question}
                </Text>
              </LinearGradient>
            </View>
            <View style={styles.optionsContainer}>
              {SARC_F_QUESTIONS[currentSarcFQuestion].options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionButton, { shadowColor: theme.shadow }]}
                  onPress={() => handleSarcFAnswer(option.score)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={theme.gradients.card}
                    style={[styles.optionGradient, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                  >
                    <View style={[styles.optionNumber, { backgroundColor: theme.input }]}>
                      <Text style={[styles.optionNumberText, { color: theme.primary }]}>{option.score}</Text>
                    </View>
                    <Text style={[styles.optionText, { color: theme.text }]}>{option.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : 'inputType' in currentTestData ? (
          // Input field for numeric tests
          <>
            <Text style={[styles.selectText, { color: theme.text }]}>Enter your measurement:</Text>
            <View style={[styles.inputWrapper, { shadowColor: theme.shadow }]}>
              <LinearGradient
                colors={theme.gradients.card}
                style={[styles.inputCard, { borderColor: theme.cardBorder, borderWidth: 1 }]}
              >
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={currentTestData.placeholder || 'Enter value'}
                    keyboardType="decimal-pad"
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                  />
                  <View style={[styles.unitBadge, { backgroundColor: theme.input }]}>
                    <Text style={[styles.unitText, { color: theme.primary }]}>{currentTestData.unit}</Text>
                  </View>
                </View>
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
            
            {/* Show reference values for each test */}
            {userProfile && (() => {
              const sex = userProfile.sex || 'female';
              const age = userProfile.age || 30;
              let refs: any = null;
              let refType = '';
              
              if (currentTestData.id === 'gripStrength') {
                refs = getGripStrengthReferenceValues(sex, age);
                refType = 'higher';
              } else if (currentTestData.id === 'sitToStand') {
                refs = getSitToStandReferenceValues(sex, age);
                refType = 'lower';
              } else if (currentTestData.id === 'gaitSpeed') {
                refs = getGaitSpeedReferenceValues(sex, age);
                refType = 'speed';
              } else if (currentTestData.id === 'singleLegStance') {
                refs = getSingleLegStanceReferenceValues(sex, age);
                refType = 'higher';
              }
              
              if (!refs) return null;
              
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
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Poor</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>
                          {refType === 'lower' ? '>' : refType === 'speed' ? '<' : '<'}
                          {refType === 'speed' ? (4 / refs.poor).toFixed(1) + 's' : refs.poor.toFixed(1) + (currentTestData.unit || '')}
                        </Text>
                      </View>
                      <View style={[styles.referenceItem, { backgroundColor: theme.input }]}>
                        <Text style={styles.referenceEmoji}>⭐⭐</Text>
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Average</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>
                          ~{refType === 'speed' ? (4 / refs.average).toFixed(1) + 's' : refs.average.toFixed(1) + (currentTestData.unit || '')}
                        </Text>
                      </View>
                      <View style={[styles.referenceItem, { backgroundColor: theme.input }]}>
                        <Text style={styles.referenceEmoji}>⭐⭐⭐</Text>
                        <Text style={[styles.referenceLabel, { color: theme.textSecondary }]}>Excellent</Text>
                        <Text style={[styles.referenceValue, { color: theme.primary }]}>
                          {refType === 'lower' ? '<' : refType === 'speed' ? '<' : '>'}
                          {refType === 'speed' ? (4 / refs.excellent).toFixed(1) + 's' : refs.excellent.toFixed(1) + (currentTestData.unit || '')}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })()}
          </>
        ) : null}
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
  instructionalImage: {
    width: '100%',
    height: 200,
    marginTop: 24,
    borderRadius: 16,
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
  inputWrapper: {
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputCard: {
    padding: 14,
    borderRadius: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 10,
    textAlign: 'center',
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    minWidth: 55,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  questionnaireContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  questionnaireCard: {
    padding: 24,
  },
  questionnaireText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
});
