import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  const totalSteps = 5;

  // Check for Oura connection on mount
  useEffect(() => {
    const checkOura = async () => {
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (ouraToken && !ouraChecked) {
        Alert.alert(
          'Load from Oura? 💍',
          'We detected your Oura Ring is connected. Would you like to auto-fill your profile?',
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
                    Alert.alert('Success!', 'Profile data loaded from Oura Ring');
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
    checkOura();
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>{currentStep} / {totalSteps}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {currentStep === 1 && (
          <StepContainer
            title="What's Your Name?"
            subtitle="Let's start by getting to know you."
          >
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </StepContainer>
        )}

        {currentStep === 2 && (
          <StepContainer
            title="Tell Us About You"
            subtitle="This helps us provide accurate health insights tailored for you."
          >
            <View style={styles.sexOptions}>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  sex === 'male' && styles.sexButtonSelected,
                ]}
                onPress={() => setSex('male')}
              >
                <LinearGradient
                  colors={sex === 'male' ? ['#8B5CF6', '#7C3AED'] : ['#F9FAFB', '#F3F4F6']}
                  style={styles.sexButtonGradient}
                >
                  <Text style={styles.sexIcon}>♂️</Text>
                  <Text style={[
                    styles.sexText,
                    sex === 'male' && styles.sexTextSelected,
                  ]}>
                    Male
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  sex === 'female' && styles.sexButtonSelected,
                ]}
                onPress={() => setSex('female')}
              >
                <LinearGradient
                  colors={sex === 'female' ? ['#EC4899', '#DB2777'] : ['#F9FAFB', '#F3F4F6']}
                  style={styles.sexButtonGradient}
                >
                  <Text style={styles.sexIcon}>♀️</Text>
                  <Text style={[
                    styles.sexText,
                    sex === 'female' && styles.sexTextSelected,
                  ]}>
                    Female
                  </Text>
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
                  <Text
                    style={[
                      styles.pickerText,
                      age === ageValue.toString() && styles.pickerTextSelected,
                    ]}
                  >
                    {ageValue}
                  </Text>
                  {age === ageValue.toString() && (
                    <Text style={styles.pickerLabel}>years</Text>
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
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                onPress={() => setHeightUnit('cm')}
              >
                <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, heightUnit === 'ft' && styles.unitButtonActive]}
                onPress={() => setHeightUnit('ft')}
              >
                <Text style={[styles.unitText, heightUnit === 'ft' && styles.unitTextActive]}>
                  ft
                </Text>
              </TouchableOpacity>
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
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('lbs')}
              >
                <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>
                  lbs
                </Text>
              </TouchableOpacity>
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
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>
        {title.split(' ').map((word, index) => 
          word.includes('Name') || word.includes('Sex') || word.includes('Old') || word.includes('Height') || word.includes('Weight') ? (
            <Text key={index} style={styles.titleHighlight}>{word} </Text>
          ) : (
            <Text key={index}>{word} </Text>
          )
        )}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
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
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  titleHighlight: {
    color: Colors.light.accent,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
  },
  input: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.accent,
    paddingVertical: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
    alignSelf: 'flex-start',
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  unitButtonActive: {
    backgroundColor: Colors.light.accent,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitTextActive: {
    color: '#FFFFFF',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerItemSelected: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.accent,
  },
  pickerText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerTextSelected: {
    fontSize: 32,
    color: Colors.light.accent,
    fontWeight: 'bold',
  },
  pickerLabel: {
    fontSize: 14,
    color: Colors.light.accent,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skipButton: {
    flex: 1,
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
  continueButton: {
    flex: 2,
    backgroundColor: Colors.light.accent,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sexOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  sexButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sexButtonGradient: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
  },
  sexButtonSelected: {
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sexIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  sexText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  sexTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

