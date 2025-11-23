export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: readonly [string, string];
  requirement: {
    type: 'workout_count' | 'streak' | 'level' | 'xp' | 'exercise_complete' | 'perfect_week';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Workout Count Achievements
  {
    id: 'first_workout',
    title: 'First Steps',
    description: 'Complete your first workout',
    icon: '🌱',
    color: '#10B981',
    gradient: ['#10B981', '#34D399'] as const,
    requirement: { type: 'workout_count', value: 1 },
    rarity: 'common',
  },
  {
    id: '10_workouts',
    title: 'Getting Started',
    description: 'Complete 10 workouts',
    icon: '🔥',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'] as const,
    requirement: { type: 'workout_count', value: 10 },
    rarity: 'common',
  },
  {
    id: '25_workouts',
    title: 'Consistency Builder',
    description: 'Complete 25 workouts',
    icon: '⭐',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    requirement: { type: 'workout_count', value: 25 },
    rarity: 'rare',
  },
  {
    id: '50_workouts',
    title: 'Dedicated Warrior',
    description: 'Complete 50 workouts',
    icon: '💪',
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'] as const,
    requirement: { type: 'workout_count', value: 50 },
    rarity: 'rare',
  },
  {
    id: '100_workouts',
    title: 'Century Club',
    description: 'Complete 100 workouts',
    icon: '💯',
    color: '#6366F1',
    gradient: ['#6366F1', '#818CF8'] as const,
    requirement: { type: 'workout_count', value: 100 },
    rarity: 'epic',
  },

  // Streak Achievements
  {
    id: 'streak_3',
    title: 'Three Day Streak',
    description: 'Work out for 3 days in a row',
    icon: '🔥',
    color: '#F97316',
    gradient: ['#F97316', '#FB923C'] as const,
    requirement: { type: 'streak', value: 3 },
    rarity: 'common',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Work out for 7 days in a row',
    icon: '🎯',
    color: '#EF4444',
    gradient: ['#EF4444', '#F87171'] as const,
    requirement: { type: 'streak', value: 7 },
    rarity: 'rare',
  },
  {
    id: 'streak_14',
    title: 'Two Week Champion',
    description: 'Work out for 14 days in a row',
    icon: '🏆',
    color: '#DC2626',
    gradient: ['#DC2626', '#EF4444'] as const,
    requirement: { type: 'streak', value: 14 },
    rarity: 'epic',
  },
  {
    id: 'streak_30',
    title: 'Unstoppable Force',
    description: 'Work out for 30 days in a row',
    icon: '👑',
    color: '#991B1B',
    gradient: ['#991B1B', '#DC2626'] as const,
    requirement: { type: 'streak', value: 30 },
    rarity: 'legendary',
  },

  // Level Achievements
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    color: '#14B8A6',
    gradient: ['#14B8A6', '#2DD4BF'] as const,
    requirement: { type: 'level', value: 5 },
    rarity: 'rare',
  },
  {
    id: 'level_10',
    title: 'Strength Master',
    description: 'Reach Level 10',
    icon: '💎',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#22D3EE'] as const,
    requirement: { type: 'level', value: 10 },
    rarity: 'epic',
  },
  {
    id: 'level_20',
    title: 'Longevity Legend',
    description: 'Reach Level 20',
    icon: '🌟',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    requirement: { type: 'level', value: 20 },
    rarity: 'legendary',
  },

  // XP Achievements
  {
    id: 'xp_1000',
    title: 'XP Collector',
    description: 'Earn 1,000 XP',
    icon: '💰',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'] as const,
    requirement: { type: 'xp', value: 1000 },
    rarity: 'common',
  },
  {
    id: 'xp_5000',
    title: 'XP Hoarder',
    description: 'Earn 5,000 XP',
    icon: '💸',
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'] as const,
    requirement: { type: 'xp', value: 5000 },
    rarity: 'rare',
  },
  {
    id: 'xp_10000',
    title: 'XP Tycoon',
    description: 'Earn 10,000 XP',
    icon: '💵',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    requirement: { type: 'xp', value: 10000 },
    rarity: 'epic',
  },

  // Perfect Week
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all 7 exercises twice in a week',
    icon: '✨',
    color: '#10B981',
    gradient: ['#10B981', '#34D399'] as const,
    requirement: { type: 'workout_count', value: 2 },
    rarity: 'epic',
  },
  
  // More Achievement Levels
  {
    id: '200_workouts',
    title: 'Double Century',
    description: 'Complete 200 workouts',
    icon: '🎖️',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    requirement: { type: 'workout_count', value: 200 },
    rarity: 'legendary',
  },
  {
    id: 'xp_20000',
    title: 'XP Master',
    description: 'Earn 20,000 XP',
    icon: '💎',
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'] as const,
    requirement: { type: 'xp', value: 20000 },
    rarity: 'legendary',
  },
];

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '#6B7280';
    case 'rare': return '#3B82F6';
    case 'epic': return '#A855F7';
    case 'legendary': return '#F59E0B';
    default: return '#6B7280';
  }
};

export const getRarityLabel = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

