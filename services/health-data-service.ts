import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

export type HealthDataSource = 'apple-health' | 'oura' | 'none';

/**
 * Get the active health data source
 */
export const getHealthDataSource = async (): Promise<HealthDataSource> => {
  // Check Apple Health first (iOS only)
  if (Platform.OS === 'ios') {
    const appleHealthConnected = await AsyncStorage.getItem('appleHealthConnected');
    if (appleHealthConnected === 'true') {
      return 'apple-health';
    }
  }

  // Check Oura
  const ouraToken = await AsyncStorage.getItem('ouraApiToken');
  if (ouraToken) {
    return 'oura';
  }

  return 'none';
};

/**
 * Load health data from Apple Health
 */
const loadAppleHealthData = async (): Promise<Partial<HealthData> | null> => {
  try {
    const { getAllHealthData } = await import('./apple-health-api');
    const data = await getAllHealthData();
    
    if (!data) return null;

    return {
      steps: data.steps || 0,
      activeCalories: data.activeCalories || 0,
      totalCalories: data.totalCalories || 0,
      distance: data.distance || 0,
      sleepHours: data.sleepHours || 0,
      deepSleep: data.deepSleep || 0,
      remSleep: data.remSleep || 0,
      lightSleep: data.lightSleep || 0,
      sleepEfficiency: data.sleepEfficiency || 0,
      restingHR: data.restingHR || 0,
      hrvBalance: data.hrv || 0,
      // Apple Health doesn't provide these directly
      activityScore: 0,
      sleepScore: 0,
      readinessScore: 0,
      recoveryIndex: 0,
      temperatureDeviation: 0,
      inactivityAlerts: 0,
    };
  } catch (error) {
    console.error('Error loading Apple Health data:', error);
    return null;
  }
};

/**
 * Load health data from Oura
 */
const loadOuraData = async (): Promise<Partial<HealthData> | null> => {
  try {
    const { getDailyActivity, getDailySleep, getDailyReadiness, getDateString } = await import('./oura-api');
    
    const today = getDateString(0);
    const threeDaysAgo = getDateString(3);

    const [activityData, sleepData, readinessData] = await Promise.all([
      getDailyActivity(threeDaysAgo, today).catch(() => []),
      getDailySleep(threeDaysAgo, today).catch(() => []),
      getDailyReadiness(threeDaysAgo, today).catch(() => []),
    ]);

    const recentActivity = activityData.length > 0 ? activityData[activityData.length - 1] : null;
    const recentSleep = sleepData.length > 0 ? sleepData[sleepData.length - 1] : null;
    const recentReadiness = readinessData.length > 0 ? readinessData[readinessData.length - 1] : null;

    return {
      steps: recentActivity?.steps || 0,
      activeCalories: recentActivity?.active_calories || 0,
      totalCalories: recentActivity?.total_calories || 0,
      distance: recentActivity?.equivalent_walking_distance || 0,
      activityScore: recentActivity?.score || 0,
      inactivityAlerts: recentActivity?.inactivity_alerts || 0,
      
      sleepScore: recentSleep?.score || 0,
      sleepHours: recentSleep?.total_sleep_duration ? recentSleep.total_sleep_duration / 3600 : 0,
      deepSleep: recentSleep?.deep_sleep_duration || 0,
      remSleep: recentSleep?.rem_sleep_duration || 0,
      lightSleep: recentSleep?.light_sleep_duration || 0,
      sleepEfficiency: recentSleep?.efficiency || recentSleep?.contributors?.efficiency || 0,
      
      readinessScore: recentReadiness?.score || 0,
      restingHR: recentReadiness?.contributors?.resting_heart_rate || 0,
      hrvBalance: recentReadiness?.contributors?.hrv_balance || 0,
      recoveryIndex: recentReadiness?.contributors?.recovery_index || 0,
      temperatureDeviation: recentReadiness?.temperature_deviation || 0,
    };
  } catch (error) {
    console.error('Error loading Oura data:', error);
    return null;
  }
};

/**
 * Get health data from the active source
 */
export const getHealthData = async (): Promise<{ data: Partial<HealthData> | null; source: HealthDataSource }> => {
  const source = await getHealthDataSource();
  
  let data: Partial<HealthData> | null = null;
  
  switch (source) {
    case 'apple-health':
      data = await loadAppleHealthData();
      break;
    case 'oura':
      data = await loadOuraData();
      break;
    default:
      data = null;
  }
  
  return { data, source };
};

/**
 * Calculate activity score from Apple Health data
 * (Apple Health doesn't provide scores, so we estimate)
 */
export const estimateActivityScore = (steps: number, activeCalories: number): number => {
  // Simple estimation: based on steps and calories
  const stepScore = Math.min((steps / 10000) * 50, 50); // Max 50 points for 10k steps
  const calorieScore = Math.min((activeCalories / 500) * 50, 50); // Max 50 points for 500 cal
  return Math.round(stepScore + calorieScore);
};

/**
 * Calculate sleep score from Apple Health data
 */
export const estimateSleepScore = (sleepHours: number, sleepEfficiency: number): number => {
  // Simple estimation
  const hoursScore = Math.min((sleepHours / 8) * 50, 50); // Max 50 for 8 hours
  const efficiencyScore = (sleepEfficiency / 100) * 50; // Max 50 for 100% efficiency
  return Math.round(hoursScore + efficiencyScore);
};

/**
 * Calculate readiness score from Apple Health data
 */
export const estimateReadinessScore = (
  restingHR: number,
  hrvBalance: number,
  sleepScore: number
): number => {
  // Simple estimation
  let score = 0;
  
  // Resting HR (lower is better, 60 is ideal)
  if (restingHR > 0) {
    const hrScore = Math.max(0, 100 - Math.abs(restingHR - 60));
    score += hrScore * 0.3;
  }
  
  // HRV (higher is generally better)
  if (hrvBalance > 0) {
    score += Math.min(hrvBalance, 100) * 0.3;
  }
  
  // Sleep quality
  score += sleepScore * 0.4;
  
  return Math.round(Math.min(score, 100));
};

