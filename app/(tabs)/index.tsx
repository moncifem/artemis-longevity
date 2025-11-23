import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { estimateActivityScore, estimateReadinessScore, estimateSleepScore, getHealthData, HealthDataSource } from '@/services/health-data-service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface HealthData {
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
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthDataSource, setHealthDataSource] = useState<HealthDataSource>('none');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  
  const pollingIntervalRef = useRef<any>(null);

  // Load data on mount and when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadAllData();
      setupPolling();
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }, [])
  );

  const setupPolling = () => {
    // Poll health data every 2 minutes
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      loadHealthData();
    }, 120000); // 2 minutes
  };

  const loadAllData = async () => {
    await Promise.all([
      loadUserData(),
      loadHealthData(),
    ]);
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
      setIsLoading(true);
      
      const { data, source } = await getHealthData();
      setHealthDataSource(source);
      
      if (data) {
        // If using Apple Health, estimate scores
        if (source === 'apple-health') {
          const activityScore = estimateActivityScore(data.steps || 0, data.activeCalories || 0);
          const sleepScore = estimateSleepScore(data.sleepHours || 0, data.sleepEfficiency || 0);
          const readinessScore = estimateReadinessScore(
            data.restingHR || 0,
            data.hrvBalance || 0,
            sleepScore
          );
          
          setHealthData({
            ...data,
            activityScore,
            sleepScore,
            readinessScore,
          } as HealthData);
        } else {
          setHealthData(data as HealthData);
        }
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleConnectHealth = () => {
    Alert.alert(
      'Connect Health Data',
      'Choose your preferred health data source',
      [
        {
          text: 'Apple Health',
          onPress: () => router.push('/apple-health-connect' as any),
        },
        {
          text: 'Oura Ring',
          onPress: () => router.push('/oura-connect' as any),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'workout':
        Alert.alert('Start Workout', 'Choose your workout type:', [
          { text: 'Strength Training', onPress: () => Alert.alert('Coming Soon', 'Strength training tracker coming soon!') },
          { text: 'Cardio', onPress: () => Alert.alert('Coming Soon', 'Cardio tracker coming soon!') },
          { text: 'Flexibility', onPress: () => Alert.alert('Coming Soon', 'Flexibility tracker coming soon!') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
      case 'groups':
        router.push('/groups' as any);
        break;
      case 'report':
        router.push('/report' as any);
        break;
      case 'challenges':
        Alert.alert('Challenges', 'Join fitness challenges to compete with friends!', [
          { text: 'View Challenges', onPress: () => Alert.alert('Coming Soon', 'Challenges feature coming soon!') },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
    }
  };

  const showMetricDetails = (metric: any) => {
    setSelectedMetric(metric);
    setDetailsModalVisible(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#EC4899';
    return '#EF4444';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return 'Excellent! Keep up the great work.';
    if (score >= 70) return 'Good performance. Room for improvement.';
    if (score >= 50) return 'Fair. Focus on recovery and consistency.';
    return 'Needs attention. Prioritize rest and recovery.';
  };

  const getTodayDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;
  };

  // Calculate goals and progress
  const todaySteps = healthData?.steps || 0;
  const stepsGoal = 10000;
  const stepProgress = Math.min((todaySteps / stepsGoal) * 100, 100);
  
  const caloriesGoal = 500;
  const caloriesProgress = healthData?.activeCalories ? Math.min((healthData.activeCalories / caloriesGoal) * 100, 100) : 0;

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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getTodayDate()}
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              Hello, {userProfile?.name || 'User'} 👋
            </Text>
          </View>
          <View style={styles.headerRight}>
            {healthDataSource === 'oura' && (
              <TouchableOpacity 
                style={[styles.healthBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                onPress={() => Alert.alert('Oura Ring', 'Connected and syncing data', [
                  { text: 'Disconnect', onPress: async () => {
                    await AsyncStorage.removeItem('ouraApiToken');
                    loadHealthData();
                  }},
                  { text: 'OK' }
                ])}
              >
                <Text style={styles.healthBadgeIcon}>💍</Text>
              </TouchableOpacity>
            )}
            {healthDataSource === 'apple-health' && (
              <TouchableOpacity 
                style={[styles.healthBadge, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}
                onPress={() => Alert.alert('Apple Health', 'Connected and syncing data', [
                  { text: 'Disconnect', onPress: async () => {
                    await AsyncStorage.removeItem('appleHealthConnected');
                    loadHealthData();
                  }},
                  { text: 'OK' }
                ])}
              >
                <Text style={styles.healthBadgeIcon}>🍎</Text>
              </TouchableOpacity>
            )}
            {healthDataSource === 'none' && (
              <TouchableOpacity 
                style={[styles.connectButton, { shadowColor: theme.shadow }]}
                onPress={handleConnectHealth}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  style={styles.connectButtonGradient}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.notificationButton, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
              onPress={() => Alert.alert('Notifications', 'No new notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fitness Age Card */}
        {assessmentResults && (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => showMetricDetails({
              title: 'Your Fitness Age',
              icon: 'trophy',
              value: assessmentResults.fitnessAge,
              actualAge: assessmentResults.actualAge,
              description: assessmentResults.fitnessAge < assessmentResults.actualAge 
                ? `Great! Your fitness age is ${assessmentResults.actualAge - assessmentResults.fitnessAge} years younger than your actual age.`
                : assessmentResults.fitnessAge === assessmentResults.actualAge
                ? 'Your fitness age matches your actual age. Keep working to improve it!'
                : `Your fitness age is ${assessmentResults.fitnessAge - assessmentResults.actualAge} years older. Focus on consistent exercise and recovery.`,
            })}
          >
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
                    {assessmentResults.actualAge - assessmentResults.fitnessAge > 0 ? '−' : '+'}
                    {Math.abs(assessmentResults.actualAge - assessmentResults.fitnessAge)} years
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Health Score Cards */}
        {healthDataSource !== 'none' && healthData && (
          <>
            <View style={styles.scoresContainer}>
              <ScoreCard 
                title="Activity" 
                score={healthData.activityScore} 
                icon="fitness" 
                gradient={['#EC4899', '#F472B6']}
                theme={theme}
                onPress={() => showMetricDetails({
                  title: 'Activity Score',
                  icon: 'fitness',
                  score: healthData.activityScore,
                  description: getScoreMessage(healthData.activityScore),
                  details: [
                    { label: 'Steps', value: `${healthData.steps.toLocaleString()}`, icon: 'footsteps' },
                    { label: 'Calories', value: `${Math.round(healthData.activeCalories)} kcal`, icon: 'flame' },
                    { label: 'Distance', value: `${(healthData.distance / 1000).toFixed(2)} km`, icon: 'location' },
                  ]
                })}
              />
              <ScoreCard 
                title="Sleep" 
                score={healthData.sleepScore} 
                icon="moon" 
                gradient={['#8B5CF6', '#A78BFA']}
                theme={theme}
                onPress={() => showMetricDetails({
                  title: 'Sleep Score',
                  icon: 'moon',
                  score: healthData.sleepScore,
                  description: getScoreMessage(healthData.sleepScore),
                  details: [
                    { label: 'Total Sleep', value: `${healthData.sleepHours.toFixed(1)}h`, icon: 'time' },
                    { label: 'Deep Sleep', value: `${Math.round(healthData.deepSleep / 60)}min`, icon: 'battery-charging' },
                    { label: 'REM Sleep', value: `${Math.round(healthData.remSleep / 60)}min`, icon: 'sparkles' },
                    { label: 'Efficiency', value: `${healthData.sleepEfficiency}%`, icon: 'checkmark-circle' },
                  ]
                })}
              />
              <ScoreCard 
                title="Readiness" 
                score={healthData.readinessScore} 
                icon="heart" 
                gradient={['#10B981', '#34D399']}
                theme={theme}
                onPress={() => showMetricDetails({
                  title: 'Readiness Score',
                  icon: 'heart',
                  score: healthData.readinessScore,
                  description: getScoreMessage(healthData.readinessScore),
                  details: [
                    { label: 'Resting HR', value: `${Math.round(healthData.restingHR)} bpm`, icon: 'heart' },
                    { label: 'HRV Balance', value: `${Math.round(healthData.hrvBalance)}`, icon: 'pulse' },
                    { label: 'Recovery', value: `${healthData.recoveryIndex}%`, icon: 'trending-up' },
                  ]
                })}
              />
            </View>

            {/* Today's Activity Card */}
            <LinearGradient
              colors={theme.gradients.card}
              style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Activity</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    {healthDataSource === 'apple-health' ? 'Apple Health' : healthDataSource === 'oura' ? 'Oura Ring' : 'Demo Mode'}
                  </Text>
                </View>
                {isLoading && <ActivityIndicator size="small" color={theme.primary} />}
              </View>

              {/* Progress Rings */}
              <View style={styles.progressRings}>
                <View style={styles.progressRingContainer}>
                  <View style={styles.progressRing}>
                    <Text style={[styles.progressValue, { color: theme.text }]}>
                      {todaySteps.toLocaleString()}
                    </Text>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>steps</Text>
                  </View>
                  <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { backgroundColor: theme.input }]}>
                      <LinearGradient
                        colors={['#EC4899', '#F472B6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${stepProgress}%` }]}
                      />
                    </View>
                    <Text style={[styles.progressGoal, { color: theme.textSecondary }]}>
                      Goal: {stepsGoal.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <StatItem 
                  icon="flame" 
                  label="Active Calories" 
                  value={`${Math.round(healthData.activeCalories || 0)}`}
                  unit="kcal"
                  theme={theme}
                />
                <StatItem 
                  icon="location-outline" 
                  label="Distance" 
                  value={(healthData.distance / 1000).toFixed(2)}
                  unit="km"
                  theme={theme}
                />
                <StatItem 
                  icon="heart-outline" 
                  label="Resting HR" 
                  value={Math.round(healthData.restingHR || 0).toString()}
                  unit="bpm"
                  theme={theme}
                />
                <StatItem 
                  icon="time-outline" 
                  label="Sleep" 
                  value={healthData.sleepHours.toFixed(1)}
                  unit="hours"
                  theme={theme}
                />
              </View>
            </LinearGradient>
          </>
        )}

        {/* No Data State */}
        {healthDataSource === 'none' && (
          <LinearGradient
            colors={theme.gradients.card}
            style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
          >
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Health Data</Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                Connect Apple Health or Oura Ring to start tracking your fitness journey
              </Text>
              <TouchableOpacity 
                style={[styles.emptyButton, { shadowColor: theme.shadow }]}
                onPress={handleConnectHealth}
              >
                <LinearGradient
                  colors={theme.gradients.button}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Connect Health Data</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            icon="fitness" 
            label="Start Workout" 
            theme={theme}
            gradient={theme.gradients.primary}
            onPress={() => handleQuickAction('workout')}
          />
          <ActionButton 
            icon="people" 
            label="My Groups" 
            theme={theme}
            gradient={['#EC4899', '#F472B6']}
            onPress={() => handleQuickAction('groups')}
          />
          <ActionButton 
            icon="bar-chart" 
            label="View Report" 
            theme={theme}
            gradient={['#10B981', '#34D399']}
            onPress={() => handleQuickAction('report')}
          />
          <ActionButton 
            icon="trophy" 
            label="Challenges" 
            theme={theme}
            gradient={['#F59E0B', '#FBBF24']}
            onPress={() => handleQuickAction('challenges')}
          />
        </View>
      </ScrollView>

      {/* Metric Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={theme.gradients.background}
            style={[styles.modalContent, { shadowColor: theme.shadow }]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                {selectedMetric?.icon && (
                  <View style={[styles.modalIcon, { backgroundColor: theme.input }]}>
                    <Ionicons name={selectedMetric.icon} size={28} color={theme.primary} />
                  </View>
                )}
                <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedMetric?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedMetric?.score !== undefined && (
              <View style={styles.modalScore}>
                <Text style={[styles.modalScoreValue, { color: getScoreColor(selectedMetric.score) }]}>
                  {selectedMetric.score}
                </Text>
                <Text style={[styles.modalScoreLabel, { color: theme.textSecondary }]}>Score</Text>
              </View>
            )}

            {selectedMetric?.actualAge !== undefined && (
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatValue, { color: theme.text }]}>{selectedMetric.value}</Text>
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>Fitness Age</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={[styles.modalStatValue, { color: theme.text }]}>{selectedMetric.actualAge}</Text>
                  <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>Actual Age</Text>
                </View>
              </View>
            )}

            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              {selectedMetric?.description}
            </Text>

            {selectedMetric?.details && (
              <View style={styles.modalDetails}>
                {selectedMetric.details.map((detail: any, index: number) => (
                  <View key={index} style={[styles.modalDetailItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={[styles.modalDetailIcon, { backgroundColor: theme.input }]}>
                      <Ionicons name={detail.icon} size={20} color={theme.primary} />
                    </View>
                    <View style={styles.modalDetailContent}>
                      <Text style={[styles.modalDetailLabel, { color: theme.textSecondary }]}>{detail.label}</Text>
                      <Text style={[styles.modalDetailValue, { color: theme.text }]}>{detail.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.modalButton, { shadowColor: theme.shadow }]}
              onPress={() => setDetailsModalVisible(false)}
            >
              <LinearGradient
                colors={theme.gradients.button}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function ScoreCard({ title, score, icon, gradient, theme, onPress }: any) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <LinearGradient 
        colors={gradient} 
        style={[styles.scoreCard, { shadowColor: theme.shadow }]}
      >
        <Ionicons name={icon} size={24} color="#FFFFFF" />
        <Text style={styles.scoreValue}>{score > 0 ? score : '---'}</Text>
        <Text style={styles.scoreLabel}>{title}</Text>
        {score > 0 && (
          <View style={styles.scoreIndicator}>
            <View style={[styles.scoreIndicatorDot, { backgroundColor: getScoreColor(score) }]} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function StatItem({ icon, label, value, unit, theme }: any) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: theme.input }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {value} <Text style={[styles.statUnit, { color: theme.textSecondary }]}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

function ActionButton({ icon, label, theme, gradient, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient 
        colors={gradient} 
        style={[styles.actionGradient, { shadowColor: theme.shadow }]}
      >
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  healthBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthBadgeIcon: {
    fontSize: 20,
  },
  connectButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoresContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
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
  scoreIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  scoreIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressRings: {
    marginBottom: 24,
  },
  progressRingContainer: {
    alignItems: 'center',
  },
  progressRing: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressValue: {
    fontSize: 42,
    fontWeight: '800',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  progressBarWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressGoal: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 96) / 2,
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  modalScore: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalScoreValue: {
    fontSize: 64,
    fontWeight: '800',
  },
  modalScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  modalStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalDetails: {
    gap: 12,
    marginBottom: 24,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  modalDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDetailContent: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  modalButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
