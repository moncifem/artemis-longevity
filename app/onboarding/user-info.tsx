import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function UserInfo() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [ouraChecked, setOuraChecked] = useState(false);
  const [appleHealthChecked, setAppleHealthChecked] = useState(false);

  const totalSteps = 5;

  // Check for health integrations on mount
  useEffect(() => {
    const checkHealthIntegrations = async () => {
      // Check Apple Health first
      if (!appleHealthChecked) {
        try {
          const { isHealthKitAvailable, initHealthKit, getUserProfile } = await import('@/services/apple-health-api');
          const available = await isHealthKitAvailable();
          
          if (available) {
            Alert.alert(
              'Load from Apple Health? 🍎',
              'We can auto-fill your profile from Apple Health.',
              [
                {
                  text: 'No Thanks',
                  style: 'cancel',
                  onPress: () => {
                    setAppleHealthChecked(true);
                    checkOura();
                  },
                },
                {
                  text: 'Yes, Auto-Fill',
                  onPress: async () => {
                    try {
                      const initialized = await initHealthKit();
                      if (initialized) {
                        const profile = await getUserProfile();
                        if (profile) {
                          if (profile.age > 0) setAge(profile.age.toString());
                          if (profile.height > 0) setHeight(Math.round(profile.height).toString());
                          if (profile.weight > 0) setWeight(Math.round(profile.weight).toString());
                          if (profile.sex) setSex(profile.sex as 'male' | 'female');
                          setHeightUnit('cm');
                          setWeightUnit('kg');
                          setAppleHealthChecked(true);
                          Alert.alert('Success!', 'Profile loaded from Apple Health');
                        }
                      }
                    } catch (error) {
                      console.error('Error loading Apple Health:', error);
                      setAppleHealthChecked(true);
                      checkOura();
                    }
                  },
                },
              ]
            );
          } else {
            setAppleHealthChecked(true);
            checkOura();
          }
        } catch (error) {
          setAppleHealthChecked(true);
          checkOura();
        }
      }
    };

    const checkOura = async () => {
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (ouraToken && !ouraChecked) {
        Alert.alert(
          'Load from Oura? 💍',
          'We detected your Oura Ring. Would you like to auto-fill your profile?',
          [
            {
              text: 'No Thanks',
              style: 'cancel',
              onPress: () => setOuraChecked(true),
            },
            {
              text: 'Yes, Auto-Fill',
              onPress: async () => {
                try {
                  const { autoFillProfileFromOura } = await import('@/services/oura-data-mapper');
                  const ouraProfile = await autoFillProfileFromOura();
                  
                  if (ouraProfile) {
                    setAge(ouraProfile.age.toString());
                    setHeight(ouraProfile.height.toString());
                    setWeight(ouraProfile.weight.toString());
                    setSex(ouraProfile.sex);
                    setHeightUnit('cm');
                    setWeightUnit('kg');
                    setOuraChecked(true);
                    Alert.alert('Success!', 'Profile loaded from Oura Ring');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Could not load Oura data');
                  setOuraChecked(true);
                }
              },
            },
          ]
        );
      }
    };

    checkHealthIntegrations();
  }, []);

  const handleContinue = async () => {
    if (currentStep === 1 && !name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (currentStep === 2 && !sex) {
      Alert.alert('Required', 'Please select your sex');
      return;
    }
    if (currentStep === 3 && !age) {
      Alert.alert('Required', 'Please select your age');
      return;
    }
    if (currentStep === 4 && !height) {
      Alert.alert('Required', 'Please enter your height');
      return;
    }
    if (currentStep === 5 && !weight) {
      Alert.alert('Required', 'Please enter your weight');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save user info
      const userProfile = {
        name,
        sex,
        age: parseInt(age),
        height: parseFloat(height),
        heightUnit,
        weight: parseFloat(weight),
        weightUnit,
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      router.push('/onboarding/activity-level');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  return (
    <LinearGradient
      colors={['#FAF5FF', '#FFFFFF', '#FDF2F8']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      {/* Header with glassmorphism effect */}
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
          <Text style={styles.stepText}>{currentStep}</Text>
          <Text style={styles.stepDivider}>/</Text>
          <Text style={styles.stepTotal}>{totalSteps}</Text>
        </View>
      </View>

      {/* Progress bar with gradient */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${(currentStep / totalSteps) * 100}%` }]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {currentStep === 1 && (
          <StepContainer
            title="What's Your Name?"
            subtitle="Let's start by getting to know you."
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#C4B5FD"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </StepContainer>
        )}

        {currentStep === 2 && (
          <StepContainer
            title="Tell Us About You"
            subtitle="This helps us provide accurate health insights tailored for you."
          >
            <View style={styles.sexOptions}>
              <TouchableOpacity
                style={styles.sexButton}
                onPress={() => setSex('male')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={sex === 'male' ? ['#8B5CF6', '#7C3AED'] : ['#FFFFFF', '#F3F4F6']}
                  style={styles.sexButtonGradient}
                >
                  <View style={styles.sexIconContainer}>
                    <Text style={styles.sexIcon}>♂️</Text>
                  </View>
                  <Text style={[
                    styles.sexText,
                    sex === 'male' && styles.sexTextSelected,
                  ]}>
                    Male
                  </Text>
                  {sex === 'male' && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sexButton}
                onPress={() => setSex('female')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={sex === 'female' ? ['#EC4899', '#DB2777'] : ['#FFFFFF', '#F3F4F6']}
                  style={styles.sexButtonGradient}
                >
                  <View style={styles.sexIconContainer}>
                    <Text style={styles.sexIcon}>♀️</Text>
                  </View>
                  <Text style={[
                    styles.sexText,
                    sex === 'female' && styles.sexTextSelected,
                  ]}>
                    Female
                  </Text>
                  {sex === 'female' && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </StepContainer>
        )}

        {currentStep === 3 && (
          <StepContainer
            title="How Old Are You?"
            subtitle="Share your age with us."
          >
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 83 }, (_, i) => i + 18).map((ageValue) => (
                <TouchableOpacity
                  key={ageValue}
                  style={[
                    styles.pickerItem,
                    age === ageValue.toString() && styles.pickerItemSelected,
                  ]}
                  onPress={() => setAge(ageValue.toString())}
                >
                  {age === ageValue.toString() && (
                    <LinearGradient
                      colors={['#F3E8FF', '#FCE7F3']}
                      style={styles.pickerItemBg}
                    />
                  )}
                  <Text
                    style={[
                      styles.pickerText,
                      age === ageValue.toString() && styles.pickerTextSelected,
                    ]}
                  >
                    {ageValue}
                  </Text>
                  {age === ageValue.toString() && (
                    <Text style={styles.pickerLabel}>years old</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </StepContainer>
        )}

        {currentStep === 4 && (
          <StepContainer
            title="What's Your Height?"
            subtitle="How tall are you?"
          >
            <View style={styles.unitToggleWrapper}>
              <LinearGradient
                colors={['#F3E8FF', '#FCE7F3']}
                style={styles.unitToggle}
              >
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                  onPress={() => setHeightUnit('cm')}
                >
                  {heightUnit === 'cm' && (
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.unitButtonActiveBg}
                    />
                  )}
                  <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, heightUnit === 'ft' && styles.unitButtonActive]}
                  onPress={() => setHeightUnit('ft')}
                >
                  {heightUnit === 'ft' && (
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.unitButtonActiveBg}
                    />
                  )}
                  <Text style={[styles.unitText, heightUnit === 'ft' && styles.unitTextActive]}>
                    ft
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {heightUnit === 'cm'
                ? Array.from({ length: 121 }, (_, i) => i + 140).map((heightValue) => (
                    <TouchableOpacity
                      key={heightValue}
                      style={[
                        styles.pickerItem,
                        height === heightValue.toString() && styles.pickerItemSelected,
                      ]}
                      onPress={() => setHeight(heightValue.toString())}
                    >
                      {height === heightValue.toString() && (
                        <LinearGradient
                          colors={['#F3E8FF', '#FCE7F3']}
                          style={styles.pickerItemBg}
                        />
                      )}
                      <Text
                        style={[
                          styles.pickerText,
                          height === heightValue.toString() && styles.pickerTextSelected,
                        ]}
                      >
                        {heightValue}
                      </Text>
                      {height === heightValue.toString() && (
                        <Text style={styles.pickerLabel}>cm</Text>
                      )}
                    </TouchableOpacity>
                  ))
                : Array.from({ length: 41 }, (_, i) => (i + 48) / 10).map((heightValue) => (
                    <TouchableOpacity
                      key={heightValue}
                      style={[
                        styles.pickerItem,
                        height === heightValue.toFixed(1) && styles.pickerItemSelected,
                      ]}
                      onPress={() => setHeight(heightValue.toFixed(1))}
                    >
                      {height === heightValue.toFixed(1) && (
                        <LinearGradient
                          colors={['#F3E8FF', '#FCE7F3']}
                          style={styles.pickerItemBg}
                        />
                      )}
                      <Text
                        style={[
                          styles.pickerText,
                          height === heightValue.toFixed(1) && styles.pickerTextSelected,
                        ]}
                      >
                        {heightValue.toFixed(1)}
                      </Text>
                      {height === heightValue.toFixed(1) && (
                        <Text style={styles.pickerLabel}>ft</Text>
                      )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </StepContainer>
        )}

        {currentStep === 5 && (
          <StepContainer
            title="What's Your Weight?"
            subtitle="Share your weight with us."
          >
            <View style={styles.unitToggleWrapper}>
              <LinearGradient
                colors={['#F3E8FF', '#FCE7F3']}
                style={styles.unitToggle}
              >
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                  onPress={() => setWeightUnit('kg')}
                >
                  {weightUnit === 'kg' && (
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.unitButtonActiveBg}
                    />
                  )}
                  <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                  onPress={() => setWeightUnit('lbs')}
                >
                  {weightUnit === 'lbs' && (
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.unitButtonActiveBg}
                    />
                  )}
                  <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>
                    lbs
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {weightUnit === 'kg'
                ? Array.from({ length: 151 }, (_, i) => i + 40).map((weightValue) => (
                    <TouchableOpacity
                      key={weightValue}
                      style={[
                        styles.pickerItem,
                        weight === weightValue.toString() && styles.pickerItemSelected,
                      ]}
                      onPress={() => setWeight(weightValue.toString())}
                    >
                      {weight === weightValue.toString() && (
                        <LinearGradient
                          colors={['#F3E8FF', '#FCE7F3']}
                          style={styles.pickerItemBg}
                        />
                      )}
                      <Text
                        style={[
                          styles.pickerText,
                          weight === weightValue.toString() && styles.pickerTextSelected,
                        ]}
                      >
                        {weightValue}
                      </Text>
                      {weight === weightValue.toString() && (
                        <Text style={styles.pickerLabel}>kg</Text>
                      )}
                    </TouchableOpacity>
                  ))
                : Array.from({ length: 281 }, (_, i) => i + 90).map((weightValue) => (
                    <TouchableOpacity
                      key={weightValue}
                      style={[
                        styles.pickerItem,
                        weight === weightValue.toString() && styles.pickerItemSelected,
                      ]}
                      onPress={() => setWeight(weightValue.toString())}
                    >
                      {weight === weightValue.toString() && (
                        <LinearGradient
                          colors={['#F3E8FF', '#FCE7F3']}
                          style={styles.pickerItemBg}
                        />
                      )}
                      <Text
                        style={[
                          styles.pickerText,
                          weight === weightValue.toString() && styles.pickerTextSelected,
                        ]}
                      >
                        {weightValue}
                      </Text>
                      {weight === weightValue.toString() && (
                        <Text style={styles.pickerLabel}>lbs</Text>
                      )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </StepContainer>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={() => handleContinue()}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function StepContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
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
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputWrapper: {
    marginTop: 20,
  },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    borderBottomWidth: 3,
    borderBottomColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sexOptions: {
    gap: 20,
    marginTop: 20,
  },
  sexButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  sexButtonGradient: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 28,
    position: 'relative',
  },
  sexIconContainer: {
    marginBottom: 16,
  },
  sexIcon: {
    fontSize: 72,
  },
  sexText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  sexTextSelected: {
    color: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  unitToggleWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unitToggle: {
    flexDirection: 'row',
    padding: 6,
    gap: 6,
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  unitButtonActive: {
    // Placeholder for when button is active (gradient is rendered via LinearGradient component)
  },
  unitButtonActiveBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  unitTextActive: {
    color: '#FFFFFF',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  pickerItemBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerItemSelected: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerText: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  pickerTextSelected: {
    fontSize: 36,
    color: '#8B5CF6',
    fontWeight: '800',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#EC4899',
    fontWeight: '700',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  continueButton: {
    flex: 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
