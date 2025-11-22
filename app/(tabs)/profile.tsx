import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserProfile {
  name: string;
  age: number;
  height: number;
  heightUnit: string;
  weight: number;
  weightUnit: string;
}

interface AssessmentResults {
  fitnessAge: number;
  actualAge: number;
}

const getSettingsOptions = (isConnected: boolean) => [
  {
    title: 'Connected Devices',
    items: [
      { 
        icon: 'watch-outline', 
        label: 'Oura Ring', 
        screen: '/oura-connect', 
        badge: '💍',
        status: isConnected ? 'Connected' : undefined
      },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', screen: 'edit-profile' },
      { icon: 'notifications-outline', label: 'Notifications', screen: 'notifications' },
      { icon: 'lock-closed-outline', label: 'Privacy', screen: 'privacy' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', screen: 'theme', toggle: true },
      { icon: 'language-outline', label: 'Language', screen: 'language' },
      { icon: 'fitness-outline', label: 'Units', screen: 'units' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help & FAQ', screen: 'faq' },
      { icon: 'chatbubble-outline', label: 'Contact Support', screen: 'support' },
      { icon: 'star-outline', label: 'Rate Us', screen: 'rate' },
    ],
  },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [isOuraConnected, setIsOuraConnected] = useState(false);

  useEffect(() => {
    loadUserData();
    checkOuraConnection();
  }, []);

  const checkOuraConnection = async () => {
    const ouraToken = await AsyncStorage.getItem('ouraApiToken');
    setIsOuraConnected(!!ouraToken);
  };

  const loadUserData = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      const resultsStr = await AsyncStorage.getItem('assessmentResults');
      
      if (profileStr) {
        setUserProfile(JSON.parse(profileStr));
      }
      if (resultsStr) {
        setAssessmentResults(JSON.parse(resultsStr));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/onboarding/welcome');
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
          onPress: () => router.push('/onboarding/assessment'),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
          <Text style={styles.profileAge}>
            {userProfile?.age} years old • {userProfile?.height}{userProfile?.heightUnit}
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
              <Text style={styles.profileStatValue}>24</Text>
              <Text style={styles.profileStatLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>3</Text>
              <Text style={styles.profileStatLabel}>Groups</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.reassessButton}
            onPress={handleReassessment}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={[styles.reassessText, { color: colors.primary }]}>
              Reassess Fitness Age
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* User Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Personal Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Age</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.age} years
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Height</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.height} {userProfile?.heightUnit}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="scale-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {userProfile?.weight} {userProfile?.weightUnit}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Fitness Age</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {assessmentResults?.fitnessAge || '--'} years
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {getSettingsOptions(isOuraConnected).map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => {
                    if (item.screen) {
                      if (item.screen.startsWith('/')) {
                        router.push(item.screen as any);
                      } else {
                        Alert.alert('Coming Soon', `${item.label} feature coming soon!`);
                      }
                    }
                  }}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                      <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    {'badge' in item && (
                      <Text style={styles.settingBadge}>{item.badge}</Text>
                    )}
                    {'status' in item && item.status && (
                      <View style={styles.connectedBadge}>
                        <Text style={styles.connectedDot}>●</Text>
                        <Text style={styles.connectedText}>{item.status}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.icon }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
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
    paddingBottom: 100,
  },
  profileHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  reassessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  reassessText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingBadge: {
    fontSize: 18,
    marginLeft: 4,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  connectedDot: {
    color: '#10B981',
    fontSize: 10,
    marginRight: 4,
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
});

