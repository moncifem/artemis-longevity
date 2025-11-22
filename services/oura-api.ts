/**
 * Oura API Service
 * Handles all API calls to Oura Ring API v2
 * Documentation: https://cloud.ouraring.com/v2/docs
 */

import { OURA_CONFIG, OURA_ENDPOINTS } from '@/constants/oura-config';

// Type Definitions for Oura API Responses
export interface OuraPersonalInfo {
  id: string;
  age: number;
  weight: number;
  height: number;
  biological_sex: 'male' | 'female';
  email: string;
}

export interface OuraDailyActivity {
  id: string;
  class_5_min?: string;
  score: number;
  active_calories: number;
  average_met_minutes: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;
  medium_activity_met_minutes: number;
  medium_activity_time: number;
  met: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  meters_to_target: number;
  non_wear_time: number;
  resting_time: number;
  sedentary_met_minutes: number;
  sedentary_time: number;
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
  day: string;
  timestamp: string;
}

export interface OuraDailySleep {
  id: string;
  day: string;
  score: number;
  timestamp: string;
  // Actual sleep durations in seconds (root level)
  total_sleep_duration?: number;
  deep_sleep_duration?: number;
  rem_sleep_duration?: number;
  light_sleep_duration?: number;
  awake_time?: number;
  efficiency?: number;
  latency?: number;
  // Sleep period times
  bedtime_start?: string;
  bedtime_end?: string;
  // Contributors are scores 0-100, not durations
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  timestamp: string;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

export interface OuraHeartRate {
  bpm: number;
  source: string;
  timestamp: string;
}

export interface OuraWorkout {
  id: string;
  activity: string;
  calories: number;
  day: string;
  distance: number;
  start_datetime: string;
  end_datetime: string;
  intensity: string;
  label: string | null;
}

export interface OuraDailyStress {
  id: string;
  day: string;
  stress_high: number;
  recovery_high: number;
  day_summary: string;
}

/**
 * Base API request function
 */
async function ouraRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Try to get token from AsyncStorage first, then fall back to env variable
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const storedToken = await AsyncStorage.getItem('ouraApiToken');
  const apiToken = storedToken || OURA_CONFIG.apiToken;
  
  if (!apiToken) {
    throw new Error('Oura API token not configured. Please connect your Oura Ring in the app.');
  }

  const url = `${OURA_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Oura API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get personal information
 */
export async function getPersonalInfo(): Promise<OuraPersonalInfo> {
  const response = await ouraRequest<{ id: string; age: number; weight: number; height: number; biological_sex: 'male' | 'female'; email: string }>(
    OURA_ENDPOINTS.personalInfo
  );
  return response;
}

/**
 * Get daily activity data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export async function getDailyActivity(startDate?: string, endDate?: string): Promise<OuraDailyActivity[]> {
  let endpoint = OURA_ENDPOINTS.dailyActivity;
  
  if (startDate && endDate) {
    endpoint += `?start_date=${startDate}&end_date=${endDate}`;
  } else if (startDate) {
    endpoint += `?start_date=${startDate}`;
  }
  
  const response = await ouraRequest<{ data: OuraDailyActivity[] }>(endpoint);
  return response.data;
}

/**
 * Get daily sleep data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export async function getDailySleep(startDate?: string, endDate?: string): Promise<OuraDailySleep[]> {
  let endpoint = OURA_ENDPOINTS.dailySleep;
  
  if (startDate && endDate) {
    endpoint += `?start_date=${startDate}&end_date=${endDate}`;
  } else if (startDate) {
    endpoint += `?start_date=${startDate}`;
  }
  
  const response = await ouraRequest<{ data: OuraDailySleep[] }>(endpoint);
  return response.data;
}

/**
 * Get daily readiness data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export async function getDailyReadiness(startDate?: string, endDate?: string): Promise<OuraDailyReadiness[]> {
  let endpoint = OURA_ENDPOINTS.dailyReadiness;
  
  if (startDate && endDate) {
    endpoint += `?start_date=${startDate}&end_date=${endDate}`;
  } else if (startDate) {
    endpoint += `?start_date=${startDate}`;
  }
  
  const response = await ouraRequest<{ data: OuraDailyReadiness[] }>(endpoint);
  return response.data;
}

/**
 * Get heart rate data
 * @param startDatetime - Start datetime in ISO 8601 format
 * @param endDatetime - End datetime in ISO 8601 format
 */
export async function getHeartRate(startDatetime?: string, endDatetime?: string): Promise<OuraHeartRate[]> {
  let endpoint = OURA_ENDPOINTS.heartRate;
  
  if (startDatetime && endDatetime) {
    endpoint += `?start_datetime=${startDatetime}&end_datetime=${endDatetime}`;
  } else if (startDatetime) {
    endpoint += `?start_datetime=${startDatetime}`;
  }
  
  const response = await ouraRequest<{ data: OuraHeartRate[] }>(endpoint);
  return response.data;
}

/**
 * Get workout data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export async function getWorkouts(startDate?: string, endDate?: string): Promise<OuraWorkout[]> {
  let endpoint = OURA_ENDPOINTS.workout;
  
  if (startDate && endDate) {
    endpoint += `?start_date=${startDate}&end_date=${endDate}`;
  } else if (startDate) {
    endpoint += `?start_date=${startDate}`;
  }
  
  const response = await ouraRequest<{ data: OuraWorkout[] }>(endpoint);
  return response.data;
}

/**
 * Get daily stress data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export async function getDailyStress(startDate?: string, endDate?: string): Promise<OuraDailyStress[]> {
  let endpoint = OURA_ENDPOINTS.dailyStress;
  
  if (startDate && endDate) {
    endpoint += `?start_date=${startDate}&end_date=${endDate}`;
  } else if (startDate) {
    endpoint += `?start_date=${startDate}`;
  }
  
  const response = await ouraRequest<{ data: OuraDailyStress[] }>(endpoint);
  return response.data;
}

/**
 * Helper: Get date string for N days ago
 */
export function getDateString(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get ISO datetime string for N days ago
 */
export function getDateTimeString(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Get average resting heart rate from recent data
 */
export async function getAverageRestingHeartRate(days: number = 7): Promise<number | null> {
  try {
    const readinessData = await getDailyReadiness(
      getDateString(days),
      getDateString(0)
    );
    
    if (readinessData.length === 0) return null;
    
    // Get resting heart rate from readiness data
    const heartRates = readinessData
      .map(d => d.contributors.resting_heart_rate)
      .filter(hr => hr > 0);
    
    if (heartRates.length === 0) return null;
    
    const average = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
    return Math.round(average);
  } catch (error) {
    console.error('Error fetching resting heart rate:', error);
    return null;
  }
}

/**
 * Get today's activity data
 */
export async function getTodayActivity(): Promise<OuraDailyActivity | null> {
  try {
    const today = getDateString(0);
    const activities = await getDailyActivity(today, today);
    return activities.length > 0 ? activities[0] : null;
  } catch (error) {
    console.error('Error fetching today activity:', error);
    return null;
  }
}

/**
 * Get today's sleep data (last night's sleep)
 */
export async function getTodaySleep(): Promise<OuraDailySleep | null> {
  try {
    const today = getDateString(0);
    const sleeps = await getDailySleep(today, today);
    return sleeps.length > 0 ? sleeps[0] : null;
  } catch (error) {
    console.error('Error fetching today sleep:', error);
    return null;
  }
}

/**
 * Get today's readiness data
 */
export async function getTodayReadiness(): Promise<OuraDailyReadiness | null> {
  try {
    const today = getDateString(0);
    const readiness = await getDailyReadiness(today, today);
    return readiness.length > 0 ? readiness[0] : null;
  } catch (error) {
    console.error('Error fetching today readiness:', error);
    return null;
  }
}

