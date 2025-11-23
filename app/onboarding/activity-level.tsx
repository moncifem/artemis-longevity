import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const activityLevels = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: '🪑',
    gradient: ['#F3E8FF', '#FCE7F3'],
  },
  {
    id: 'light',
    title: 'Light',
    description: 'Exercise 1-2 times per week',
    icon: '🚶',
    gradient: ['#DDD6FE', '#FBCFE8'],
  },
  {
    id: 'moderate',
    title: 'Moderate',
    description: 'Exercise 3-4 times per week',
    icon: '🏃',
    gradient: ['#C4B5FD', '#F9A8D4'],
  },
  {
    id: 'active',
    title: 'Active',
    description: 'Exercise 5-6 times per week',
    icon: '🏋️',
    gradient: ['#A78BFA', '#F472B6'],
  },
  {
    id: 'very-active',
    title: 'Very Active',
    description: 'Exercise daily or intense training',
    icon: '💪',
    gradient: ['#8B5CF6', '#EC4899'],
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
          <Text style={styles.stepText}>6</Text>
          <Text style={styles.stepDivider}>/</Text>
          <Text style={styles.stepTotal}>7</Text>
        </View>
      </View>

      {/* Progress bar with gradient */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: '85%' }]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          How <Text style={styles.titleHighlight}>Active</Text> Are You?
        </Text>
        <Text style={styles.subtitle}>
          This helps us understand your fitness level and create a personalized plan.
        </Text>

        <View style={styles.optionsContainer}>
          {activityLevels.map((level, index) => (
            <TouchableOpacity
              key={level.id}
              style={styles.optionCard}
              onPress={() => setSelectedLevel(level.id)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={selectedLevel === level.id ? ['#8B5CF6', '#EC4899'] : level.gradient}
                style={styles.optionCardGradient}
              >
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>{level.icon}</Text>
                </View>
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
                  {selectedLevel === level.id && (
                    <View style={styles.radioInner}>
                      <Text style={styles.radioCheck}>✓</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
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
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!selectedLevel ? ['#C4B5FD', '#F9A8D4'] : ['#8B5CF6', '#EC4899']}
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 42,
  },
  titleHighlight: {
    color: '#8B5CF6',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  optionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIcon: {
    fontSize: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  optionTitleSelected: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  radioSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  radioInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '800',
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
  continueButtonDisabled: {
    opacity: 0.5,
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
