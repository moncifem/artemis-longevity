// Five-Times Sit-to-Stand Test Normative Data
// Based on meta-analyses and normative dataset of 45,470 adults
// Predicts frailty, falls, disability, and sarcopenia

export interface SitToStandNorms {
  excellent: number; // Top 20% - Low frailty risk
  good: number;      // 20-40% - Below average risk
  average: number;   // 40-60% - Average risk
  belowAverage: number; // 60-80% - Above average risk
  poor: number;      // Bottom 20% - High frailty risk
}

export interface AgeGroupNorms {
  [ageGroup: string]: SitToStandNorms;
}

// Time in seconds to complete 5 sit-to-stand repetitions
// Lower times = better performance
// Reference: J Gerontol A Biol Sci Med Sci. 2013;68(1):80-86
// And: Age Ageing. 2019;48(5):675-681

export const FEMALE_SIT_TO_STAND_NORMS: AgeGroupNorms = {
  '18-39': { excellent: 7.5, good: 9.0, average: 11.0, belowAverage: 13.0, poor: 15.0 },
  '40-49': { excellent: 8.0, good: 9.5, average: 11.5, belowAverage: 13.5, poor: 16.0 },
  '50-59': { excellent: 9.0, good: 10.5, average: 12.5, belowAverage: 15.0, poor: 18.0 },
  '60-69': { excellent: 10.0, good: 11.5, average: 14.0, belowAverage: 17.0, poor: 20.0 },
  '70-79': { excellent: 11.5, good: 13.5, average: 16.0, belowAverage: 19.0, poor: 23.0 },
  '80+': { excellent: 13.5, good: 16.0, average: 19.0, belowAverage: 23.0, poor: 28.0 },
};

export const MALE_SIT_TO_STAND_NORMS: AgeGroupNorms = {
  '18-39': { excellent: 7.0, good: 8.5, average: 10.5, belowAverage: 12.5, poor: 14.5 },
  '40-49': { excellent: 7.5, good: 9.0, average: 11.0, belowAverage: 13.0, poor: 15.5 },
  '50-59': { excellent: 8.5, good: 10.0, average: 12.0, belowAverage: 14.5, poor: 17.0 },
  '60-69': { excellent: 9.5, good: 11.0, average: 13.0, belowAverage: 16.0, poor: 19.0 },
  '70-79': { excellent: 11.0, good: 13.0, average: 15.5, belowAverage: 18.5, poor: 22.0 },
  '80+': { excellent: 12.5, good: 15.0, average: 18.0, belowAverage: 22.0, poor: 27.0 },
};

/**
 * Get the age group for sit-to-stand norms
 */
export function getSitToStandAgeGroup(age: number): string {
  if (age < 40) return '18-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  if (age < 80) return '70-79';
  return '80+';
}

/**
 * Calculate performance level based on sit-to-stand time
 * @param time - Time in seconds to complete 5 repetitions
 * @param sex - User's sex
 * @param age - User's age
 * @returns Performance level and score
 */
export function evaluateSitToStandPerformance(
  time: number,
  sex: 'male' | 'female',
  age: number
): {
  level: string;
  description: string;
  score: number; // 0-4 for scoring system
  frailtyRisk: string;
} {
  const ageGroup = getSitToStandAgeGroup(age);
  const norms = sex === 'male' ? MALE_SIT_TO_STAND_NORMS[ageGroup] : FEMALE_SIT_TO_STAND_NORMS[ageGroup];

  if (time <= norms.excellent) {
    return {
      level: 'Excellent',
      description: 'Top 20% - Outstanding functional strength',
      score: 4,
      frailtyRisk: 'Very Low'
    };
  } else if (time <= norms.good) {
    return {
      level: 'Good',
      description: 'Top 40% - Above average functional strength',
      score: 3,
      frailtyRisk: 'Low'
    };
  } else if (time <= norms.average) {
    return {
      level: 'Average',
      description: 'Middle 20% - Average functional strength',
      score: 2,
      frailtyRisk: 'Moderate'
    };
  } else if (time <= norms.belowAverage) {
    return {
      level: 'Below Average',
      description: 'Lower 20% - Below average functional strength',
      score: 1,
      frailtyRisk: 'Elevated'
    };
  } else {
    return {
      level: 'Needs Improvement',
      description: 'Bottom 20% - Consider strength training',
      score: 0,
      frailtyRisk: 'High'
    };
  }
}

/**
 * Get reference values for display
 */
export function getSitToStandReferenceValues(sex: 'male' | 'female', age: number) {
  const ageGroup = getSitToStandAgeGroup(age);
  const norms = sex === 'male' ? MALE_SIT_TO_STAND_NORMS[ageGroup] : FEMALE_SIT_TO_STAND_NORMS[ageGroup];

  return {
    excellent: norms.excellent,
    average: norms.average,
    poor: norms.poor,
    ageGroup,
  };
}

/**
 * Clinical interpretation for healthcare providers
 */
export function getClinicalInterpretation(time: number, sex: 'male' | 'female', age: number): string {
  const performance = evaluateSitToStandPerformance(time, sex, age);
  
  const interpretations = {
    'Very Low': 'Low risk of frailty, falls, and functional decline. Excellent lower extremity strength and power.',
    'Low': 'Below average risk of frailty. Good functional strength for activities of daily living.',
    'Moderate': 'Average risk profile. Consider preventive strength training to maintain independence.',
    'Elevated': 'Elevated fall risk. Recommend structured exercise program focusing on lower body strength.',
    'High': 'High frailty risk. Consider referral for comprehensive geriatric assessment and intervention.'
  };

  return interpretations[performance.frailtyRisk as keyof typeof interpretations];
}

