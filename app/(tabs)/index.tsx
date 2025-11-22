import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
}

interface AssessmentResults {
  fitnessAge: number;
  actualAge: number;
  fitnessScore: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [todaySteps] = useState(6496);
  const [todayGoal] = useState(6000);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      const resultsStr = await AsyncStorage.getItem('assessmentResults');
      
      if (profileStr) {
        setUserProfile(JSON.parse(profileStr));
      }
      if (resultsStr) {
        setAssessmentResults(JSON.parse(resultsStr));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const stepProgress = Math.min((todaySteps / todayGoal) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.icon }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {userProfile?.name || 'User'} 👋
            </Text>
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Fitness Age Card */}
        {assessmentResults && (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.fitnessCard}
          >
            <View style={styles.fitnessCardHeader}>
              <Text style={styles.fitnessCardTitle}>Your Fitness Age</Text>
              <Ionicons name="trophy" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.fitnessAgeContainer}>
              <Text style={styles.fitnessAge}>{assessmentResults.fitnessAge}</Text>
              <Text style={styles.fitnessAgeLabel}>years</Text>
            </View>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Actual Age</Text>
                <Text style={styles.comparisonValue}>{assessmentResults.actualAge}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Difference</Text>
                <Text style={styles.comparisonValue}>
                  {assessmentResults.actualAge - assessmentResults.fitnessAge > 0 ? '-' : '+'}
                  {Math.abs(assessmentResults.actualAge - assessmentResults.fitnessAge)} years
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Steps Progress */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Steps</Text>
            <TouchableOpacity>
              <Ionicons name="pause-circle" size={40} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.circularProgress}>
              <Text style={[styles.stepsCount, { color: colors.text }]}>
                {todaySteps.toLocaleString()}
              </Text>
              <Text style={[styles.stepsGoal, { color: colors.icon }]}>
                / {todayGoal.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem icon="time-outline" label="time" value="1h 34m" colors={colors} />
            <StatItem icon="flame" label="kcal" value="525" colors={colors} />
            <StatItem icon="location-outline" label="km" value="7.23" colors={colors} />
          </View>
        </View>

        {/* Your Progress */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Progress</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={[styles.dropdownText, { color: colors.text }]}>This Week</Text>
              <Ionicons name="chevron-down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekProgress}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, index) => (
              <View key={day} style={styles.dayItem}>
                <View style={[
                  styles.dayCircle,
                  index === 6 && { backgroundColor: colors.primary },
                  index !== 6 && { backgroundColor: colors.border },
                ]}>
                  <Text style={[
                    styles.dayNumber,
                    index === 6 && { color: '#FFFFFF' },
                    index !== 6 && { color: colors.icon },
                  ]}>
                    {16 + index}
                  </Text>
                </View>
                <Text style={[styles.dayLabel, { color: colors.icon }]}>
                  {day === 'Today' ? 'Today' : day.slice(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            icon="fitness" 
            label="Start Workout" 
            colors={colors}
            gradient={[colors.primary, colors.secondary]}
          />
          <ActionButton 
            icon="people" 
            label="My Groups" 
            colors={colors}
            gradient={['#EC4899', '#F472B6']}
          />
          <ActionButton 
            icon="bar-chart" 
            label="View Report" 
            colors={colors}
            gradient={['#10B981', '#34D399']}
          />
          <ActionButton 
            icon="trophy" 
            label="Challenges" 
            colors={colors}
            gradient={['#F59E0B', '#FBBF24']}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function StatItem({ icon, label, value, colors }: any) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, colors, gradient }: any) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <LinearGradient colors={gradient} style={styles.actionGradient}>
        <Ionicons name={icon} size={32} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fitnessCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
  },
  fitnessCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fitnessCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fitnessAgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  fitnessAge: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fitnessAgeLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    fontSize: 14,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgress: {
    alignItems: 'center',
  },
  stepsCount: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  stepsGoal: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  actionButton: {
    width: (width - 56) / 2,
    alignItems: 'center',
  },
  actionGradient: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
