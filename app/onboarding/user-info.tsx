import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

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

  const totalSteps = 5;

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
            title="What's Your Sex?"
            subtitle="This helps us provide accurate health benchmarks."
          >
            <View style={styles.sexOptions}>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  sex === 'male' && styles.sexButtonSelected,
                ]}
                onPress={() => setSex('male')}
              >
                <Text style={styles.sexIcon}>♂️</Text>
                <Text style={[
                  styles.sexText,
                  sex === 'male' && styles.sexTextSelected,
                ]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexButton,
                  sex === 'female' && styles.sexButtonSelected,
                ]}
                onPress={() => setSex('female')}
              >
                <Text style={styles.sexIcon}>♀️</Text>
                <Text style={[
                  styles.sexText,
                  sex === 'female' && styles.sexTextSelected,
                ]}>
                  Female
                </Text>
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
    backgroundColor: Colors.light.primary,
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
    color: Colors.light.primary,
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
    borderBottomColor: Colors.light.primary,
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
    backgroundColor: Colors.light.primary,
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
    borderBottomColor: Colors.light.primary,
  },
  pickerText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerTextSelected: {
    fontSize: 32,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  pickerLabel: {
    fontSize: 14,
    color: Colors.light.primary,
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
    color: Colors.light.primary,
  },
  continueButton: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sexOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  sexButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  sexButtonSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: Colors.light.primary,
  },
  sexIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  sexText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  sexTextSelected: {
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
});

