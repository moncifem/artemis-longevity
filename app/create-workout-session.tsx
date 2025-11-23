import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { communityService } from '@/services/community-service';
import { locationService } from '@/services/location-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Only import DateTimePicker on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const WORKOUT_TYPES = [
  { id: 'running', name: 'Running', icon: 'footsteps', color: ['#EC4899', '#F472B6'] },
  { id: 'cycling', name: 'Cycling', icon: 'bicycle', color: ['#8B5CF6', '#A78BFA'] },
  { id: 'gym', name: 'Gym', icon: 'barbell', color: ['#10B981', '#34D399'] },
  { id: 'yoga', name: 'Yoga', icon: 'flower', color: ['#F59E0B', '#FBBF24'] },
  { id: 'hiit', name: 'HIIT', icon: 'flash', color: ['#EF4444', '#F87171'] },
  { id: 'sports', name: 'Sports', icon: 'basketball', color: ['#6366F1', '#818CF8'] },
  { id: 'other', name: 'Other', icon: 'fitness', color: ['#14B8A6', '#2DD4BF'] },
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', color: '#10B981' },
  { id: 'moderate', name: 'Moderate', color: '#F59E0B' },
  { id: 'hard', name: 'Hard', color: '#EF4444' },
];

export default function CreateWorkoutSessionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('running');
  const [selectedDifficulty, setSelectedDifficulty] = useState('moderate');
  const [date, setDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        const address = await locationService.reverseGeocode(
          location.latitude,
          location.longitude
        );
        if (address) {
          setPlaceName(address);
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Could not get your location. Please enable location services.');
      return;
    }

    setLoading(true);
    try {
      // Get user profile for creator name
      const profileStr = await AsyncStorage.getItem('userProfile');
      const profile = profileStr ? JSON.parse(profileStr) : { name: 'User' };

      const session = await communityService.createWorkoutSession({
        title: title.trim(),
        description: description.trim() || 'Join me for a workout!',
        creatorId: 'current-user', // This should be actual user ID
        creatorName: profile.name,
        type: selectedType as any,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          placeName: placeName.trim() || undefined,
        },
        dateTime: date.getTime(),
        duration: parseInt(duration) || 60,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        difficulty: selectedDifficulty as any,
      });

      Alert.alert(
        'Success',
        'Workout session created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create workout session');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Session</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Morning Run in Central Park"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell others what to expect..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        {/* Workout Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Workout Type *</Text>
          <View style={styles.typeGrid}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.card },
                  selectedType === type.id && { borderWidth: 2, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <LinearGradient colors={type.color} style={styles.typeIcon}>
                  <Ionicons name={type.icon as any} size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.typeName, { color: colors.text }]}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.card, flex: 1 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.card, flex: 1 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          
          {showTimePicker && Platform.OS !== 'web' && DateTimePicker && (
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
          
          {Platform.OS === 'web' && (showDatePicker || showTimePicker) && (
            <Text style={[styles.webPickerNote, { color: colors.textSecondary }]}>
              Note: Native date/time picker is only available on mobile devices
            </Text>
          )}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Duration (minutes) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={duration}
            onChangeText={setDuration}
            placeholder="60"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Difficulty *</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.difficultyButton,
                  { backgroundColor: colors.card },
                  selectedDifficulty === level.id && {
                    backgroundColor: level.color + '20',
                    borderWidth: 2,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setSelectedDifficulty(level.id)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: selectedDifficulty === level.id ? level.color : colors.text },
                  ]}
                >
                  {level.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Max Participants (optional)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="Leave empty for unlimited"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
            <Ionicons name="location" size={24} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={[styles.locationText, { color: colors.text }]}>
                {placeName || 'Current location'}
              </Text>
              <Text style={[styles.locationSubtext, { color: colors.textSecondary }]}>
                Using your current GPS location
              </Text>
            </View>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, marginTop: 12 }]}
            value={placeName}
            onChangeText={setPlaceName}
            placeholder="Add a place name (optional)"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.5 }]}
          onPress={handleCreateSession}
          disabled={loading}
        >
          <LinearGradient colors={colors.gradients.button} style={styles.createButtonGradient}>
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Workout Session'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeName: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
  },
  locationSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  createButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  webPickerNote: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});

