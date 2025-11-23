import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

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
  lastCompleted?: string;
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

interface WorkoutHistory {
  [dateKey: string]: WorkoutProgress; // dateKey format: "2025-01-15"
}

interface EducationVideo {
  id: number;
  title: string;
  duration: string;
  url: string;
  icon: string;
  description: string;
}

// --- Data ---

const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 5000, 10000];

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
    tutorialUrl: 'https://www.youtube.com/watch?v=eutszbtbJM8',
  },
  {
    id: 'glute-bridge',
    exercise: 'Glute Bridge',
    pattern: 'Lower – Hinge',
    reps: '10–15',
    sets: '2–3',
    notes: 'Squeeze glutes at the top.',
    icon: '🔺',
    xp: 40,
    gradient: ['#EC4899', '#F472B6'] as const,
    tutorialUrl: 'https://www.youtube.com/watch?v=tqp5XQPpTxY',
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
    tutorialUrl: 'https://www.youtube.com/watch?v=oduG4CjpSw0',
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
    tutorialUrl: null,
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
    tutorialUrl: null,
  },
  {
    id: 'bird-dog',
    exercise: 'Bird Dog',
    pattern: 'Core – Stability',
    reps: '5–8/side',
    sets: '2',
    notes: 'Move slowly. Keep core tight.',
    icon: '🧘',
    xp: 40,
    gradient: ['#14B8A6', '#2DD4BF'] as const,
    tutorialUrl: null,
  },
  {
    id: 'dead-bug',
    exercise: 'Dead Bug',
    pattern: 'Core – Lower',
    reps: '8–10',
    sets: '2',
    notes: 'Keep lower back pressed to floor.',
    icon: '🔄',
    xp: 40,
    gradient: ['#F43F5E', '#FB7185'] as const,
    tutorialUrl: null,
  },
];

const educationVideos: EducationVideo[] = [
  {
    id: 1,
    title: 'Setting up your space for strength training at home',
    duration: '4:53',
    url: 'https://www.youtube.com/watch?v=xevm2OpOXWU',
    icon: '🏠',
    description: 'Learn how to create the perfect workout space at home.',
  },
  {
    id: 2,
    title: 'What exercises should I choose?',
    duration: '1:42',
    url: 'https://www.youtube.com/watch?v=5vWREr7GmEY',
    icon: '🎯',
    description: 'Discover which exercises are best for your goals.',
  },
  {
    id: 3,
    title: 'What weight should I choose?',
    duration: '4:41',
    url: 'https://www.youtube.com/watch?v=l1ySeUR6lTo',
    icon: '⚖️',
    description: 'Find the right weight to maximize your results safely.',
  },
  {
    id: 4,
    title: 'What is progressive overload?',
    duration: '2:31',
    url: 'https://www.youtube.com/watch?v=OzeAJox3kiY',
    icon: '📈',
    description: 'Understand the key principle for building strength.',
  },
  {
    id: 5,
    title: 'Key terms explained',
    duration: '7:18',
    url: 'https://www.youtube.com/watch?v=nxN1KLn56Eg',
    icon: '📚',
    description: 'Master essential fitness terminology.',
  },
  {
    id: 6,
    title: 'What can I expect in my first strength training session?',
    duration: '6:40',
    url: 'https://www.youtube.com/watch?v=lE56gPQlLp8',
    icon: '💪',
    description: 'Prepare for your first workout with confidence.',
  },
  {
    id: 7,
    title: 'Warm up, cool-down and recovery',
    duration: '3:57',
    url: 'https://www.youtube.com/watch?v=kpC2FlFdBEk',
    icon: '🧘',
    description: 'Learn proper warm-up and recovery techniques.',
  },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory>({});
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
  const [educationModalVisible, setEducationModalVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const xpBarAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    const progress = userStats.currentXP / userStats.nextLevelXP;
    Animated.timing(xpBarAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [userStats]);

  useEffect(() => {
    // Load progress for selected date
    const dateKey = formatDateKey(selectedDate);
    setWorkoutProgress(workoutHistory[dateKey] || {});
  }, [selectedDate, workoutHistory]);

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const loadData = async () => {
    try {
      const [historyStr, statsStr] = await Promise.all([
        AsyncStorage.getItem('workoutHistory'),
        AsyncStorage.getItem('userStats'),
      ]);

      let history: WorkoutHistory = {};
      if (historyStr) {
        history = JSON.parse(historyStr);
      } else {
        // Generate mock history for past 14 days
        history = generateMockHistory();
        await AsyncStorage.setItem('workoutHistory', JSON.stringify(history));
      }
      setWorkoutHistory(history);

      if (statsStr) {
        setUserStats(JSON.parse(statsStr));
      } else {
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

  const generateMockHistory = (): WorkoutHistory => {
    const history: WorkoutHistory = {};
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      
      // 70% chance of having a workout on any given day
      if (Math.random() > 0.3) {
        const mockProgress: WorkoutProgress = {};
        
        // Randomly complete 3-7 exercises
        const numCompleted = 3 + Math.floor(Math.random() * 5);
        const shuffled = [...workoutExercises].sort(() => Math.random() - 0.5);
        
        for (let j = 0; j < numCompleted && j < shuffled.length; j++) {
          const exercise = shuffled[j];
          mockProgress[exercise.id] = {
            completed: true,
            currentSets: parseInt(exercise.sets.split('–')[0]),
            currentReps: parseInt(exercise.reps.split('–')[0]) + Math.floor(Math.random() * 3),
            notes: '',
            lastCompleted: date.toISOString(),
          };
        }
        
        history[dateKey] = mockProgress;
      }
    }
    
    return history;
  };

  const triggerHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExerciseComplete = async (exerciseId: string, xpReward: number) => {
    const today = new Date();
    const isToday = formatDateKey(selectedDate) === formatDateKey(today);
    
    if (!isToday) {
      Alert.alert('Past Date', 'You can only mark exercises complete for today!');
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    const isCompleting = !workoutProgress[exerciseId]?.completed;
    const now = new Date().toISOString();
    const dateKey = formatDateKey(selectedDate);
    
    const newProgress = { ...workoutProgress };
    const newHistory = { ...workoutHistory };
    
    if (isCompleting) {
      newProgress[exerciseId] = {
        completed: true,
        currentSets: parseInt(workoutExercises.find(e => e.id === exerciseId)?.sets.split('–')[0] || '2'),
        currentReps: parseInt(workoutExercises.find(e => e.id === exerciseId)?.reps.split('–')[0] || '8'),
        notes: '',
        lastCompleted: now,
      };
      triggerHaptic();
      updateStats(xpReward);
    } else {
      delete newProgress[exerciseId];
    }

    newHistory[dateKey] = newProgress;
    setWorkoutHistory(newHistory);
    setWorkoutProgress(newProgress);
    await AsyncStorage.setItem('workoutHistory', JSON.stringify(newHistory));
    
    const allCompleted = workoutExercises.every(ex => newProgress[ex.id]?.completed);
    if (allCompleted && isCompleting) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const updateStats = async (xpGained: number) => {
    let { level, currentXP, nextLevelXP, streak, lastWorkoutDate, totalWorkouts } = userStats;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = lastWorkoutDate ? lastWorkoutDate.split('T')[0] : null;

    currentXP += xpGained;
    if (currentXP >= nextLevelXP) {
      level++;
      currentXP = currentXP - nextLevelXP;
      nextLevelXP = LEVEL_THRESHOLDS[level] || nextLevelXP * 1.5;
      Alert.alert('🎉 Level Up!', `You are now Level ${level}! Keep getting stronger!`);
    }

    if (today !== lastDate) {
      totalWorkouts++;
      
      if (lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === yesterdayStr) {
          streak++;
        } else {
          streak = 1;
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

  const navigateDate = (direction: 'prev' | 'next') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    
    // Don't allow future dates
    if (newDate > new Date()) {
      return;
    }
    
    setSelectedDate(newDate);
  };

  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());
  const isFutureDate = selectedDate > new Date();

  const openEducationVideo = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open video');
    });
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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.educationButton, { backgroundColor: theme.input }]}
            onPress={() => setEducationModalVisible(true)}
          >
            <Ionicons name="school" size={20} color={theme.primary} />
          </TouchableOpacity>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>{userStats.streak}</Text>
            <Ionicons name="flame" size={24} color="#F59E0B" />
          </View>
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

      {/* Date Navigator */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity 
          style={[styles.dateNavButton, { backgroundColor: theme.input }]}
          onPress={() => navigateDate('prev')}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.dateDisplay}>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
            })}
          </Text>
          <Text style={[styles.dayText, { color: theme.textSecondary }]}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.dateNavButton, 
            { backgroundColor: isFutureDate || isToday ? theme.cardBorder : theme.input }
          ]}
          onPress={() => navigateDate('next')}
          disabled={isFutureDate || isToday}
        >
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isFutureDate || isToday ? theme.textSecondary : theme.text} 
          />
        </TouchableOpacity>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isToday ? "Today's Mission" : 'Workout History'}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {Object.keys(workoutProgress).length}/{workoutExercises.length} Complete
          </Text>
        </View>

        {!isToday && Object.keys(workoutProgress).length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
            <Text style={styles.emptyStateEmoji}>📅</Text>
            <Text style={[styles.emptyStateText, { color: theme.text }]}>No workout recorded</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
              Rest day or data not available
            </Text>
          </View>
        )}

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
                disabled={!isToday}
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

      {/* Exercise Detail Modal */}
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

                  {selectedExercise.tutorialUrl && (
                    <TouchableOpacity
                      style={[styles.tutorialButton, { backgroundColor: theme.input, borderColor: theme.primary, borderWidth: 2 }]}
                      onPress={() => openEducationVideo(selectedExercise.tutorialUrl)}
                    >
                      <Ionicons name="play-circle" size={24} color={theme.primary} />
                      <Text style={[styles.tutorialButtonText, { color: theme.primary }]}>
                        Watch Tutorial Video
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isToday && (
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
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Education Modal */}
      <Modal
        visible={educationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEducationModalVisible(false)}
      >
        <LinearGradient
          colors={theme.gradients.background}
          style={styles.educationModalContainer}
        >
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          
          <View style={styles.educationHeader}>
            <View style={styles.educationHeaderContent}>
              <View style={[styles.educationIconCircle, { backgroundColor: theme.input }]}>
                <Ionicons name="school" size={32} color={theme.primary} />
              </View>
              <View style={styles.educationHeaderText}>
                <Text style={[styles.educationTitle, { color: theme.text }]}>Learn the Basics</Text>
                <Text style={[styles.educationSubtitle, { color: theme.textSecondary }]}>
                  STRONGER at HOME Series
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.educationCloseButton, { backgroundColor: theme.card }]}
              onPress={() => setEducationModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.educationContent}
            contentContainerStyle={styles.educationScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.educationIntro, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
              <Text style={[styles.educationIntroText, { color: theme.text }]}>
                Watch these educational videos to master the fundamentals of strength training at home.
              </Text>
            </View>

            {educationVideos.map((video, index) => (
              <TouchableOpacity
                key={video.id}
                style={[styles.videoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                onPress={() => openEducationVideo(video.url)}
                activeOpacity={0.8}
              >
                <View style={styles.videoCardHeader}>
                  <View style={[styles.videoNumber, { backgroundColor: theme.input }]}>
                    <Text style={[styles.videoNumberText, { color: theme.primary }]}>{video.id}</Text>
                  </View>
                  <View style={[styles.videoDuration, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                    <Text style={styles.videoDurationText}>{video.duration}</Text>
                  </View>
                </View>
                
                <View style={styles.videoCardContent}>
                  <Text style={styles.videoIcon}>{video.icon}</Text>
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoTitle, { color: theme.text }]}>{video.title}</Text>
                    <Text style={[styles.videoDescription, { color: theme.textSecondary }]}>
                      {video.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.educationFooter}>
              <Text style={[styles.educationFooterText, { color: theme.textSecondary }]}>
                Videos from STRONGER at HOME program
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  educationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
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
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
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

  // Exercise Modal
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
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  tutorialButtonText: {
    fontSize: 16,
    fontWeight: '700',
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

  // Education Modal
  educationModalContainer: {
    flex: 1,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  educationHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  educationIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationHeaderText: {
    flex: 1,
  },
  educationTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  educationSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  educationCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationContent: {
    flex: 1,
  },
  educationScrollContent: {
    padding: 20,
  },
  educationIntro: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  educationIntroText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  videoCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  videoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  videoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoNumberText: {
    fontSize: 16,
    fontWeight: '800',
  },
  videoDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  videoIcon: {
    fontSize: 32,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  videoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  educationFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  educationFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
});