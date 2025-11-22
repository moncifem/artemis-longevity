/**
 * Oura Data Mapper
 * Maps Oura Ring data to Artemis Longevity assessment metrics
 */

import {
    getAverageRestingHeartRate,
    getDailyActivity,
    getDailyReadiness,
    getDailySleep,
    getDateString,
    getPersonalInfo,
    type OuraDailyActivity
} from './oura-api';

export interface MappedOuraData {
  personalInfo: {
    age: number;
    weight: number;
    height: number;
    sex: 'male' | 'female';
  };
  activityMetrics: {
    averageSteps: number;
    activeCalories: number;
    activityScore: number;
    equivalentWalkingDistance: number;
  };
  sleepMetrics: {
    averageSleepScore: number;
    averageTotalSleep: number;
    sleepEfficiency: number;
    deepSleepPercentage: number;
  };
  readinessMetrics: {
    averageReadinessScore: number;
    restingHeartRate: number;
    hrvBalance: number;
    bodyTemperatureDeviation: number;
  };
  assessmentAnswers: {
    gripStrength?: number;
    endurance: string;
    flexibility?: string;
    cardio: string;
  };
  fitnessAge: number | null;
}

/**
 * Map Oura activity data to endurance assessment
 */
function mapActivityToEndurance(activities: OuraDailyActivity[]): string {
  if (activities.length === 0) return '15-20 min';
  
  // Calculate average activity score and steps
  const avgSteps = activities.reduce((sum, a) => sum + a.steps, 0) / activities.length;
  const avgScore = activities.reduce((sum, a) => sum + a.score, 0) / activities.length;
  
  // Map to 2km run time estimation based on activity level
  // High activity = faster time
  if (avgSteps > 12000 && avgScore > 85) return '<10 min';
  if (avgSteps > 10000 && avgScore > 75) return '10-12 min';
  if (avgSteps > 7000 && avgScore > 65) return '12-15 min';
  if (avgSteps > 5000) return '15-20 min';
  return '20+ min';
}

/**
 * Map Oura heart rate data to cardio assessment
 */
function mapHeartRateToCardio(restingHR: number): string {
  // Map resting heart rate to assessment options
  if (restingHR < 60) return '<65 bpm';
  if (restingHR < 65) return '65-70 bpm';
  if (restingHR < 70) return '70-80 bpm';
  if (restingHR < 80) return '80-90 bpm';
  return '90+ bpm';
}

/**
 * Calculate fitness age based on Oura metrics
 */
function calculateFitnessAge(
  actualAge: number,
  readinessScore: number,
  activityScore: number,
  sleepScore: number
): number {
  // Average all scores
  const avgScore = (readinessScore + activityScore + sleepScore) / 3;
  
  // Excellent (85-100): 10 years younger
  // Good (70-84): 5 years younger
  // Average (55-69): Same age
  // Below Average (40-54): 5 years older
  // Poor (0-39): 10 years older
  
  let adjustment = 0;
  if (avgScore >= 85) adjustment = -10;
  else if (avgScore >= 70) adjustment = -5;
  else if (avgScore >= 55) adjustment = 0;
  else if (avgScore >= 40) adjustment = 5;
  else adjustment = 10;
  
  return Math.max(18, actualAge + adjustment);
}

/**
 * Fetch and map all Oura data
 */
export async function fetchAndMapOuraData(days: number = 7): Promise<MappedOuraData> {
  const endDate = getDateString(0);
  const startDate = getDateString(days);
  
  try {
    // Fetch all data in parallel
    const [
      personalInfo,
      activityData,
      sleepData,
      readinessData,
      restingHR,
    ] = await Promise.all([
      getPersonalInfo(),
      getDailyActivity(startDate, endDate),
      getDailySleep(startDate, endDate),
      getDailyReadiness(startDate, endDate),
      getAverageRestingHeartRate(days),
    ]);
    
    // Calculate averages
    const avgActivityScore = activityData.length > 0
      ? activityData.reduce((sum, a) => sum + a.score, 0) / activityData.length
      : 0;
    
    const avgSteps = activityData.length > 0
      ? activityData.reduce((sum, a) => sum + a.steps, 0) / activityData.length
      : 0;
    
    const avgActiveCalories = activityData.length > 0
      ? activityData.reduce((sum, a) => sum + (a.active_calories || 0), 0) / activityData.length
      : 0;
    
    const avgWalkingDistance = activityData.length > 0
      ? activityData.reduce((sum, a) => sum + a.equivalent_walking_distance, 0) / activityData.length
      : 0;
    
    const avgSleepScore = sleepData.length > 0
      ? sleepData.reduce((sum, s) => sum + s.score, 0) / sleepData.length
      : 0;
    
    const avgDeepSleep = sleepData.length > 0
      ? sleepData.reduce((sum, s) => sum + s.contributors.deep_sleep, 0) / sleepData.length
      : 0;
    
    const avgSleepEfficiency = sleepData.length > 0
      ? sleepData.reduce((sum, s) => sum + s.contributors.efficiency, 0) / sleepData.length
      : 0;
    
    const avgTotalSleep = sleepData.length > 0
      ? sleepData.reduce((sum, s) => sum + s.contributors.total_sleep, 0) / sleepData.length
      : 0;
    
    const avgReadinessScore = readinessData.length > 0
      ? readinessData.reduce((sum, r) => sum + r.score, 0) / readinessData.length
      : 0;
    
    const avgHRVBalance = readinessData.length > 0
      ? readinessData.reduce((sum, r) => sum + r.contributors.hrv_balance, 0) / readinessData.length
      : 0;
    
    const avgTempDeviation = readinessData.length > 0
      ? readinessData.reduce((sum, r) => sum + r.temperature_deviation, 0) / readinessData.length
      : 0;
    
    // Map to assessment answers
    const enduranceLevel = mapActivityToEndurance(activityData);
    const cardioLevel = mapHeartRateToCardio(restingHR || 70);
    
    // Calculate fitness age
    const fitnessAge = calculateFitnessAge(
      personalInfo.age,
      avgReadinessScore,
      avgActivityScore,
      avgSleepScore
    );
    
    return {
      personalInfo: {
        age: personalInfo.age,
        weight: personalInfo.weight,
        height: personalInfo.height,
        sex: personalInfo.biological_sex,
      },
      activityMetrics: {
        averageSteps: Math.round(avgSteps),
        activeCalories: Math.round(avgActiveCalories),
        activityScore: Math.round(avgActivityScore),
        equivalentWalkingDistance: Math.round(avgWalkingDistance),
      },
      sleepMetrics: {
        averageSleepScore: Math.round(avgSleepScore),
        averageTotalSleep: Math.round(avgTotalSleep),
        sleepEfficiency: Math.round(avgSleepEfficiency),
        deepSleepPercentage: Math.round(avgDeepSleep),
      },
      readinessMetrics: {
        averageReadinessScore: Math.round(avgReadinessScore),
        restingHeartRate: restingHR || 0,
        hrvBalance: Math.round(avgHRVBalance),
        bodyTemperatureDeviation: avgTempDeviation,
      },
      assessmentAnswers: {
        endurance: enduranceLevel,
        cardio: cardioLevel,
      },
      fitnessAge,
    };
  } catch (error) {
    console.error('Error fetching Oura data:', error);
    throw error;
  }
}

/**
 * Auto-fill user profile from Oura data
 */
export async function autoFillProfileFromOura() {
  try {
    const personalInfo = await getPersonalInfo();
    
    return {
      age: personalInfo.age,
      height: personalInfo.height,
      heightUnit: 'cm' as const,
      weight: personalInfo.weight,
      weightUnit: 'kg' as const,
      sex: personalInfo.biological_sex,
    };
  } catch (error) {
    console.error('Error fetching Oura personal info:', error);
    return null;
  }
}

/**
 * Pre-fill assessment from Oura data
 */
export async function preFillAssessmentFromOura(days: number = 7) {
  try {
    const mappedData = await fetchAndMapOuraData(days);
    
    return {
      endurance: mappedData.assessmentAnswers.endurance,
      cardio: mappedData.assessmentAnswers.cardio,
      // Note: grip strength and flexibility still need manual input
    };
  } catch (error) {
    console.error('Error pre-filling assessment:', error);
    return null;
  }
}

/**
 * Get comprehensive health summary from Oura
 */
export async function getHealthSummary(days: number = 7) {
  try {
    const mappedData = await fetchAndMapOuraData(days);
    
    return {
      overall: {
        fitnessAge: mappedData.fitnessAge,
        actualAge: mappedData.personalInfo.age,
        ageDifference: mappedData.personalInfo.age - (mappedData.fitnessAge || mappedData.personalInfo.age),
      },
      activity: {
        score: mappedData.activityMetrics.activityScore,
        dailySteps: mappedData.activityMetrics.averageSteps,
        activeCalories: mappedData.activityMetrics.activeCalories,
        level: getActivityLevel(mappedData.activityMetrics.activityScore),
      },
      sleep: {
        score: mappedData.sleepMetrics.averageSleepScore,
        averageHours: (mappedData.sleepMetrics.averageTotalSleep / 3600).toFixed(1),
        efficiency: mappedData.sleepMetrics.sleepEfficiency,
        quality: getSleepQuality(mappedData.sleepMetrics.averageSleepScore),
      },
      readiness: {
        score: mappedData.readinessMetrics.averageReadinessScore,
        restingHR: mappedData.readinessMetrics.restingHeartRate,
        level: getReadinessLevel(mappedData.readinessMetrics.averageReadinessScore),
      },
    };
  } catch (error) {
    console.error('Error getting health summary:', error);
    return null;
  }
}

// Helper functions
function getActivityLevel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Needs Improvement';
}

function getSleepQuality(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Poor';
}

function getReadinessLevel(score: number): string {
  if (score >= 85) return 'Optimal';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Pay Attention';
  return 'Rest Needed';
}

