import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { CommunityUser, WorkoutSession, UserPrivacySettings } from '@/types/community';
import { communityService } from '@/services/community-service';
import { locationService } from '@/services/location-service';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'nearby' | 'sessions'>('nearby');
  const [nearbyUsers, setNearbyUsers] = useState<CommunityUser[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);
  const [userDetailVisible, setUserDetailVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNearbyUsers(),
        loadWorkoutSessions(),
        loadPrivacySettings(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyUsers = async () => {
    try {
      const users = await communityService.getNearbyUsers(20);
      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading nearby users:', error);
    }
  };

  const loadWorkoutSessions = async () => {
    try {
      const sessions = await communityService.getNearbyWorkoutSessions(20);
      setWorkoutSessions(sessions);
    } catch (error) {
      console.error('Error loading workout sessions:', error);
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const settings = await communityService.getPrivacySettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEnableLocation = async () => {
    try {
      const permission = await locationService.requestPermissions();
      if (permission.granted) {
        await communityService.updatePrivacySettings({ shareLocation: true, showOnMap: true });
        await loadPrivacySettings();
        await loadNearbyUsers();
        Alert.alert('Success', 'Location sharing enabled');
      } else {
        Alert.alert('Permission Denied', 'Please enable location permissions in your device settings');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable location sharing');
    }
  };

  const toggleLocationSharing = async (value: boolean) => {
    if (value) {
      await handleEnableLocation();
    } else {
      await communityService.updatePrivacySettings({ shareLocation: false, showOnMap: false });
      await loadPrivacySettings();
      Alert.alert('Location Sharing Disabled', 'Other users will not be able to see your location');
    }
  };

  const handleViewMap = () => {
    router.push('/community-map' as any);
  };

  const handleCreateSession = () => {
    router.push('/create-workout-session' as any);
  };

  const handleUserPress = (user: CommunityUser) => {
    setSelectedUser(user);
    setUserDetailVisible(true);
  };

  const handleSessionPress = (session: WorkoutSession) => {
    Alert.alert(
      session.title,
      `${session.description}\n\nWhen: ${new Date(session.dateTime).toLocaleString()}\nDuration: ${session.duration} min\nParticipants: ${session.participants.length}${session.maxParticipants ? `/${session.maxParticipants}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => {
            router.push(`/workout-session/${session.id}` as any);
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading community...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Community
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {privacySettings?.shareLocation ? '📍 Location sharing on' : '📍 Location sharing off'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.card }]}
            onPress={handleViewMap}
          >
            <Ionicons name="map" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.card }]}
            onPress={() => setSettingsVisible(true)}
          >
            <Ionicons name="settings" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Prompt */}
      {!privacySettings?.shareLocation && (
        <TouchableOpacity
          style={[styles.locationPrompt, { backgroundColor: colors.card }]}
          onPress={handleEnableLocation}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            style={styles.locationPromptGradient}
          >
            <Ionicons name="location" size={24} color="#FFFFFF" />
            <View style={styles.locationPromptText}>
              <Text style={styles.locationPromptTitle}>Enable Location Sharing</Text>
              <Text style={styles.locationPromptSubtitle}>
                Find nearby workout partners and groups
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'nearby' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('nearby')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'nearby' ? '#FFFFFF' : colors.icon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'nearby' && { color: '#FFFFFF' },
              activeTab !== 'nearby' && { color: colors.icon },
            ]}
          >
            Nearby ({nearbyUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sessions' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('sessions')}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={activeTab === 'sessions' ? '#FFFFFF' : colors.icon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'sessions' && { color: '#FFFFFF' },
              activeTab !== 'sessions' && { color: colors.icon },
            ]}
          >
            Sessions ({workoutSessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === 'nearby' ? (
          <>
            {nearbyUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No nearby users</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  {privacySettings?.shareLocation
                    ? 'No users found nearby. Try refreshing or check back later.'
                    : 'Enable location sharing to find nearby workout partners'}
                </Text>
              </View>
            ) : (
              nearbyUsers.map((user) => (
                <UserCard key={user.id} user={user} colors={colors} onPress={handleUserPress} />
              ))
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.card }]}
              onPress={handleCreateSession}
            >
              <LinearGradient colors={colors.gradients.primary} style={styles.createButtonGradient}>
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Workout Session</Text>
              </LinearGradient>
            </TouchableOpacity>

            {workoutSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No workout sessions</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  Be the first to create a workout session in your area!
                </Text>
              </View>
            ) : (
              workoutSessions.map((session) => (
                <WorkoutSessionCard
                  key={session.id}
                  session={session}
                  colors={colors}
                  onPress={handleSessionPress}
                  getWorkoutIcon={getWorkoutIcon}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Privacy Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Share Location</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Allow others to see your location
                  </Text>
                </View>
                <Switch
                  value={privacySettings?.shareLocation}
                  onValueChange={toggleLocationSharing}
                  trackColor={{ false: colors.input, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Show on Map</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Display your location on the map
                  </Text>
                </View>
                <Switch
                  value={privacySettings?.showOnMap}
                  onValueChange={(value) =>
                    communityService.updatePrivacySettings({ showOnMap: value }).then(loadPrivacySettings)
                  }
                  trackColor={{ false: colors.input, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  disabled={!privacySettings?.shareLocation}
                />
              </View>

              <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Allow Workout Invites
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Let others invite you to workout sessions
                  </Text>
                </View>
                <Switch
                  value={privacySettings?.allowWorkoutInvites}
                  onValueChange={(value) =>
                    communityService
                      .updatePrivacySettings({ allowWorkoutInvites: value })
                      .then(loadPrivacySettings)
                  }
                  trackColor={{ false: colors.input, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        visible={userDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.userDetailHeader}>
                    <View style={[styles.userDetailAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.userDetailAvatarText}>{selectedUser.avatar}</Text>
                    </View>
                    <View>
                      <Text style={[styles.userDetailName, { color: colors.text }]}>
                        {selectedUser.name}
                      </Text>
                      <Text style={[styles.userDetailMeta, { color: colors.textSecondary }]}>
                        {selectedUser.age} years • {selectedUser.fitnessLevel}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setUserDetailVisible(false)}>
                    <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.userDetailContent}>
                  {selectedUser.distance && (
                    <View style={[styles.userDetailInfo, { backgroundColor: colors.card }]}>
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <Text style={[styles.userDetailInfoText, { color: colors.text }]}>
                        {selectedUser.distance.toFixed(1)} km away
                      </Text>
                    </View>
                  )}

                  {selectedUser.bio && (
                    <View style={styles.userDetailSection}>
                      <Text style={[styles.userDetailSectionTitle, { color: colors.text }]}>
                        Bio
                      </Text>
                      <Text style={[styles.userDetailBio, { color: colors.textSecondary }]}>
                        {selectedUser.bio}
                      </Text>
                    </View>
                  )}

                  {selectedUser.interests && selectedUser.interests.length > 0 && (
                    <View style={styles.userDetailSection}>
                      <Text style={[styles.userDetailSectionTitle, { color: colors.text }]}>
                        Interests
                      </Text>
                      <View style={styles.interestsList}>
                        {selectedUser.interests.map((interest, index) => (
                          <View
                            key={index}
                            style={[styles.interestTag, { backgroundColor: colors.card }]}
                          >
                            <Text style={[styles.interestText, { color: colors.primary }]}>
                              {interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.connectButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setUserDetailVisible(false);
                      Alert.alert('Coming Soon', 'Direct messaging feature coming soon!');
                    }}
                  >
                    <Text style={styles.connectButtonText}>Send Message</Text>
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

function UserCard({ user, colors, onPress }: any) {
  return (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.card }]}
      onPress={() => onPress(user)}
    >
      <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
        <Text style={styles.userAvatarText}>{user.avatar}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.userMeta, { color: colors.textSecondary }]}>
          {user.fitnessLevel} • {user.distance ? `${user.distance.toFixed(1)} km away` : 'Location hidden'}
        </Text>
        {user.bio && (
          <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
            {user.bio}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.icon} />
    </TouchableOpacity>
  );
}

function WorkoutSessionCard({ session, colors, onPress, getWorkoutIcon }: any) {
  const sessionDate = new Date(session.dateTime);
  const isToday = new Date().toDateString() === sessionDate.toDateString();
  
  return (
    <TouchableOpacity
      style={[styles.sessionCard, { backgroundColor: colors.card }]}
      onPress={() => onPress(session)}
    >
      <LinearGradient colors={colors.gradients.primary} style={styles.sessionIcon}>
        <Ionicons name={getWorkoutIcon(session.type)} size={28} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionTitle, { color: colors.text }]}>{session.title}</Text>
        <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
          {isToday ? 'Today' : sessionDate.toLocaleDateString()} • {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetail}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={[styles.sessionDetailText, { color: colors.textSecondary }]}>
              {session.participants.length}{session.maxParticipants ? `/${session.maxParticipants}` : ''}
            </Text>
          </View>
          <View style={styles.sessionDetail}>
            <Ionicons name="time" size={14} color={colors.textSecondary} />
            <Text style={[styles.sessionDetailText, { color: colors.textSecondary }]}>
              {session.duration} min
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(session.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(session.difficulty) }]}>
              {session.difficulty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getDifficultyColor(difficulty: string) {
  const colors = {
    easy: '#10B981',
    moderate: '#F59E0B',
    hard: '#EF4444',
  };
  return colors[difficulty as keyof typeof colors] || '#6B7280';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPrompt: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  locationPromptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  locationPromptText: {
    flex: 1,
  },
  locationPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationPromptSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 28,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  userBio: {
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 16,
  },
  sessionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    gap: 6,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  userDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  userDetailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetailAvatarText: {
    fontSize: 32,
  },
  userDetailName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userDetailMeta: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  userDetailContent: {
    gap: 20,
  },
  userDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  userDetailInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userDetailSection: {
    gap: 12,
  },
  userDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  userDetailBio: {
    fontSize: 14,
    lineHeight: 20,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 13,
    fontWeight: '600',
  },
  connectButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

