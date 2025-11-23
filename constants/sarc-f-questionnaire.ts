// SARC-F Questionnaire for Sarcopenia Screening
// Validated internationally in 10,000+ older adults
// Screens sarcopenia risk through functional domains
// Aligned with EWGSOP2 and AWGS guidelines

export interface SarcFQuestion {
  id: string;
  question: string;
  domain: string;
  options: Array<{
    text: string;
    score: number;
  }>;
}

/**
 * The SARC-F questionnaire consists of 5 questions across 5 domains:
 * S - Strength
 * A - Assistance with walking
 * R - Rising from a chair
 * C - Climbing stairs
 * F - Falls
 * 
 * Total score: 0-10
 * Score ≥4 indicates sarcopenia risk
 * 
 * Reference: Eur Geriatr Med. 2018;9(1):5-9
 * And: J Am Med Dir Assoc. 2019;20(3):325-329
 */
export const SARC_F_QUESTIONS: SarcFQuestion[] = [
  {
    id: 'strength',
    domain: 'Strength',
    question: 'How much difficulty do you have in lifting and carrying 10 pounds (4.5 kg)?',
    options: [
      { text: 'None', score: 0 },
      { text: 'Some', score: 1 },
      { text: 'A lot or unable', score: 2 },
    ],
  },
  {
    id: 'assistance',
    domain: 'Assistance Walking',
    question: 'How much difficulty do you have walking across a room?',
    options: [
      { text: 'None', score: 0 },
      { text: 'Some', score: 1 },
      { text: 'A lot, use aids, or unable', score: 2 },
    ],
  },
  {
    id: 'rising',
    domain: 'Rising from Chair',
    question: 'How much difficulty do you have transferring from a chair or bed?',
    options: [
      { text: 'None', score: 0 },
      { text: 'Some', score: 1 },
      { text: 'A lot or unable without help', score: 2 },
    ],
  },
  {
    id: 'climbing',
    domain: 'Climbing Stairs',
    question: 'How much difficulty do you have climbing a flight of 10 stairs?',
    options: [
      { text: 'None', score: 0 },
      { text: 'Some', score: 1 },
      { text: 'A lot or unable', score: 2 },
    ],
  },
  {
    id: 'falls',
    domain: 'Falls',
    question: 'How many times have you fallen in the past year?',
    options: [
      { text: 'None', score: 0 },
      { text: '1-3 falls', score: 1 },
      { text: '4 or more falls', score: 2 },
    ],
  },
];

/**
 * Calculate SARC-F total score
 * @param answers - Object with question IDs as keys and scores as values
 * @returns Total score (0-10)
 */
export function calculateSarcFScore(answers: Record<string, number>): number {
  let totalScore = 0;
  SARC_F_QUESTIONS.forEach(q => {
    totalScore += answers[q.id] || 0;
  });
  return totalScore;
}

/**
 * Interpret SARC-F score
 * @param score - Total SARC-F score (0-10)
 * @returns Clinical interpretation
 */
export function interpretSarcFScore(score: number): {
  level: string;
  sarcopeniaRisk: string;
  recommendation: string;
  performanceScore: number; // 0-4 for compatibility with other tests
} {
  if (score >= 4) {
    return {
      level: 'At Risk',
      sarcopeniaRisk: 'High',
      recommendation: 'SARC-F score ≥4 indicates sarcopenia risk. Recommend comprehensive assessment including grip strength, muscle mass measurement (DEXA or BIA), and gait speed evaluation per EWGSOP2 guidelines.',
      performanceScore: 0, // High score = poor performance
    };
  } else if (score >= 2) {
    return {
      level: 'Borderline',
      sarcopeniaRisk: 'Moderate',
      recommendation: 'Some functional limitations detected. Consider preventive resistance training and protein supplementation. Monitor with repeat SARC-F in 6-12 months.',
      performanceScore: 2,
    };
  } else {
    return {
      level: 'Low Risk',
      sarcopeniaRisk: 'Low',
      recommendation: 'No significant functional limitations. Continue regular physical activity and adequate protein intake to maintain muscle health.',
      performanceScore: 4,
    };
  }
}

/**
 * Get component scores for detailed analysis
 * @param answers - Object with question IDs as keys and scores as values
 * @returns Breakdown of scores by domain
 */
export function getSarcFComponentScores(answers: Record<string, number>): {
  strength: number;
  assistance: number;
  rising: number;
  climbing: number;
  falls: number;
  total: number;
} {
  return {
    strength: answers.strength || 0,
    assistance: answers.assistance || 0,
    rising: answers.rising || 0,
    climbing: answers.climbing || 0,
    falls: answers.falls || 0,
    total: calculateSarcFScore(answers),
  };
}

/**
 * Get personalized recommendations based on which domains are impaired
 * @param answers - Object with question IDs as keys and scores as values
 * @returns Array of specific recommendations
 */
export function getPersonalizedRecommendations(answers: Record<string, number>): string[] {
  const recommendations: string[] = [];
  
  if (answers.strength >= 1) {
    recommendations.push('Strength Training: Focus on upper body resistance exercises 2-3x/week');
  }
  
  if (answers.assistance >= 1) {
    recommendations.push('Walking Program: Start with short distances, gradually increase. Consider walking aids if needed.');
  }
  
  if (answers.rising >= 1) {
    recommendations.push('Chair Stands: Practice sit-to-stand exercises daily to improve lower body strength');
  }
  
  if (answers.climbing >= 1) {
    recommendations.push('Stair Training: Practice step-ups or leg strengthening exercises');
  }
  
  if (answers.falls >= 1) {
    recommendations.push('Fall Prevention: Consider balance training, home safety assessment, and medical review of medications');
  }
  
  // General recommendations
  const totalScore = calculateSarcFScore(answers);
  if (totalScore >= 4) {
    recommendations.push('Nutrition: Aim for 1.0-1.2g protein per kg body weight daily');
    recommendations.push('Medical Review: Consult healthcare provider for comprehensive sarcopenia assessment');
  }
  
  return recommendations;
}

