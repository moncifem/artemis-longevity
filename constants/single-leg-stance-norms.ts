// Single-Leg Stance Test Normative Data
// Validated in cohorts of 2,000-5,000+ adults
// Predicts fall risk, neuromuscular decline, and cognitive impairment

export interface SingleLegStanceNorms {
  excellent: number; // Top 20% - Low fall risk
  good: number;      // 20-40% - Below average risk
  average: number;   // 40-60% - Average risk
  belowAverage: number; // 60-80% - Above average risk
  poor: number;      // Bottom 20% - High fall risk
}

export interface AgeGroupNorms {
  [ageGroup: string]: SingleLegStanceNorms;
}

// Time in seconds able to stand on one leg (eyes open)
// Maximum test time: 60 seconds
// Higher times = better balance
// Reference: Arch Phys Med Rehabil. 2014;95(11):2213-2219
// And: BMJ Open. 2022;12:e054612 (10-year mortality prediction)

export const FEMALE_SINGLE_LEG_STANCE_NORMS: AgeGroupNorms = {
  '18-39': { excellent: 45, good: 35, average: 25, belowAverage: 18, poor: 12 },
  '40-49': { excellent: 40, good: 30, average: 22, belowAverage: 15, poor: 10 },
  '50-59': { excellent: 32, good: 24, average: 17, belowAverage: 11, poor: 7 },
  '60-69': { excellent: 25, good: 18, average: 12, belowAverage: 7, poor: 4 },
  '70-79': { excellent: 18, good: 12, average: 7, belowAverage: 4, poor: 2 },
  '80+': { excellent: 10, good: 6, average: 4, belowAverage: 2, poor: 1 },
};

export const MALE_SINGLE_LEG_STANCE_NORMS: AgeGroupNorms = {
  '18-39': { excellent: 50, good: 40, average: 30, belowAverage: 20, poor: 13 },
  '40-49': { excellent: 43, good: 33, average: 25, belowAverage: 17, poor: 11 },
  '50-59': { excellent: 37, good: 27, average: 20, belowAverage: 13, poor: 8 },
  '60-69': { excellent: 29, good: 21, average: 14, belowAverage: 9, poor: 5 },
  '70-79': { excellent: 21, good: 14, average: 9, belowAverage: 5, poor: 3 },
  '80+': { excellent: 12, good: 8, average: 5, belowAverage: 3, poor: 1 },
};

/**
 * Get the age group for single-leg stance norms
 */
export function getSingleLegStanceAgeGroup(age: number): string {
  if (age < 40) return '18-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  if (age < 80) return '70-79';
  return '80+';
}

/**
 * Calculate performance level based on single-leg stance time
 * @param time - Time in seconds (max 60)
 * @param sex - User's sex
 * @param age - User's age
 * @returns Performance level and score
 */
export function evaluateSingleLegStancePerformance(
  time: number,
  sex: 'male' | 'female',
  age: number
): {
  level: string;
  description: string;
  score: number; // 0-4 for scoring system
  fallRisk: string;
  mortalityNote?: string;
} {
  const ageGroup = getSingleLegStanceAgeGroup(age);
  const norms = sex === 'male' ? MALE_SINGLE_LEG_STANCE_NORMS[ageGroup] : FEMALE_SINGLE_LEG_STANCE_NORMS[ageGroup];

  // Special note for inability to stand for 10 seconds (based on BMJ Open 2022 study)
  const mortalityNote = time < 10 && age >= 51 
    ? 'Unable to stand for 10 seconds is associated with increased mortality risk in adults over 50.'
    : undefined;

  if (time >= norms.excellent) {
    return {
      level: 'Excellent',
      description: 'Top 20% - Outstanding balance',
      score: 4,
      fallRisk: 'Very Low',
      mortalityNote
    };
  } else if (time >= norms.good) {
    return {
      level: 'Good',
      description: 'Top 40% - Above average balance',
      score: 3,
      fallRisk: 'Low',
      mortalityNote
    };
  } else if (time >= norms.average) {
    return {
      level: 'Average',
      description: 'Middle 20% - Average balance',
      score: 2,
      fallRisk: 'Moderate',
      mortalityNote
    };
  } else if (time >= norms.belowAverage) {
    return {
      level: 'Below Average',
      description: 'Lower 20% - Below average balance',
      score: 1,
      fallRisk: 'Elevated',
      mortalityNote
    };
  } else {
    return {
      level: 'Needs Improvement',
      description: 'Bottom 20% - Balance training recommended',
      score: 0,
      fallRisk: 'High',
      mortalityNote
    };
  }
}

/**
 * Get reference values for display
 */
export function getSingleLegStanceReferenceValues(sex: 'male' | 'female', age: number) {
  const ageGroup = getSingleLegStanceAgeGroup(age);
  const norms = sex === 'male' ? MALE_SINGLE_LEG_STANCE_NORMS[ageGroup] : FEMALE_SINGLE_LEG_STANCE_NORMS[ageGroup];

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
export function getClinicalInterpretation(time: number, age: number): string {
  const interpretations: { [key: string]: string } = {};
  
  if (age < 51) {
    if (time >= 30) return 'Excellent postural control. Low fall risk.';
    if (time >= 20) return 'Good balance. Appropriate for age.';
    if (time >= 12) return 'Average balance. Consider balance training for improvement.';
    if (time >= 7) return 'Below average. Recommend balance training program.';
    return 'Poor balance control. Consider comprehensive fall risk assessment.';
  } else {
    // Age 51+, include mortality prediction context
    if (time >= 20) return 'Excellent balance for age. Associated with reduced mortality risk.';
    if (time >= 12) return 'Good balance. Maintain with regular balance exercises.';
    if (time >= 10) return 'Average balance. Consider structured balance training.';
    if (time >= 7) return 'Below average. Elevated fall risk. Balance training recommended.';
    return 'Poor balance. High fall risk and associated with increased mortality risk. Recommend urgent fall prevention program and medical evaluation.';
  }
}

