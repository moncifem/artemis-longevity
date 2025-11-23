import { ACHIEVEMENTS, Achievement } from '@/constants/achievements';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  isNew: boolean;
}

export interface AchievementProgress {
  unlockedAchievements: UnlockedAchievement[];
  totalXP: number;
}

const STORAGE_KEY = 'achievementProgress';

export const getAchievementProgress = async (): Promise<AchievementProgress> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return { unlockedAchievements: [], totalXP: 0 };
  } catch (error) {
    console.error('Error loading achievement progress:', error);
    return { unlockedAchievements: [], totalXP: 0 };
  }
};

export const saveAchievementProgress = async (progress: AchievementProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving achievement progress:', error);
  }
};

export const unlockAchievement = async (achievementId: string): Promise<boolean> => {
  try {
    const progress = await getAchievementProgress();
    
    // Check if already unlocked
    const alreadyUnlocked = progress.unlockedAchievements.some(
      ua => ua.achievementId === achievementId
    );
    
    if (alreadyUnlocked) {
      return false;
    }
    
    // Unlock the achievement
    progress.unlockedAchievements.push({
      achievementId,
      unlockedAt: new Date().toISOString(),
      isNew: true,
    });
    
    await saveAchievementProgress(progress);
    return true;
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return false;
  }
};

export const markAchievementsAsSeen = async (): Promise<void> => {
  try {
    const progress = await getAchievementProgress();
    progress.unlockedAchievements = progress.unlockedAchievements.map(ua => ({
      ...ua,
      isNew: false,
    }));
    await saveAchievementProgress(progress);
  } catch (error) {
    console.error('Error marking achievements as seen:', error);
  }
};

export const checkAndUnlockAchievements = async (userStats: {
  level: number;
  totalWorkouts: number;
  streak: number;
  totalXPEarned: number;
}): Promise<Achievement[]> => {
  const newlyUnlocked: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    let shouldUnlock = false;
    
    switch (achievement.requirement.type) {
      case 'workout_count':
        // Only unlock if EXACTLY at the threshold or just passed it
        shouldUnlock = userStats.totalWorkouts === achievement.requirement.value;
        break;
      case 'streak':
        // Only unlock if EXACTLY at the threshold
        shouldUnlock = userStats.streak === achievement.requirement.value;
        break;
      case 'level':
        // Only unlock if EXACTLY at the level
        shouldUnlock = userStats.level === achievement.requirement.value;
        break;
      case 'xp':
        // Check total cumulative XP earned
        shouldUnlock = userStats.totalXPEarned >= achievement.requirement.value;
        break;
      case 'perfect_week':
        // This requires special logic - not auto-unlocked
        shouldUnlock = false;
        break;
    }
    
    if (shouldUnlock) {
      const wasUnlocked = await unlockAchievement(achievement.id);
      if (wasUnlocked) {
        newlyUnlocked.push(achievement);
      }
    }
  }
  
  return newlyUnlocked;
};

export const getUnlockedAchievements = async (): Promise<Achievement[]> => {
  const progress = await getAchievementProgress();
  return ACHIEVEMENTS.filter(a => 
    progress.unlockedAchievements.some(ua => ua.achievementId === a.id)
  );
};

export const getNewAchievements = async (): Promise<Achievement[]> => {
  const progress = await getAchievementProgress();
  const newIds = progress.unlockedAchievements
    .filter(ua => ua.isNew)
    .map(ua => ua.achievementId);
  
  return ACHIEVEMENTS.filter(a => newIds.includes(a.id));
};

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

export const calculateAchievementProgress = async (): Promise<{
  unlockedCount: number;
  totalCount: number;
  percentage: number;
}> => {
  const unlocked = await getUnlockedAchievements();
  const total = ACHIEVEMENTS.length;
  return {
    unlockedCount: unlocked.length,
    totalCount: total,
    percentage: Math.round((unlocked.length / total) * 100),
  };
};

