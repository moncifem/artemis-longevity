import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { estimateActivityScore, estimateReadinessScore, estimateSleepScore, getHealthData, getHealthDataSource, HealthDataSource } from '@/services/health-data-service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface OuraData {
  steps: number;
  activeCalories: number;
  totalCalories: number;
  distance: number;
  activityScore: number;
  sleepScore: number;
  readinessScore: number;
  sleepHours: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  sleepEfficiency: number;
  restingHR: number;
  hrvBalance: number;
  recoveryIndex: number;
  temperatureDeviation: number;
  inactivityAlerts: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [ouraData, setOuraData] = useState<OuraData | null>(null);
  const [isLoadingOura, setIsLoadingOura] = useState(false);
  const [isOuraConnected, setIsOuraConnected] = useState(false);
  const [healthDataSource, setHealthDataSource] = useState<HealthDataSource>('none');
  const [refreshing, setRefreshing] = useState(false);
  const stepsIntervalRef = useRef<number | null>(null);
  const bpmIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadUserData();
    loadHealthData();

    // Set up polling intervals
    setupPolling();

    // Cleanup intervals on unmount
    return () => {
      if (stepsIntervalRef.current) clearInterval(stepsIntervalRef.current);
      if (bpmIntervalRef.current) clearInterval(bpmIntervalRef.current);
    };
  }, []);

  const setupPolling = async () => {
    const source = await getHealthDataSource();
    if (source === 'none') return;

    // Poll steps and calories every 1 minute (60000ms)
    stepsIntervalRef.current = setInterval(() => {
      loadStepsAndCalories();
    }, 60000);

    // Poll heart rate every 5 minutes (300000ms)
    bpmIntervalRef.current = setInterval(() => {
      loadHeartRate();
    }, 300000);
  };

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

  const loadHealthData = async () => {
    try {
      setIsLoadingOura(true);
      
      // Get data from active health source
      const { data, source } = await getHealthData();
      setHealthDataSource(source);
      
      if (source === 'oura') {
        setIsOuraConnected(true);
      }
      
      if (data) {
        // If using Apple Health, estimate scores
        if (source === 'apple-health' && data) {
          const activityScore = estimateActivityScore(data.steps || 0, data.activeCalories || 0);
          const sleepScore = estimateSleepScore(data.sleepHours || 0, data.sleepEfficiency || 0);
          const readinessScore = estimateReadinessScore(
            data.restingHR || 0,
            data.hrvBalance || 0,
            sleepScore
          );
          
          setOuraData({
            ...data,
            activityScore,
            sleepScore,
            readinessScore,
          } as OuraData);
        } else {
          setOuraData(data as OuraData);
        }
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoadingOura(false);
    }
  };

  const loadStepsAndCalories = async () => {
    // Re-fetch health data to update steps
    loadHealthData();
  };

  const loadHeartRate = async () => {
    // Re-fetch health data to update HR
    loadHealthData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(), 
      loadHealthData(), 
    ]);
    setRefreshing(false);
  };

  const handleConnectHealth = () => {
    router.push('/apple-health-connect' as any);
  };

  // Use Oura data if available, otherwise show mock data
  const todaySteps = ouraData?.steps || 0;
  const todayGoal = ouraData?.steps ? Math.max(6000, Math.round(ouraData.steps * 0.9)) : 6000;
  const stepProgress = todaySteps > 0 ? Math.min((todaySteps / todayGoal) * 100, 100) : 0;

  return (
    <LinearGradient 
      colors={theme.gradients.background}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {userProfile?.name || 'User'} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            {healthDataSource === 'oura' && (
              <View style={[styles.ouraIndicator, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={styles.ouraRing}>💍</Text>
              </View>
            )}
            {healthDataSource === 'apple-health' && (
              <View style={[styles.ouraIndicator, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                <Text style={styles.ouraRing}>🍎</Text>
              </View>
            )}
            {healthDataSource === 'none' && (
              <TouchableOpacity 
                style={[styles.connectHealthButton, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
                onPress={handleConnectHealth}
              >
                <Text style={styles.connectHealthText}>Connect</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fitness Age Card */}
        {assessmentResults && (
          <LinearGradient
            colors={theme.gradients.primary}
            style={[styles.fitnessCard, { shadowColor: theme.shadow }]}
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

        {/* Health Cards */}
        {healthDataSource !== 'none' && ouraData && (
          <>
            <View style={styles.ouraScoresContainer}>
              <ScoreCard 
                title="Activity" 
                score={ouraData.activityScore} 
                icon="fitness" 
                gradient={['#EC4899', '#F472B6']}
                theme={theme}
              />
              <ScoreCard 
                title="Sleep" 
                score={ouraData.sleepScore} 
                icon="moon" 
                gradient={['#8B5CF6', '#A78BFA']}
                theme={theme}
              />
              <ScoreCard 
                title="Readiness" 
                score={ouraData.readinessScore} 
                icon="heart" 
                gradient={['#10B981', '#34D399']}
                theme={theme}
              />
            </View>

            {/* Detailed Sleep Metrics */}
            {ouraData.sleepHours > 0 && (
              <LinearGradient
                colors={theme.gradients.card}
                style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Sleep Analysis
                  </Text>
                  <Text style={[styles.sleepTimeLabel, { color: theme.textSecondary }]}>Last Night</Text>
                </View>
                <View style={styles.sleepMetricsGrid}>
                  <MetricItem
                    label="Total Sleep"
                    value={`${ouraData.sleepHours.toFixed(1)}h`}
                    icon="moon"
                    theme={theme}
                  />
                  <MetricItem
                    label="Deep Sleep"
                    value={`${Math.round(ouraData.deepSleep / 60)}min`}
                    icon="battery-charging"
                    theme={theme}
                  />
                  <MetricItem
                    label="REM Sleep"
                    value={`${Math.round(ouraData.remSleep / 60)}min`}
                    icon="sparkles"
                    theme={theme}
                  />
                  <MetricItem
                    label="Efficiency"
                    value={`${ouraData.sleepEfficiency}%`}
                    icon="checkmark-circle"
                    theme={theme}
                  />
                </View>
              </LinearGradient>
            )}

            {/* Detailed Readiness Metrics */}
            <LinearGradient
              colors={theme.gradients.card}
              style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
            >
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 16 }]}>
                Recovery Metrics
              </Text>
              <View style={styles.sleepMetricsGrid}>
                <MetricItem
                  label="HRV Balance"
                  value={ouraData.hrvBalance > 0 ? `${Math.round(ouraData.hrvBalance)}` : '---'}
                  icon="pulse"
                  theme={theme}
                />
                <MetricItem
                  label="Recovery"
                  value={ouraData.recoveryIndex > 0 ? `${ouraData.recoveryIndex}%` : '---'}
                  icon="trending-up"
                  theme={theme}
                />
                <MetricItem
                  label="Temp Var"
                  value={ouraData.temperatureDeviation !== 0 ? `${ouraData.temperatureDeviation.toFixed(1)}°C` : '---'}
                  icon="thermometer"
                  theme={theme}
                />
                <MetricItem
                  label="Resting HR"
                  value={ouraData.restingHR > 0 ? `${Math.round(ouraData.restingHR)}` : '---'}
                  icon="heart"
                  theme={theme}
                />
              </View>
            </LinearGradient>
          </>
        )}

        {/* Steps Progress */}
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {healthDataSource !== 'none' ? "Today's Activity" : "Activity (Demo)"}
              </Text>
              {healthDataSource === 'oura' && (
                <Text style={[styles.sleepTimeLabel, { color: theme.textSecondary, marginTop: 2 }]}>
                  Activity Day: 4 AM - 4 AM
                </Text>
              )}
              {healthDataSource === 'apple-health' && (
                <Text style={[styles.sleepTimeLabel, { color: theme.textSecondary, marginTop: 2 }]}>
                  Synced with Apple Health
                </Text>
              )}
            </View>
            {isLoadingOura && <ActivityIndicator size="small" color={theme.primary} />}
            {healthDataSource === 'none' && (
              <TouchableOpacity onPress={handleConnectHealth}>
                <Text style={[styles.demoLabel, { color: theme.primary }]}>Connect Health 🍎</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.circularProgress}>
              <Text style={[styles.stepsCount, { color: theme.text }]}>
                {todaySteps > 0 ? todaySteps.toLocaleString() : '---'}
              </Text>
              {todaySteps > 0 && (
                <Text style={[styles.stepsGoal, { color: theme.textSecondary }]}>
                  / {todayGoal.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatItem 
              icon="flame" 
              label="kcal" 
              value={ouraData?.activeCalories ? Math.round(ouraData.activeCalories).toString() : '---'} 
              theme={theme}
            />
            <StatItem 
              icon="location-outline" 
              label="km" 
              value={ouraData?.distance ? (ouraData.distance / 1000).toFixed(2) : '---'} 
              theme={theme}
            />
            <StatItem 
              icon="heart-outline" 
              label="bpm" 
              value={ouraData?.restingHR ? Math.round(ouraData.restingHR).toString() : '---'} 
              theme={theme}
            />
          </View>
        </LinearGradient>

        {/* Your Progress */}
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Your Progress</Text>
            <TouchableOpacity style={[styles.dropdown, { backgroundColor: theme.input }]}>
              <Text style={[styles.dropdownText, { color: theme.text }]}>This Week</Text>
              <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekProgress}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, index) => (
              <View key={day} style={styles.dayItem}>
                <View style={[
                  styles.dayCircle,
                  index === 6 && { backgroundColor: theme.primary },
                  index !== 6 && { backgroundColor: theme.input },
                ]}>
                  <Text style={[
                    styles.dayNumber,
                    index === 6 && { color: '#FFFFFF' },
                    index !== 6 && { color: theme.textSecondary },
                  ]}>
                    {16 + index}
                  </Text>
                </View>
                <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                  {day === 'Today' ? 'Today' : day.slice(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            icon="fitness" 
            label="Start Workout" 
            theme={theme}
            gradient={theme.gradients.primary}
          />
          <ActionButton 
            icon="people" 
            label="My Groups" 
            theme={theme}
            gradient={['#EC4899', '#F472B6']}
          />
          <ActionButton 
            icon="bar-chart" 
            label="View Report" 
            theme={theme}
            gradient={['#10B981', '#34D399']}
          />
          <ActionButton 
            icon="trophy" 
            label="Challenges" 
            theme={theme}
            gradient={['#F59E0B', '#FBBF24']}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function ScoreCard({ title, score, icon, gradient, theme }: { title: string; score: number; icon: any; gradient: readonly [string, string, ...string[]], theme: any }) {
  return (
    <LinearGradient 
      colors={gradient as any} 
      style={[styles.scoreCard, { shadowColor: theme.shadow }]}
    >
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      <Text style={styles.scoreValue}>{score > 0 ? score : '---'}</Text>
      <Text style={styles.scoreLabel}>{title}</Text>
    </LinearGradient>
  );
}

function StatItem({ icon, label, value, theme }: any) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function MetricItem({ icon, label, value, theme }: any) {
  return (
    <View style={styles.metricItem}>
      <View style={[styles.metricIconContainer, { backgroundColor: theme.input }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, theme, gradient }: any) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <LinearGradient colors={gradient} style={[styles.actionGradient, { shadowColor: theme.shadow }]}>
        <Ionicons name={icon} size={32} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ouraIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ouraRing: {
    fontSize: 20,
  },
  connectHealthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectHealthText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  ouraScoresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  fitnessCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fitnessCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fitnessCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fitnessAgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  fitnessAge: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 72,
  },
  fitnessAgeLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
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
    fontWeight: '500',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circularProgress: {
    alignItems: 'center',
  },
  stepsCount: {
    fontSize: 42,
    fontWeight: '800',
  },
  stepsGoal: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
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
    aspectRatio: 1.2,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sleepMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    width: (width - 100) / 2,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  sleepTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
