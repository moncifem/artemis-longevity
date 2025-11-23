import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { communityService } from '@/services/community-service';
import { WorkoutSession } from '@/types/community';

export default function WorkoutSessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const sessions = await communityService.getWorkoutSessions();
      const found = sessions.find((s) => s.id === id);
      if (found) {
        setSession(found);
        // Check if current user has joined (mock user ID for now)
        setIsJoined(found.participants.includes('current-user'));
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session) return;

    setJoining(true);
    try {
      await communityService.joinWorkoutSession(session.id, 'current-user');
      setIsJoined(true);
      await loadSession();
      Alert.alert('Success', `You've joined ${session.title}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join session');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!session) return;

    Alert.alert(
      'Leave Session',
      'Are you sure you want to leave this workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setJoining(true);
            try {
              await communityService.leaveWorkoutSession(session.id, 'current-user');
              setIsJoined(false);
              await loadSession();
              Alert.alert('Left Session', 'You have left the workout session');
            } catch (error) {
              Alert.alert('Error', 'Failed to leave session');
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const getWorkoutIcon = (type: string) => {
    const icons: Record<string, any> = {
      running: 'footsteps',
      cycling: 'bicycle',
      gym: 'barbell',
      yoga: 'flower',
      hiit: 'flash',
      sports: 'basketball',
      other: 'fitness',
    };
    return icons[type] || 'fitness';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: '#10B981',
      moderate: '#F59E0B',
      hard: '#EF4444',
    };
    return colors[difficulty as keyof typeof colors] || '#6B7280';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Session not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sessionDate = new Date(session.dateTime);
  const isToday = new Date().toDateString() === sessionDate.toDateString();
  const isFull = session.maxParticipants
    ? session.participants.length >= session.maxParticipants
    : false;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Workout Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Session Header */}
        <LinearGradient colors={colors.gradients.primary} style={styles.sessionHeader}>
          <View style={styles.sessionIconLarge}>
            <Ionicons name={getWorkoutIcon(session.type)} size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.sessionTitle}>{session.title}</Text>
          <Text style={styles.sessionCreator}>Created by {session.creatorName}</Text>
        </LinearGradient>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {isToday ? 'Today' : sessionDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Time</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <Ionicons name="stopwatch" size={24} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{session.duration} min</Text>
          </View>
        </View>

        {/* Description */}
        {session.description && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {session.description}
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="fitness" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Difficulty</Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(session.difficulty) + '20' },
              ]}
            >
              <Text style={[styles.difficultyText, { color: getDifficultyColor(session.difficulty) }]}>
                {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Participants</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {session.participants.length}
              {session.maxParticipants ? `/${session.maxParticipants}` : ''}
            </Text>
          </View>
        </View>

        {/* Location */}
        {session.location.placeName && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={24} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.text }]}>
                {session.location.placeName}
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {isJoined ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary }]}
            onPress={handleLeave}
            disabled={joining}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {joining ? 'Leaving...' : 'Joined'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, joining && { opacity: 0.5 }]}
            onPress={handleJoin}
            disabled={joining || isFull}
          >
            <LinearGradient colors={colors.gradients.button} style={styles.actionButtonGradient}>
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonTextWhite}>
                {joining ? 'Joining...' : isFull ? 'Session Full' : 'Join Session'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
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
    paddingBottom: 100,
  },
  sessionHeader: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
  },
  sessionIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sessionCreator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  infoCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  actionButton: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
    width: '100%',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionButtonTextWhite: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

