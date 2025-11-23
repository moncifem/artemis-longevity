import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch, Modal, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface UserProfile {
  name: string;
  age: number;
  sex?: 'male' | 'female';
  height: number;
  heightUnit: string;
  weight: number;
  weightUnit: string;
}

interface AssessmentResults {
  fitnessAge: number;
  actualAge: number;
  fitnessScore?: number;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [isOuraConnected, setIsOuraConnected] = useState(false);
  const [isAppleHealthConnected, setIsAppleHealthConnected] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserData();
    checkHealthConnections();
  }, []);

  const checkHealthConnections = async () => {
    const ouraToken = await AsyncStorage.getItem('ouraApiToken');
    const appleHealth = await AsyncStorage.getItem('appleHealthConnected');
    setIsOuraConnected(!!ouraToken);
    setIsAppleHealthConnected(appleHealth === 'true');
  };

  const loadUserData = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      const resultsStr = await AsyncStorage.getItem('assessmentResults');
      
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        setUserProfile(profile);
        setEditingProfile(profile);
      }
      if (resultsStr) {
        setAssessmentResults(JSON.parse(resultsStr));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (editingProfile) {
      await AsyncStorage.setItem('userProfile', JSON.stringify(editingProfile));
      setUserProfile(editingProfile);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleDisconnectOura = async () => {
    Alert.alert(
      'Disconnect Oura Ring?',
      'Your Oura Ring will be disconnected. You can reconnect anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('ouraApiToken');
            setIsOuraConnected(false);
            Alert.alert('Disconnected', 'Oura Ring has been disconnected.');
          },
        },
      ]
    );
  };

  const handleDisconnectAppleHealth = async () => {
    Alert.alert(
      'Disconnect Apple Health?',
      'Apple Health will be disconnected. You can reconnect anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('appleHealthConnected');
            setIsAppleHealthConnected(false);
            Alert.alert('Disconnected', 'Apple Health has been disconnected.');
          },
        },
      ]
    );
  };

  const handleReassessment = () => {
    Alert.alert(
      'Reassess Fitness Age',
      'Would you like to retake the fitness assessment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Assessment',
          onPress: () => router.push('/onboarding/assessment' as any),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? All local data will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding/welcome' as any);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Delete',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace('/onboarding/welcome' as any);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <LinearGradient 
      colors={theme.gradients.background}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <LinearGradient 
          colors={theme.gradients.primary} 
          style={[styles.profileHeader, { shadowColor: theme.shadow }]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.profileInfo}>
            {userProfile?.age} years • {userProfile?.height}{userProfile?.heightUnit}
          </Text>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {assessmentResults?.fitnessAge || '--'}
              </Text>
              <Text style={styles.profileStatLabel}>Fitness Age</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {userProfile?.weight || '--'}
              </Text>
              <Text style={styles.profileStatLabel}>{userProfile?.weightUnit || 'kg'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>
                {isOuraConnected || isAppleHealthConnected ? '✓' : '✗'}
              </Text>
              <Text style={styles.profileStatLabel}>Connected</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.reassessButton}
            onPress={handleReassessment}
          >
            <Ionicons name="refresh" size={16} color={theme.primary} />
            <Text style={[styles.reassessText, { color: theme.primary }]}>
              Reassess Fitness
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Personal Information Card */}
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Personal Information</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Ionicons name="create-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoGrid}>
            <InfoItem icon="person-outline" label="Name" value={userProfile?.name || '--'} theme={theme} />
            <InfoItem icon="calendar-outline" label="Age" value={`${userProfile?.age || '--'} years`} theme={theme} />
            <InfoItem icon="resize-outline" label="Height" value={`${userProfile?.height || '--'} ${userProfile?.heightUnit || 'cm'}`} theme={theme} />
            <InfoItem icon="fitness-outline" label="Weight" value={`${userProfile?.weight || '--'} ${userProfile?.weightUnit || 'kg'}`} theme={theme} />
            {userProfile?.sex && <InfoItem icon="male-female-outline" label="Sex" value={userProfile.sex.charAt(0).toUpperCase() + userProfile.sex.slice(1)} theme={theme} />}
            <InfoItem icon="trophy-outline" label="Fitness Age" value={`${assessmentResults?.fitnessAge || '--'} years`} theme={theme} />
          </View>
        </LinearGradient>

        {/* Health Data Sources */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Data Sources</Text>
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <SettingItem
            icon="watch-outline"
            label="Oura Ring"
            badge="💍"
            rightComponent={
              isOuraConnected ? (
                <TouchableOpacity onPress={handleDisconnectOura}>
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.statusDot, { color: '#10B981' }]}>●</Text>
                    <Text style={[styles.statusText, { color: '#10B981' }]}>Connected</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/oura-connect' as any)}>
                  <Text style={[styles.connectText, { color: theme.primary }]}>Connect</Text>
                </TouchableOpacity>
              )
            }
            theme={theme}
            noBorder
          />
          
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
          
          <SettingItem
            icon="heart-outline"
            label="Apple Health"
            badge="🍎"
            rightComponent={
              isAppleHealthConnected ? (
                <TouchableOpacity onPress={handleDisconnectAppleHealth}>
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                    <Text style={[styles.statusDot, { color: '#EC4899' }]}>●</Text>
                    <Text style={[styles.statusText, { color: '#EC4899' }]}>Connected</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => router.push('/apple-health-connect' as any)}>
                  <Text style={[styles.connectText, { color: theme.primary }]}>Connect</Text>
                </TouchableOpacity>
              )
            }
            theme={theme}
            noBorder
          />
        </LinearGradient>

        {/* App Settings */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <SettingItem 
            icon="notifications-outline" 
            label="Notifications" 
            onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="moon-outline" 
            label="Dark Mode" 
            rightComponent={
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>
                {colorScheme === 'dark' ? 'On' : 'Off'}
              </Text>
            }
            onPress={() => Alert.alert('Theme', 'Theme automatically matches your system settings')}
            theme={theme}
          />
          <SettingItem 
            icon="language-outline" 
            label="Language" 
            rightComponent={
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>English</Text>
            }
            onPress={() => Alert.alert('Coming Soon', 'Language settings coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="construct-outline" 
            label="Units" 
            rightComponent={
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>Metric</Text>
            }
            onPress={() => Alert.alert('Coming Soon', 'Unit preferences coming soon!')}
            theme={theme}
            noBorder
          />
        </LinearGradient>

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data & Privacy</Text>
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <SettingItem 
            icon="shield-checkmark-outline" 
            label="Privacy Policy" 
            onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device and never shared without your consent.')}
            theme={theme}
          />
          <SettingItem 
            icon="document-text-outline" 
            label="Terms of Service" 
            onPress={() => Alert.alert('Terms of Service', 'Terms of Service coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="download-outline" 
            label="Export Data" 
            onPress={() => Alert.alert('Coming Soon', 'Data export feature coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="trash-outline" 
            label="Delete Account" 
            onPress={handleDeleteAccount}
            theme={theme}
            danger
            noBorder
          />
        </LinearGradient>

        {/* Help & Support */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Help & Support</Text>
        <LinearGradient
          colors={theme.gradients.card}
          style={[styles.card, { borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}
        >
          <SettingItem 
            icon="help-circle-outline" 
            label="Help Center" 
            onPress={() => Alert.alert('Help', 'Help center coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="chatbubble-ellipses-outline" 
            label="Contact Support" 
            onPress={() => Alert.alert('Support', 'Email: support@artemis.app')}
            theme={theme}
          />
          <SettingItem 
            icon="star-outline" 
            label="Rate App" 
            onPress={() => Alert.alert('Coming Soon', 'App rating coming soon!')}
            theme={theme}
          />
          <SettingItem 
            icon="information-circle-outline" 
            label="About" 
            rightComponent={
              <Text style={[styles.valueText, { color: theme.textSecondary }]}>v1.0.0</Text>
            }
            onPress={() => Alert.alert('Artemis Longevity', 'Version 1.0.0\n\nYour personal fitness and longevity companion.')}
            theme={theme}
            noBorder
          />
        </LinearGradient>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: '#EF4444', borderWidth: 2, shadowColor: theme.shadow }]}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.1)']}
            style={styles.logoutButtonGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          Artemis Longevity • Version 1.0.0
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={theme.gradients.background}
            style={[styles.modalContent, { shadowColor: theme.shadow }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</Text>
                <LinearGradient
                  colors={theme.gradients.card}
                  style={[styles.input, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                >
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    value={editingProfile?.name || ''}
                    onChangeText={(text) => setEditingProfile(prev => prev ? { ...prev, name: text } : null)}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.textSecondary}
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</Text>
                <LinearGradient
                  colors={theme.gradients.card}
                  style={[styles.input, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                >
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    value={editingProfile?.age?.toString() || ''}
                    onChangeText={(text) => setEditingProfile(prev => prev ? { ...prev, age: parseInt(text) || 0 } : null)}
                    placeholder="Age"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Height</Text>
                <LinearGradient
                  colors={theme.gradients.card}
                  style={[styles.input, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                >
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    value={editingProfile?.height?.toString() || ''}
                    onChangeText={(text) => setEditingProfile(prev => prev ? { ...prev, height: parseFloat(text) || 0 } : null)}
                    placeholder="Height"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Weight</Text>
                <LinearGradient
                  colors={theme.gradients.card}
                  style={[styles.input, { borderColor: theme.cardBorder, borderWidth: 1 }]}
                >
                  <TextInput
                    style={[styles.inputField, { color: theme.text }]}
                    value={editingProfile?.weight?.toString() || ''}
                    onChangeText={(text) => setEditingProfile(prev => prev ? { ...prev, weight: parseFloat(text) || 0 } : null)}
                    placeholder="Weight"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </LinearGradient>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.input }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { shadowColor: theme.shadow }]}
                onPress={handleSaveProfile}
              >
                <LinearGradient
                  colors={theme.gradients.button}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonTextPrimary}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function InfoItem({ icon, label, value, theme }: { icon: any; label: string; value: string; theme: any }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: theme.input }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function SettingItem({ icon, label, badge, rightComponent, onPress, theme, noBorder, danger }: any) {
  return (
    <>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: theme.input }]}>
            <Ionicons name={icon} size={20} color={danger ? '#EF4444' : theme.primary} />
          </View>
          <Text style={[styles.settingLabel, { color: danger ? '#EF4444' : theme.text }]}>
            {label}
          </Text>
          {badge && <Text style={styles.badge}>{badge}</Text>}
        </View>
        {rightComponent || <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
      </TouchableOpacity>
      {!noBorder && <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  profileInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    fontWeight: '500',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileStat: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  reassessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  reassessText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  card: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 96) / 2,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    fontSize: 18,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    fontSize: 10,
    marginRight: 6,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connectText: {
    fontSize: 14,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  logoutButton: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
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
    letterSpacing: 0.3,
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputField: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
