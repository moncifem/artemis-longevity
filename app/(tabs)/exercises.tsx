import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const exerciseCategories = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'strength', label: 'Strength', icon: 'barbell' },
  { id: 'cardio', label: 'Cardio', icon: 'heart' },
  { id: 'flexibility', label: 'Flexibility', icon: 'body' },
  { id: 'balance', label: 'Balance', icon: 'infinite' },
];

const exercises = [
  {
    id: 1,
    title: 'Morning Yoga Flow',
    duration: '15 min',
    difficulty: 'Beginner',
    category: 'flexibility',
    calories: 120,
    icon: '🧘',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    id: 2,
    title: 'HIIT Cardio Blast',
    duration: '20 min',
    difficulty: 'Advanced',
    category: 'cardio',
    calories: 250,
    icon: '🔥',
    gradient: ['#EC4899', '#F472B6'],
  },
  {
    id: 3,
    title: 'Strength Training',
    duration: '30 min',
    difficulty: 'Intermediate',
    category: 'strength',
    calories: 180,
    icon: '💪',
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: 4,
    title: 'Core Stability',
    duration: '15 min',
    difficulty: 'Intermediate',
    category: 'balance',
    calories: 100,
    icon: '⚖️',
    gradient: ['#F59E0B', '#FBBF24'],
  },
  {
    id: 5,
    title: 'Full Body Stretch',
    duration: '10 min',
    difficulty: 'Beginner',
    category: 'flexibility',
    calories: 50,
    icon: '🤸',
    gradient: ['#6366F1', '#818CF8'],
  },
  {
    id: 6,
    title: 'Power Walking',
    duration: '25 min',
    difficulty: 'Beginner',
    category: 'cardio',
    calories: 150,
    icon: '🚶',
    gradient: ['#14B8A6', '#2DD4BF'],
  },
];

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Personalized <Text style={{ color: colors.primary }}>Exercises</Text>
        </Text>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {exerciseCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: colors.primary },
              selectedCategory !== category.id && { backgroundColor: colors.card },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={20} 
              color={selectedCategory === category.id ? '#FFFFFF' : colors.icon} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && { color: '#FFFFFF' },
              selectedCategory !== category.id && { color: colors.text },
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercises List */}
      <ScrollView style={styles.exercisesList} contentContainerStyle={styles.exercisesContent}>
        {filteredExercises.map((exercise) => (
          <TouchableOpacity key={exercise.id} style={styles.exerciseCard}>
            <LinearGradient colors={exercise.gradient} style={styles.exerciseGradient}>
              <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
            </LinearGradient>
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseTitle, { color: colors.text }]}>
                {exercise.title}
              </Text>
              <View style={styles.exerciseMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {exercise.duration}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={14} color={colors.icon} />
                  <Text style={[styles.metaText, { color: colors.icon }]}>
                    {exercise.calories} cal
                  </Text>
                </View>
              </View>
              <View style={[
                styles.difficultyBadge,
                exercise.difficulty === 'Beginner' && { backgroundColor: '#10B98133' },
                exercise.difficulty === 'Intermediate' && { backgroundColor: '#F59E0B33' },
                exercise.difficulty === 'Advanced' && { backgroundColor: '#EF444433' },
              ]}>
                <Text style={[
                  styles.difficultyText,
                  exercise.difficulty === 'Beginner' && { color: '#10B981' },
                  exercise.difficulty === 'Intermediate' && { color: '#F59E0B' },
                  exercise.difficulty === 'Advanced' && { color: '#EF4444' },
                ]}>
                  {exercise.difficulty}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesScroll: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exercisesList: {
    flex: 1,
    marginTop: 20,
  },
  exercisesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  exerciseGradient: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIcon: {
    fontSize: 32,
  },
  exerciseInfo: {
    flex: 1,
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  startButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

