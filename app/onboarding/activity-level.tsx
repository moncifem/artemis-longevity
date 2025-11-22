import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const activityLevels = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: '🪑',
  },
  {
    id: 'light',
    title: 'Light',
    description: 'Exercise 1-2 times per week',
    icon: '🚶',
  },
  {
    id: 'moderate',
    title: 'Moderate',
    description: 'Exercise 3-4 times per week',
    icon: '🏃',
  },
  {
    id: 'active',
    title: 'Active',
    description: 'Exercise 5-6 times per week',
    icon: '🏋️',
  },
  {
    id: 'very-active',
    title: 'Very Active',
    description: 'Exercise daily or intense training',
    icon: '💪',
  },
];

export default function ActivityLevel() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedLevel) return;

    await AsyncStorage.setItem('activityLevel', selectedLevel);
    router.push('/onboarding/assessment');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>5 / 6</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '83%' }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          How <Text style={styles.titleHighlight}>Often</Text> Do You Exercise?
        </Text>
        <Text style={styles.subtitle}>
          This helps us understand your fitness level and create a personalized plan.
        </Text>

        <View style={styles.optionsContainer}>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.optionCard,
                selectedLevel === level.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <Text style={styles.optionIcon}>{level.icon}</Text>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedLevel === level.id && styles.optionTitleSelected,
                ]}>
                  {level.title}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  selectedLevel === level.id && styles.optionDescriptionSelected,
                ]}>
                  {level.description}
                </Text>
              </View>
              <View style={[
                styles.radio,
                selectedLevel === level.id && styles.radioSelected,
              ]}>
                {selectedLevel === level.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => router.push('/onboarding/assessment')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !selectedLevel && styles.continueButtonDisabled,
          ]} 
          onPress={handleContinue}
          disabled={!selectedLevel}
        >
          <Text style={styles.continueText}>Continue</Text>
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
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: Colors.light.primary,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: Colors.light.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionDescriptionSelected: {
    color: '#7C3AED',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

