import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
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
          <Text style={[styles.stepText, { color: theme.primary }]}>6</Text>
          <Text style={[styles.stepDivider, { color: theme.textSecondary }]}>/</Text>
          <Text style={[styles.stepTotal, { color: theme.textSecondary }]}>7</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: '85%' }]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>
          How <Text style={{ color: theme.primary }}>Active</Text> Are You?
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          This helps us understand your fitness level and create a personalized plan.
        </Text>

        <View style={styles.optionsContainer}>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[styles.optionCard, { shadowColor: theme.shadow }]}
              onPress={() => setSelectedLevel(level.id)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={selectedLevel === level.id ? theme.gradients.primary : theme.gradients.card}
                style={[
                  styles.optionCardGradient, 
                  { 
                    borderColor: selectedLevel === level.id ? theme.primary : theme.cardBorder,
                    borderWidth: 1
                  }
                ]}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Text style={styles.optionIcon}>{level.icon}</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    { color: selectedLevel === level.id ? '#FFFFFF' : theme.text }
                  ]}>
                    {level.title}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    { color: selectedLevel === level.id ? 'rgba(255, 255, 255, 0.9)' : theme.textSecondary }
                  ]}>
                    {level.description}
                  </Text>
                </View>
                <View style={[
                  styles.radio,
                  { 
                    borderColor: selectedLevel === level.id ? 'rgba(255, 255, 255, 0.5)' : theme.cardBorder,
                    backgroundColor: selectedLevel === level.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                  }
                ]}>
                  {selectedLevel === level.id && (
                    <View style={styles.radioInner}>
                      <Text style={[styles.radioCheck, { color: theme.primary }]}>✓</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.glass }]}>
        <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: theme.input }]} 
          onPress={() => router.push('/onboarding/assessment')}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !selectedLevel && styles.continueButtonDisabled,
            { shadowColor: theme.shadow }
          ]} 
          onPress={handleContinue}
          disabled={!selectedLevel}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!selectedLevel ? theme.gradients.buttonDisabled : theme.gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={[
              styles.continueText,
              !selectedLevel && { color: theme.textSecondary }
            ]}>Continue</Text>
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    flex: 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonDisabled: {
    opacity: 0.8,
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
