// Normative values (percentiles) for absolute handgrip strength in kilograms
// Based on international data from 2,405,863 adults aged 20 to 100+ years
// Source: J Sport Health Sci 2025;14:101014

export interface GripStrengthNorms {
  P5: number;
  P10: number;
  P20: number;
  P30: number;
  P40: number;
  P50: number;  // Median
  P60: number;
  P70: number;
  P80: number;
  P90: number;
  P95: number;
}

export interface AgeGroupNorms {
  [ageGroup: string]: GripStrengthNorms;
}

export const MALE_GRIP_STRENGTH_NORMS: AgeGroupNorms = {
  '20-24': { P5: 33.9, P10: 36.8, P20: 40.5, P30: 43.2, P40: 45.7, P50: 48.0, P60: 50.4, P70: 52.9, P80: 56.0, P90: 60.1, P95: 63.6 },
  '25-29': { P5: 35.5, P10: 38.5, P20: 42.1, P30: 44.8, P40: 47.1, P50: 49.3, P60: 51.5, P70: 53.9, P80: 56.7, P90: 60.7, P95: 64.0 },
  '30-34': { P5: 35.0, P10: 38.3, P20: 42.2, P30: 45.0, P40: 47.4, P50: 49.7, P60: 52.0, P70: 54.4, P80: 57.4, P90: 61.5, P95: 64.9 },
  '35-39': { P5: 33.8, P10: 37.3, P20: 41.5, P30: 44.5, P40: 47.1, P50: 49.5, P60: 51.9, P70: 54.4, P80: 57.5, P90: 61.8, P95: 65.3 },
  '40-44': { P5: 32.3, P10: 36.0, P20: 40.4, P30: 43.6, P40: 46.3, P50: 48.8, P60: 51.2, P70: 53.9, P80: 57.1, P90: 61.5, P95: 65.1 },
  '45-49': { P5: 30.6, P10: 34.4, P20: 39.0, P30: 42.3, P40: 45.1, P50: 47.6, P60: 50.2, P70: 52.9, P80: 56.2, P90: 60.7, P95: 64.4 },
  '50-54': { P5: 28.9, P10: 32.8, P20: 37.4, P30: 40.7, P40: 43.5, P50: 46.2, P60: 48.8, P70: 51.6, P80: 54.8, P90: 59.4, P95: 63.1 },
  '55-59': { P5: 27.2, P10: 31.0, P20: 35.6, P30: 38.9, P40: 41.7, P50: 44.4, P60: 47.0, P70: 49.8, P80: 53.1, P90: 57.7, P95: 61.4 },
  '60-64': { P5: 25.5, P10: 29.1, P20: 33.6, P30: 36.9, P40: 39.7, P50: 42.4, P60: 45.0, P70: 47.8, P80: 51.1, P90: 55.6, P95: 59.3 },
  '65-69': { P5: 23.7, P10: 27.2, P20: 31.5, P30: 34.7, P40: 37.5, P50: 40.1, P60: 42.8, P70: 45.6, P80: 48.8, P90: 53.2, P95: 56.8 },
  '70-74': { P5: 21.9, P10: 25.2, P20: 29.3, P30: 32.4, P40: 35.1, P50: 37.7, P60: 40.3, P70: 43.1, P80: 46.3, P90: 50.6, P95: 54.1 },
  '75-79': { P5: 20.0, P10: 23.1, P20: 27.0, P30: 29.9, P40: 32.5, P50: 35.1, P60: 37.6, P70: 40.3, P80: 43.5, P90: 47.7, P95: 51.1 },
  '80-84': { P5: 18.0, P10: 20.8, P20: 24.5, P30: 27.3, P40: 29.8, P50: 32.3, P60: 34.8, P70: 37.5, P80: 40.5, P90: 44.7, P95: 48.0 },
  '85-89': { P5: 15.9, P10: 18.5, P20: 21.9, P30: 24.6, P40: 27.0, P50: 29.4, P60: 31.8, P70: 34.4, P80: 37.4, P90: 41.5, P95: 44.6 },
  '90-94': { P5: 13.7, P10: 16.1, P20: 19.2, P30: 21.7, P40: 24.0, P50: 26.3, P60: 28.7, P70: 31.2, P80: 34.2, P90: 38.1, P95: 41.2 },
  '95-99': { P5: 11.3, P10: 13.5, P20: 16.4, P30: 18.8, P40: 20.9, P50: 23.1, P60: 25.4, P70: 27.9, P80: 30.8, P90: 34.6, P95: 37.5 },
  '100+': { P5: 8.8, P10: 10.8, P20: 13.5, P30: 15.7, P40: 17.8, P50: 19.8, P60: 22.0, P70: 24.5, P80: 27.2, P90: 30.9, P95: 33.8 },
};

export const FEMALE_GRIP_STRENGTH_NORMS: AgeGroupNorms = {
  '20-24': { P5: 19.7, P10: 21.7, P20: 24.0, P30: 25.7, P40: 27.2, P50: 28.6, P60: 30.0, P70: 31.6, P80: 33.6, P90: 36.6, P95: 39.1 },
  '25-29': { P5: 20.0, P10: 22.0, P20: 24.5, P30: 26.3, P40: 27.9, P50: 29.4, P60: 30.9, P70: 32.6, P80: 34.6, P90: 37.4, P95: 39.7 },
  '30-34': { P5: 19.6, P10: 21.8, P20: 24.4, P30: 26.4, P40: 28.1, P50: 29.7, P60: 31.3, P70: 33.1, P80: 35.2, P90: 38.0, P95: 40.4 },
  '35-39': { P5: 19.0, P10: 21.3, P20: 24.1, P30: 26.2, P40: 28.0, P50: 29.7, P60: 31.4, P70: 33.2, P80: 35.4, P90: 38.4, P95: 40.8 },
  '40-44': { P5: 18.3, P10: 20.7, P20: 23.7, P30: 25.8, P40: 27.6, P50: 29.4, P60: 31.1, P70: 33.0, P80: 35.2, P90: 38.3, P95: 40.8 },
  '45-49': { P5: 17.6, P10: 20.1, P20: 23.1, P30: 25.2, P40: 27.1, P50: 28.9, P60: 30.6, P70: 32.5, P80: 34.8, P90: 37.9, P95: 40.4 },
  '50-54': { P5: 16.9, P10: 19.4, P20: 22.4, P30: 24.5, P40: 26.4, P50: 28.2, P60: 29.9, P70: 31.8, P80: 34.0, P90: 37.1, P95: 39.7 },
  '55-59': { P5: 16.1, P10: 18.5, P20: 21.5, P30: 23.7, P40: 25.5, P50: 27.3, P60: 29.0, P70: 30.9, P80: 33.0, P90: 36.1, P95: 38.6 },
  '60-64': { P5: 15.2, P10: 17.6, P20: 20.6, P30: 22.7, P40: 24.5, P50: 26.2, P60: 27.9, P70: 29.7, P80: 31.8, P90: 34.9, P95: 37.4 },
  '65-69': { P5: 14.3, P10: 16.6, P20: 19.5, P30: 21.6, P40: 23.3, P50: 25.0, P60: 26.6, P70: 28.4, P80: 30.5, P90: 33.4, P95: 35.8 },
  '70-74': { P5: 13.2, P10: 15.5, P20: 18.3, P30: 20.3, P40: 22.0, P50: 23.6, P60: 25.2, P70: 26.9, P80: 28.9, P90: 31.8, P95: 34.1 },
  '75-79': { P5: 12.0, P10: 14.3, P20: 17.0, P30: 18.9, P40: 20.5, P50: 22.1, P60: 23.6, P70: 25.2, P80: 27.2, P90: 29.9, P95: 32.2 },
  '80-84': { P5: 10.7, P10: 12.9, P20: 15.5, P30: 17.4, P40: 18.9, P50: 20.4, P60: 21.9, P70: 23.5, P80: 25.3, P90: 28.0, P95: 30.2 },
  '85-89': { P5: 9.3, P10: 11.4, P20: 13.9, P30: 15.7, P40: 17.2, P50: 18.6, P60: 20.0, P70: 21.5, P80: 23.3, P90: 25.9, P95: 28.0 },
  '90-94': { P5: 7.8, P10: 9.8, P20: 12.2, P30: 13.9, P40: 15.3, P50: 16.7, P60: 18.0, P70: 19.5, P80: 21.2, P90: 23.6, P95: 25.7 },
  '95-99': { P5: 6.1, P10: 8.0, P20: 10.3, P30: 11.9, P40: 13.3, P50: 14.6, P60: 15.9, P70: 17.3, P80: 18.9, P90: 21.2, P95: 23.2 },
  '100+': { P5: 4.2, P10: 6.1, P20: 8.3, P30: 9.8, P40: 11.2, P50: 12.4, P60: 13.6, P70: 14.9, P80: 16.5, P90: 18.7, P95: 20.6 },
};

/**
 * Get the age group key for grip strength norms
 * @param age - User's age in years
 * @returns Age group key (e.g., '20-24', '25-29', etc.)
 */
export function getGripStrengthAgeGroup(age: number): string {
  if (age < 20) return '20-24';
  if (age >= 100) return '100+';
  
  // Find the appropriate age group
  const ageGroups = ['20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85-89', '90-94', '95-99'];
  
  for (const group of ageGroups) {
    const [min, max] = group.split('-').map(Number);
    if (age >= min && age <= max) {
      return group;
    }
  }
  
  return '100+';
}

/**
 * Calculate performance level based on grip strength percentile
 * @param percentile - The percentile rank (0-100)
 * @returns Performance level and description
 */
export function getGripStrengthPerformanceLevel(percentile: number): {
  level: string;
  description: string;
  score: number; // 0-4 for compatibility with existing scoring system
} {
  if (percentile >= 90) {
    return { level: 'Excellent', description: 'Top 10% - Outstanding strength', score: 4 };
  } else if (percentile >= 70) {
    return { level: 'Good', description: 'Top 30% - Above average strength', score: 3 };
  } else if (percentile >= 40) {
    return { level: 'Average', description: 'Middle 30% - Average strength', score: 2 };
  } else if (percentile >= 20) {
    return { level: 'Below Average', description: 'Lower 30% - Below average strength', score: 1 };
  } else {
    return { level: 'Needs Improvement', description: 'Bottom 20% - Needs improvement', score: 0 };
  }
}

/**
 * Calculate the percentile rank for a given grip strength value
 * @param gripStrength - User's grip strength in kg
 * @param sex - User's sex ('male' or 'female')
 * @param age - User's age in years
 * @returns Percentile rank (0-100)
 */
export function calculateGripStrengthPercentile(
  gripStrength: number,
  sex: 'male' | 'female',
  age: number
): number {
  const ageGroup = getGripStrengthAgeGroup(age);
  const norms = sex === 'male' ? MALE_GRIP_STRENGTH_NORMS[ageGroup] : FEMALE_GRIP_STRENGTH_NORMS[ageGroup];
  
  if (!norms) {
    console.warn(`No norms found for age group ${ageGroup}`);
    return 50; // Default to median
  }
  
  // Find which percentile the user's grip strength falls into
  if (gripStrength >= norms.P95) return 97.5; // Between 95th and 100th
  if (gripStrength >= norms.P90) return 92.5; // Between 90th and 95th
  if (gripStrength >= norms.P80) return 85; // Between 80th and 90th
  if (gripStrength >= norms.P70) return 75; // Between 70th and 80th
  if (gripStrength >= norms.P60) return 65; // Between 60th and 70th
  if (gripStrength >= norms.P50) return 55; // Between 50th and 60th
  if (gripStrength >= norms.P40) return 45; // Between 40th and 50th
  if (gripStrength >= norms.P30) return 35; // Between 30th and 40th
  if (gripStrength >= norms.P20) return 25; // Between 20th and 30th
  if (gripStrength >= norms.P10) return 15; // Between 10th and 20th
  if (gripStrength >= norms.P5) return 7.5; // Between 5th and 10th
  
  return 2.5; // Below 5th percentile
}

/**
 * Get reference values for display
 * @param sex - User's sex ('male' or 'female')
 * @param age - User's age in years
 * @returns Object with P10, P50, and P90 values
 */
export function getGripStrengthReferenceValues(sex: 'male' | 'female', age: number) {
  const ageGroup = getGripStrengthAgeGroup(age);
  const norms = sex === 'male' ? MALE_GRIP_STRENGTH_NORMS[ageGroup] : FEMALE_GRIP_STRENGTH_NORMS[ageGroup];
  
  return {
    poor: norms.P10,
    average: norms.P50,
    excellent: norms.P90,
    ageGroup,
  };
}

