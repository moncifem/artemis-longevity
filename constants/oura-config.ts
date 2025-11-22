/**
 * Oura API Configuration
 * 
 * Setup Instructions:
 * 1. Create a file called .env in the root directory
 * 2. Add your Oura API token:
 *    EXPO_PUBLIC_OURA_API_TOKEN=your_token_here
 * 3. Get your token from: https://cloud.ouraring.com/personal-access-tokens
 */

export const OURA_CONFIG = {
  // API Base URL
  baseUrl: process.env.EXPO_PUBLIC_OURA_API_URL || 'https://api.ouraring.com/v2',
  
  // Personal Access Token (for development)
  apiToken: process.env.EXPO_PUBLIC_OURA_API_TOKEN || '',
  
  // OAuth Configuration (for production)
  oauth: {
    clientId: process.env.EXPO_PUBLIC_OURA_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_OURA_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_OURA_REDIRECT_URI || '',
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
  },
};

// Check if API token is configured (checks both env and AsyncStorage)
export const isOuraConfigured = async () => {
  // Check env variable first
  if (OURA_CONFIG.apiToken && OURA_CONFIG.apiToken !== '') {
    return true;
  }
  
  // Check AsyncStorage for runtime token
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const storedToken = await AsyncStorage.getItem('ouraApiToken');
    return !!storedToken && storedToken !== '';
  } catch (error) {
    return false;
  }
};

// Synchronous check for env variable only (for initial checks)
export const isOuraConfiguredSync = () => {
  return !!OURA_CONFIG.apiToken && OURA_CONFIG.apiToken !== '';
};

// API Endpoints
export const OURA_ENDPOINTS = {
  // Personal Info
  personalInfo: '/usercollection/personal_info',
  
  // Daily Activity
  dailyActivity: '/usercollection/daily_activity',
  
  // Sleep Data
  dailySleep: '/usercollection/daily_sleep',
  sleep: '/usercollection/sleep',
  
  // Readiness
  dailyReadiness: '/usercollection/daily_readiness',
  
  // Heart Rate
  heartRate: '/usercollection/heartrate',
  
  // Workouts
  workout: '/usercollection/workout',
  
  // SPO2 (Blood Oxygen)
  dailySpo2: '/usercollection/daily_spo2',
  
  // Stress
  dailyStress: '/usercollection/daily_stress',
  
  // Tags
  tags: '/usercollection/tag',
};

