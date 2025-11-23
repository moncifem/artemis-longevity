// VO2Max Normative Data for 1-Mile Walk Test
// VO2Max measures body's ability to process oxygen (mL/(kg·min))
// Higher values = better cardiovascular fitness

export interface VO2MaxNorms {
  superior: number;    // Top tier cardiovascular fitness
  excellent: number;   // Excellent fitness
  aboveAverage: number; // Above average fitness
  average: number;     // Average fitness
  belowAverage: number; // Below average fitness
  poor: number;        // Poor fitness
}

export interface AgeGroupNorms {
  [ageGroup: string]: VO2MaxNorms;
}

// VO2Max values in mL/(kg·min) for females
// Based on American Heart Association cardiovascular fitness classifications
export const FEMALE_VO2MAX_NORMS: AgeGroupNorms = {
  '18-25': { superior: 56, excellent: 47, aboveAverage: 42, average: 38, belowAverage: 33, poor: 28 },
  '26-35': { superior: 52, excellent: 45, aboveAverage: 39, average: 35, belowAverage: 31, poor: 26 },
  '36-45': { superior: 45, excellent: 38, aboveAverage: 34, average: 31, belowAverage: 27, poor: 22 },
  '46-55': { superior: 40, excellent: 34, aboveAverage: 31, average: 28, belowAverage: 25, poor: 20 },
  '56-65': { superior: 37, excellent: 32, aboveAverage: 28, average: 25, belowAverage: 22, poor: 18 },
  '66-100': { superior: 32, excellent: 28, aboveAverage: 25, average: 22, belowAverage: 19, poor: 17 },
};

// For male participants (if needed in future)
export const MALE_VO2MAX_NORMS: AgeGroupNorms = {
  '18-25': { superior: 60, excellent: 52, aboveAverage: 47, average: 42, belowAverage: 37, poor: 30 },
  '26-35': { superior: 56, excellent: 49, aboveAverage: 43, average: 40, belowAverage: 35, poor: 30 },
  '36-45': { superior: 51, excellent: 43, aboveAverage: 39, average: 35, belowAverage: 31, poor: 26 },
  '46-55': { superior: 45, excellent: 39, aboveAverage: 36, average: 32, belowAverage: 29, poor: 25 },
  '56-65': { superior: 41, excellent: 36, aboveAverage: 32, average: 30, belowAverage: 26, poor: 22 },
  '66-100': { superior: 37, excellent: 33, aboveAverage: 29, average: 26, belowAverage: 22, poor: 20 },
};

/**
 * Get the age group for VO2Max norms
 */
export function getVO2MaxAgeGroup(age: number): string {
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  if (age <= 65) return '56-65';
  return '66-100';
}

/**
 * Estimate VO2Max from 1-Mile Walk Test
 * Rockport Walking Test Formula
 * @param walkTime - Time to walk 1 mile in minutes
 * @param weight - Body weight in kg
 * @param age - Age in years
 * @param sex - Biological sex
 * @param heartRate - Heart rate immediately after test (bpm)
 * @returns Estimated VO2Max in mL/(kg·min)
 */
export function calculateVO2MaxFromWalk(
  walkTime: number,
  weight: number,
  age: number,
  sex: 'male' | 'female',
  heartRate: number
): number {
  // Rockport 1-Mile Walk Test formula
  // VO2max = 132.853 - (0.0769 × Weight in lbs) - (0.3877 × Age) + (6.315 × Gender) - (3.2649 × Time in min) - (0.1565 × Heart Rate)
  // Gender: 0 = female, 1 = male
  
  const weightLbs = weight * 2.20462; // Convert kg to lbs
  const genderFactor = sex === 'male' ? 1 : 0;
  
  const vo2max = 132.853 
    - (0.0769 * weightLbs) 
    - (0.3877 * age) 
    + (6.315 * genderFactor) 
    - (3.2649 * walkTime) 
    - (0.1565 * heartRate);
  
  return Math.max(0, vo2max); // Ensure non-negative
}

/**
 * Evaluate VO2Max performance level
 * @param vo2max - VO2Max value in mL/(kg·min)
 * @param sex - Biological sex
 * @param age - Age in years
 * @returns Performance evaluation
 */
export function evaluateVO2MaxPerformance(
  vo2max: number,
  sex: 'male' | 'female',
  age: number
): {
  level: string;
  description: string;
  score: number; // 0-4 for scoring system
  cardiovascularRisk: string;
} {
  const ageGroup = getVO2MaxAgeGroup(age);
  const norms = sex === 'male' ? MALE_VO2MAX_NORMS[ageGroup] : FEMALE_VO2MAX_NORMS[ageGroup];

  if (vo2max >= norms.superior) {
    return {
      level: 'Superior',
      description: 'Exceptional cardiovascular fitness',
      score: 4,
      cardiovascularRisk: 'Very Low'
    };
  } else if (vo2max >= norms.excellent) {
    return {
      level: 'Excellent',
      description: 'Above average cardiovascular fitness',
      score: 4,
      cardiovascularRisk: 'Low'
    };
  } else if (vo2max >= norms.aboveAverage) {
    return {
      level: 'Above Average',
      description: 'Good cardiovascular fitness',
      score: 3,
      cardiovascularRisk: 'Low'
    };
  } else if (vo2max >= norms.average) {
    return {
      level: 'Average',
      description: 'Average cardiovascular fitness',
      score: 2,
      cardiovascularRisk: 'Moderate'
    };
  } else if (vo2max >= norms.belowAverage) {
    return {
      level: 'Below Average',
      description: 'Below average - improvement recommended',
      score: 1,
      cardiovascularRisk: 'Elevated'
    };
  } else if (vo2max >= norms.poor) {
    return {
      level: 'Poor',
      description: 'Poor cardiovascular fitness',
      score: 1,
      cardiovascularRisk: 'High'
    };
  } else {
    return {
      level: 'Very Poor',
      description: 'Very poor - medical consultation recommended',
      score: 0,
      cardiovascularRisk: 'Very High'
    };
  }
}

/**
 * Get reference values for display
 */
export function getVO2MaxReferenceValues(sex: 'male' | 'female', age: number) {
  const ageGroup = getVO2MaxAgeGroup(age);
  const norms = sex === 'male' ? MALE_VO2MAX_NORMS[ageGroup] : FEMALE_VO2MAX_NORMS[ageGroup];

  return {
    superior: norms.superior,
    average: norms.average,
    poor: norms.poor,
    ageGroup,
  };
}

/**
 * Clinical interpretation
 */
export function getClinicalInterpretation(vo2max: number): string {
  if (vo2max >= 45) {
    return 'Excellent cardiorespiratory fitness. Associated with reduced risk of cardiovascular disease and all-cause mortality.';
  } else if (vo2max >= 35) {
    return 'Good cardiovascular fitness. Continue regular aerobic exercise to maintain.';
  } else if (vo2max >= 28) {
    return 'Fair cardiovascular fitness. Increase aerobic exercise frequency and intensity.';
  } else if (vo2max >= 20) {
    return 'Poor cardiovascular fitness. Consult healthcare provider before starting exercise program.';
  } else {
    return 'Very poor cardiovascular fitness. Medical evaluation recommended before exercise.';
  }
}

