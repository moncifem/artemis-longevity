import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Alert, 
  Modal, 
  Animated,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// --- Types ---

interface ExerciseProgress {
  completed: boolean;
  currentSets: number;
  currentReps: number;
  notes: string;
  lastCompleted?: string; // ISO Date string
}

interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

interface WorkoutProgress {
  [exerciseId: string]: ExerciseProgress;
}

// --- Data ---

const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 5000, 10000]; // XP needed for each level

const workoutExercises = [
  {
    id: 'sit-to-stand',
    exercise: 'Sit-to-Stand',
    pattern: 'Lower – Squat',
    reps: '8–12',
    sets: '2–3',
    notes: 'Control the descent. Stand up fast for power!',
    icon: '💺',
    xp: 50,
    gradient: ['#8B5CF6', '#A78BFA'] as const,
  },
  {
    id: 'glute-bridge',
    exercise: 'Glute Bridge',
    pattern: 'Lower – Hinge',
    reps: '10–15',
    sets: '2–3',
    notes: 'Squeeze glutes at the top.',
    icon: '🍑',
    xp: 40,
    gradient: ['#EC4899', '#F472B6'] as const,
  },
  {
    id: 'wall-pushup',
    exercise: 'Wall Push-Up',
    pattern: 'Upper – Push',
    reps: '8–12',
    sets: '2–3',
    notes: 'Keep body straight. Push with force.',
    icon: '💪',
    xp: 50,
    gradient: ['#10B981', '#34D399'] as const,
  },
  {
    id: 'bent-over-row',
    exercise: 'Bent-Over Row',
    pattern: 'Upper – Pull',
    reps: '8–12',
    sets: '2–3',
    notes: 'Keep back flat. Squeeze shoulder blades.',
    icon: '🏋️',
    xp: 45,
    gradient: ['#F59E0B', '#FBBF24'] as const,
  },
  {
    id: 'calf-raise',
    exercise: 'Calf Raise',
    pattern: 'Lower – Accessory',
    reps: '12–15',
    sets: '2',
    notes: 'Use wall for balance if needed.',
    icon: '🦵',
    xp: 30,
    gradient: ['#6366F1', '#818CF8'] as const,
  },
  {
    id: 'bird-dog',
    exercise: 'Bird Dog',
    pattern: 'Core – Stability',
    reps: '5–8/side',
    sets: '2',
    notes: 'Move slowly. Keep core tight.',
    icon: '🐦',
    xp: 40,
    gradient: ['#14B8A6', '#2DD4BF'] as const,
  },
  {
    id: 'dead-bug',
    exercise: 'Dead Bug',
    pattern: 'Core – Lower',
    reps: '8–10',
    sets: '2',
    notes: 'Keep lower back pressed to floor.',
    icon: '🐛',
    xp: 40,
    gradient: ['#F43F5E', '#FB7185'] as const,
  },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress>({});
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    currentXP: 0,
    nextLevelXP: LEVEL_THRESHOLDS[1],
    streak: 0,
    totalWorkouts: 0,
    lastWorkoutDate: null,
  });
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animation values
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    // Animate XP bar when stats change
    const progress = userStats.currentXP / userStats.nextLevelXP;
    Animated.timing(xpBarAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [userStats]);

  const loadData = async () => {
    try {
      const [progressStr, statsStr] = await Promise.all([
        AsyncStorage.getItem('workoutProgress'),
        AsyncStorage.getItem('userStats'),
      ]);

      if (progressStr) setWorkoutProgress(JSON.parse(progressStr));
      
      if (statsStr) {
        setUserStats(JSON.parse(statsStr));
      } else {
        // Initialize stats if new user
        const initialStats = {
          level: 1,
          currentXP: 0,
          nextLevelXP: LEVEL_THRESHOLDS[1],
          streak: 0,
          totalWorkouts: 0,
          lastWorkoutDate: null,
        };
        setUserStats(initialStats);
        AsyncStorage.setItem('userStats', JSON.stringify(initialStats));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const triggerHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExerciseComplete = async (exerciseId: string, xpReward: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    const isCompleting = !workoutProgress[exerciseId]?.completed;
    const now = new Date().toISOString();
    
    const newProgress = { ...workoutProgress };
    
    if (isCompleting) {
      // Mark as complete
      newProgress[exerciseId] = {
        completed: true,
        currentSets: parseInt(workoutExercises.find(e => e.id === exerciseId)?.sets.split('–')[0] || '2'),
        currentReps: parseInt(workoutExercises.find(e => e.id === exerciseId)?.reps.split('–')[0] || '8'),
        notes: '',
        lastCompleted: now,
      };
      triggerHaptic();
      
      // Update Stats
      updateStats(xpReward);
    } else {
      // Uncheck (remove XP logic if strict, but for now just toggle off)
      delete newProgress[exerciseId];
      // Optional: Deduct XP? Usually better to not punish in gamification, 
      // but for accuracy we might want to track session-based XP instead.
      // For this simple version, we keep XP earned to encourage usage.
    }

    setWorkoutProgress(newProgress);
    await AsyncStorage.setItem('workoutProgress', JSON.stringify(newProgress));
    
    // Check if all completed for celebration
    const allCompleted = workoutExercises.every(ex => newProgress[ex.id]?.completed || (ex.id === exerciseId && isCompleting));
    if (allCompleted && isCompleting) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const updateStats = async (xpGained: number) => {
    let { level, currentXP, nextLevelXP, streak, lastWorkoutDate, totalWorkouts } = userStats;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = lastWorkoutDate ? lastWorkoutDate.split('T')[0] : null;

    // XP Logic
    currentXP += xpGained;
    if (currentXP >= nextLevelXP) {
      level++;
      currentXP = currentXP - nextLevelXP;
      nextLevelXP = LEVEL_THRESHOLDS[level] || nextLevelXP * 1.5;
      Alert.alert('🎉 Level Up!', `You are now Level ${level}! Keep getting stronger!`);
    }

    // Streak Logic
    if (today !== lastDate) {
      totalWorkouts++;
      
      // Check if consecutive day
      if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === yesterdayStr) {
          streak++;
        } else {
          streak = 1; // Reset or start new
        }
      } else {
        streak = 1;
      }
    }

    const newStats = {
      level,
      currentXP,
      nextLevelXP,
      streak,
      totalWorkouts,
      lastWorkoutDate: new Date().toISOString(),
    };

    setUserStats(newStats);
    await AsyncStorage.setItem('userStats', JSON.stringify(newStats));
  };

  const getLevelTitle = (lvl: number) => {
    if (lvl < 2) return "Beginner";
    if (lvl < 5) return "Consistency Keeper";
    if (lvl < 10) return "Strength Builder";
    return "Longevity Master";
  };

  const getWeeklyCalendar = () => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const isDayCompleted = (date: Date) => {
    // In a real app, we'd query a workout history log. 
    // For this demo, we'll assume if lastWorkoutDate matches, it's done.
    if (!userStats.lastWorkoutDate) return false;
    return userStats.lastWorkoutDate.startsWith(date.toISOString().split('T')[0]);
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <LinearGradient
      colors={[theme.card, theme.background]}
      style={styles.headerContainer}
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.userName, { color: theme.text }]}>Fitness Warrior</Text>
        </View>
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>{userStats.streak}</Text>
          <Ionicons name="flame" size={24} color="#F59E0B" />
        </View>
      </View>

      {/* XP Bar */}
      <View style={styles.levelContainer}>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelText, { color: theme.primary }]}>
            Level {userStats.level} <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>• {getLevelTitle(userStats.level)}</Text>
          </Text>
          <Text style={[styles.xpText, { color: theme.textSecondary }]}>
            {Math.floor(userStats.currentXP)} / {Math.floor(userStats.nextLevelXP)} XP
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.input }]}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: theme.primary,
                width: xpBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]} 
          />
        </View>
      </View>

      {/* Weekly Calendar Strip */}
      <View style={styles.calendarStrip}>
        {getWeeklyCalendar().map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const completed = isDayCompleted(date) || (isToday && Object.keys(workoutProgress).length > 0); // Simple check for today
          
          return (
            <View key={index} style={styles.dayItem}>
              <Text style={[styles.dayName, { color: isToday ? theme.primary : theme.textSecondary }]}>
                {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
              </Text>
              <View style={[
                styles.dayCircle, 
                { 
                  backgroundColor: completed ? theme.primary : theme.input,
                  borderColor: isToday ? theme.primary : 'transparent',
                  borderWidth: isToday ? 1 : 0,
                }
              ]}>
                <Text style={[
                  styles.dayNumber, 
                  { color: completed ? '#FFFFFF' : theme.text }
                ]}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {renderHeader()}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Mission</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {Object.keys(workoutProgress).length}/{workoutExercises.length} Complete
          </Text>
        </View>

        {workoutExercises.map((exercise, index) => {
          const isCompleted = workoutProgress[exercise.id]?.completed;
          
          return (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedExercise(exercise);
                setModalVisible(true);
              }}
              style={[
                styles.exerciseCard,
                { 
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : theme.card,
                  borderColor: isCompleted ? '#10B981' : theme.cardBorder,
                  borderWidth: 1,
                }
              ]}
            >
              <LinearGradient
                colors={exercise.gradient}
                style={styles.exerciseIconContainer}
              >
                <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
              </LinearGradient>

              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.exercise}</Text>
                <View style={styles.exerciseMetaRow}>
                  <Text style={[styles.exercisePattern, { color: theme.textSecondary }]}>{exercise.pattern}</Text>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>+{exercise.xp} XP</Text>
                  </View>
                </View>
                <Text style={[styles.exerciseReps, { color: theme.primary }]}>
                  {exercise.sets} Sets • {exercise.reps} Reps
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkbox,
                  { backgroundColor: isCompleted ? '#10B981' : theme.input }
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleExerciseComplete(exercise.id, exercise.xp);
                }}
              >
                {isCompleted && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Workout Complete!</Text>
        </View>
      )}

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedExercise && (
              <>
                <LinearGradient
                  colors={selectedExercise.gradient}
                  style={styles.modalHeaderGradient}
                >
                  <Text style={styles.modalIconLarge}>{selectedExercise.icon}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
                
                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedExercise.exercise}</Text>
                  <Text style={[styles.modalPattern, { color: theme.textSecondary }]}>{selectedExercise.pattern}</Text>
                  
                  <View style={styles.modalStatsRow}>
                    <View style={[styles.modalStatItem, { backgroundColor: theme.input }]}>
                      <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>SETS</Text>
                      <Text style={[styles.modalStatValue, { color: theme.text }]}>{selectedExercise.sets}</Text>
                    </View>
                    <View style={[styles.modalStatItem, { backgroundColor: theme.input }]}>
                      <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>REPS</Text>
                      <Text style={[styles.modalStatValue, { color: theme.text }]}>{selectedExercise.reps}</Text>
                    </View>
                    <View style={[styles.modalStatItem, { backgroundColor: theme.input }]}>
                      <Text style={[styles.modalStatLabel, { color: theme.textSecondary }]}>XP</Text>
                      <Text style={[styles.modalStatValue, { color: theme.primary }]}>+{selectedExercise.xp}</Text>
                    </View>
                  </View>

                  <View style={[styles.modalNotes, { backgroundColor: theme.input }]}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                    <Text style={[styles.modalNotesText, { color: theme.text }]}>{selectedExercise.notes}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      { backgroundColor: workoutProgress[selectedExercise.id]?.completed ? theme.input : theme.primary }
                    ]}
                    onPress={() => {
                      handleExerciseComplete(selectedExercise.id, selectedExercise.xp);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.completeButtonText,
                      { color: workoutProgress[selectedExercise.id]?.completed ? theme.text : '#FFFFFF' }
                    ]}>
                      {workoutProgress[selectedExercise.id]?.completed ? 'Mark Incomplete' : 'Complete Exercise'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  levelContainer: {
    marginBottom: 24,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseIcon: {
    fontSize: 28,
  },
  exerciseContent: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  exercisePattern: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  xpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  exerciseReps: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footerSpace: {
    height: 100,
  },
  
  // Celebration
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeaderGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalIconLarge: {
    fontSize: 64,
  },
  modalBody: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalPattern: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modalStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalNotes: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  modalNotesText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});