import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { estimateActivityScore, estimateReadinessScore, estimateSleepScore, getHealthData, HealthDataSource } from '@/services/health-data-service';
import { getDailyActivity, getDailyReadiness, getDailySleep, getDateString, getDateTimeString, getHeartRate } from '@/services/oura-api';
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
  const colors = Colors[colorScheme ?? 'light'];
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

  const setupPolling = async () => {
    const ouraToken = await AsyncStorage.getItem('ouraApiToken');
    if (!ouraToken) return;

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

  const loadOuraData = async () => {
    try {
      // Check if Oura is connected
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (!ouraToken) {
        setIsOuraConnected(false);
        return;
      }

      setIsOuraConnected(true);
      setIsLoadingOura(true);

      // Get date range - Oura Activity Day runs 4 AM to 4 AM
      // To ensure we get the current activity day, fetch last 3 days
      const today = getDateString(0);
      const threeDaysAgo = getDateString(3);

      console.log('📅 Fetching Oura data from', threeDaysAgo, 'to', today);

      // Fetch activity, sleep and readiness with wider range to ensure we get current data
      const [activityData, sleepData, readinessData] = await Promise.all([
        getDailyActivity(threeDaysAgo, today).catch(() => []),
        getDailySleep(threeDaysAgo, today).catch(() => []),
        getDailyReadiness(threeDaysAgo, today).catch(() => []),
      ]);

      console.log('📦 Received data counts:', {
        activities: activityData.length,
        sleeps: sleepData.length,
        readiness: readinessData.length,
      });

      // Get the MOST RECENT data (last item in array)
      const recentActivity = activityData.length > 0 ? activityData[activityData.length - 1] : null;
      const recentSleep = sleepData.length > 0 ? sleepData[sleepData.length - 1] : null;
      const recentReadiness = readinessData.length > 0 ? readinessData[readinessData.length - 1] : null;

      console.log('📊 Oura Data Loaded:', {
        activityDay: recentActivity?.day,
        steps: recentActivity ? `${recentActivity.steps} steps (today 00:00-now)` : 'none',
        sleepDay: recentSleep?.day,
        sleepScore: recentSleep ? `Score: ${recentSleep.score} (last night)` : 'none',
        readinessDay: recentReadiness?.day,
        readinessScore: recentReadiness ? `Score: ${recentReadiness.score}` : 'none',
      });

      // Debug: Log full data objects to understand structure
      if (recentActivity) {
        console.log('🏃 Full Activity Data:', JSON.stringify(recentActivity, null, 2));
      }
      if (recentSleep) {
        console.log('🛏️ Full Sleep Data:', JSON.stringify(recentSleep, null, 2));
      }
      if (recentReadiness) {
        console.log('💪 Full Readiness Data:', JSON.stringify(recentReadiness, null, 2));
      }

      setOuraData({
        // Activity metrics
        steps: recentActivity?.steps || 0,
        activeCalories: recentActivity?.active_calories || 0,
        totalCalories: recentActivity?.total_calories || 0,
        distance: recentActivity?.equivalent_walking_distance || 0,
        activityScore: recentActivity?.score || 0,
        inactivityAlerts: recentActivity?.inactivity_alerts || 0,
        
        // Sleep metrics (durations are in seconds at root level, contributors are scores 0-100)
        sleepScore: recentSleep?.score || 0,
        sleepHours: recentSleep?.total_sleep_duration ? recentSleep.total_sleep_duration / 3600 : 0,
        deepSleep: recentSleep?.deep_sleep_duration || 0,
        remSleep: recentSleep?.rem_sleep_duration || 0,
        lightSleep: recentSleep?.light_sleep_duration || 0,
        sleepEfficiency: recentSleep?.efficiency || recentSleep?.contributors?.efficiency || 0,
        
        // Readiness metrics
        readinessScore: recentReadiness?.score || 0,
        restingHR: recentReadiness?.contributors?.resting_heart_rate || 0,
        hrvBalance: recentReadiness?.contributors?.hrv_balance || 0,
        recoveryIndex: recentReadiness?.contributors?.recovery_index || 0,
        temperatureDeviation: recentReadiness?.temperature_deviation || 0,
      });

      // Also load initial heart rate
      await loadHeartRate();

    } catch (error) {
      console.error('Error loading Oura data:', error);
      setIsOuraConnected(false);
    } finally {
      setIsLoadingOura(false);
    }
  };

  const loadStepsAndCalories = async () => {
    try {
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (!ouraToken) return;

      // Get current activity day (4 AM to 4 AM cycle)
      // Fetch last 3 days to ensure we capture the current activity period
      const today = getDateString(0);
      const threeDaysAgo = getDateString(3);
      const activityData = await getDailyActivity(threeDaysAgo, today).catch(() => []);
      
      // Get the MOST RECENT activity data
      const recentActivity = activityData.length > 0 ? activityData[activityData.length - 1] : null;

      console.log('🔄 Steps Update:', {
        totalResults: activityData.length,
        day: recentActivity?.day,
        steps: recentActivity?.steps,
        calories: recentActivity?.active_calories,
        timestamp: recentActivity?.timestamp,
      });

      if (recentActivity) {
        setOuraData(prev => prev ? {
          ...prev,
          steps: recentActivity.steps || prev.steps,
          activeCalories: recentActivity.active_calories || prev.activeCalories,
          totalCalories: recentActivity.total_calories || prev.totalCalories,
          distance: recentActivity.equivalent_walking_distance || prev.distance,
          activityScore: recentActivity.score || prev.activityScore,
          inactivityAlerts: recentActivity.inactivity_alerts || prev.inactivityAlerts,
        } : null);
      }
    } catch (error) {
      console.error('Error updating steps and calories:', error);
    }
  };

  const loadHeartRate = async () => {
    try {
      const ouraToken = await AsyncStorage.getItem('ouraApiToken');
      if (!ouraToken) return;

      // Get heart rate data from the last hour
      const endTime = getDateTimeString(0);
      const startTime = getDateTimeString(0);
      const startDate = new Date(startTime);
      startDate.setHours(startDate.getHours() - 1);

      const heartRateData = await getHeartRate(
        startDate.toISOString(),
        endTime
      ).catch(() => []);

      if (heartRateData && heartRateData.length > 0) {
        // Get the most recent heart rate measurement
        const latestHR = heartRateData[heartRateData.length - 1];
        
        setOuraData(prev => prev ? {
          ...prev,
          restingHR: latestHR.bpm || prev.restingHR,
        } : null);
      }
    } catch (error) {
      console.error('Error updating heart rate:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(), 
      loadHealthData(), 
      healthDataSource === 'oura' ? loadStepsAndCalories() : Promise.resolve(),
      healthDataSource === 'oura' ? loadHeartRate() : Promise.resolve()
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.icon }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {userProfile?.name || 'User'} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            {healthDataSource === 'oura' && (
              <View style={styles.ouraIndicator}>
                <Text style={styles.ouraRing}>💍</Text>
              </View>
            )}
            {healthDataSource === 'apple-health' && (
              <View style={styles.ouraIndicator}>
                <Text style={styles.ouraRing}>🍎</Text>
              </View>
            )}
            {healthDataSource === 'none' && (
              <TouchableOpacity 
                style={[styles.connectHealthButton, { backgroundColor: colors.primary }]}
                onPress={handleConnectHealth}
              >
                <Text style={styles.connectHealthText}>Connect</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
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

        {/* Health Cards */}
        {healthDataSource !== 'none' && ouraData && (
          <>
            <View style={styles.ouraScoresContainer}>
              <ScoreCard 
                title="Activity" 
                score={ouraData.activityScore} 
                icon="fitness" 
                gradient={['#EC4899', '#F472B6']}
              />
              <ScoreCard 
                title="Sleep" 
                score={ouraData.sleepScore} 
                icon="moon" 
                gradient={['#8B5CF6', '#A78BFA']}
              />
              <ScoreCard 
                title="Readiness" 
                score={ouraData.readinessScore} 
                icon="heart" 
                gradient={['#10B981', '#34D399']}
              />
            </View>

            {/* Detailed Sleep Metrics */}
            {ouraData.sleepHours > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Sleep Analysis
                  </Text>
                  <Text style={[styles.sleepTimeLabel, { color: colors.icon }]}>Last Night</Text>
                </View>
                <View style={styles.sleepMetricsGrid}>
                  <MetricItem
                    label="Total Sleep"
                    value={`${ouraData.sleepHours.toFixed(1)}h`}
                    icon="moon"
                    colors={colors}
                  />
                  <MetricItem
                    label="Deep Sleep"
                    value={`${Math.round(ouraData.deepSleep / 60)}min`}
                    icon="battery-charging"
                    colors={colors}
                  />
                  <MetricItem
                    label="REM Sleep"
                    value={`${Math.round(ouraData.remSleep / 60)}min`}
                    icon="sparkles"
                    colors={colors}
                  />
                  <MetricItem
                    label="Efficiency"
                    value={`${ouraData.sleepEfficiency}%`}
                    icon="checkmark-circle"
                    colors={colors}
                  />
                </View>
              </View>
            )}

            {/* Detailed Readiness Metrics */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>
                Recovery Metrics
              </Text>
              <View style={styles.sleepMetricsGrid}>
                <MetricItem
                  label="HRV Balance"
                  value={ouraData.hrvBalance > 0 ? `${ouraData.hrvBalance}` : '---'}
                  icon="pulse"
                  colors={colors}
                />
                <MetricItem
                  label="Recovery"
                  value={ouraData.recoveryIndex > 0 ? `${ouraData.recoveryIndex}%` : '---'}
                  icon="trending-up"
                  colors={colors}
                />
                <MetricItem
                  label="Temp Var"
                  value={ouraData.temperatureDeviation !== 0 ? `${ouraData.temperatureDeviation.toFixed(1)}°C` : '---'}
                  icon="thermometer"
                  colors={colors}
                />
                <MetricItem
                  label="Resting HR"
                  value={ouraData.restingHR > 0 ? `${Math.round(ouraData.restingHR)}` : '---'}
                  icon="heart"
                  colors={colors}
                />
              </View>
            </View>
          </>
        )}

        {/* Steps Progress */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {healthDataSource !== 'none' ? "Today's Activity" : "Activity (Demo)"}
              </Text>
              {healthDataSource === 'oura' && (
                <Text style={[styles.sleepTimeLabel, { color: colors.icon, marginTop: 2 }]}>
                  Activity Day: 4 AM - 4 AM
                </Text>
              )}
              {healthDataSource === 'apple-health' && (
                <Text style={[styles.sleepTimeLabel, { color: colors.icon, marginTop: 2 }]}>
                  Synced with Apple Health
                </Text>
              )}
            </View>
            {isLoadingOura && <ActivityIndicator size="small" color={colors.primary} />}
            {healthDataSource === 'none' && (
              <TouchableOpacity onPress={handleConnectHealth}>
                <Text style={[styles.demoLabel, { color: colors.primary }]}>Connect Health 🍎</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.circularProgress}>
              <Text style={[styles.stepsCount, { color: colors.text }]}>
                {todaySteps > 0 ? todaySteps.toLocaleString() : '---'}
              </Text>
              {todaySteps > 0 && (
                <Text style={[styles.stepsGoal, { color: colors.icon }]}>
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
              colors={colors} 
            />
            <StatItem 
              icon="location-outline" 
              label="km" 
              value={ouraData?.distance ? (ouraData.distance / 1000).toFixed(2) : '---'} 
              colors={colors} 
            />
            <StatItem 
              icon="heart-outline" 
              label="bpm" 
              value={ouraData?.restingHR ? Math.round(ouraData.restingHR).toString() : '---'} 
              colors={colors} 
            />
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

function ScoreCard({ title, score, icon, gradient }: { title: string; score: number; icon: any; gradient: readonly [string, string, ...string[]] }) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <LinearGradient colors={gradient as any} style={styles.scoreCard}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      <Text style={styles.scoreValue}>{score > 0 ? score : '---'}</Text>
      <Text style={styles.scoreLabel}>{title}</Text>
    </LinearGradient>
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

function MetricItem({ icon, label, value, colors }: any) {
  return (
    <View style={styles.metricItem}>
      <View style={[styles.metricIconContainer, { backgroundColor: colors.border }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.icon }]}>{label}</Text>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ouraIndicator: {
    backgroundColor: '#D1FAE5',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ouraRing: {
    fontSize: 24,
  },
  connectHealthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectHealthText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreValue: {
    fontSize: 32,
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
  sleepMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    width: (width - 96) / 2,
    alignItems: 'center',
    gap: 8,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sleepTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
