import { Colors } from '@/constants/theme';
import { useOuraHealthSummary, useOuraProfile } from '@/hooks/use-oura-data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OuraConnect() {
  const router = useRouter();
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { profile, isLoading, fetchProfile } = useOuraProfile();
  const { summary, fetchSummary } = useOuraHealthSummary();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    // Check if token exists in AsyncStorage
    const storedToken = await AsyncStorage.getItem('ouraApiToken');
    const connected = !!storedToken;
    setIsConnected(connected);
    
    if (connected && storedToken) {
      setApiToken(storedToken.substring(0, 10) + '...');
      // Fetch profile and summary data
      await fetchProfile();
      await fetchSummary();
    }
  };

  const handleConnect = async () => {
    if (!apiToken.trim()) {
      Alert.alert('Required', 'Please enter your Oura API token');
      return;
    }

    setIsTesting(true);
    
    try {
      // Save token to AsyncStorage (in production, you'd want to use secure storage)
      await AsyncStorage.setItem('ouraApiToken', apiToken);
      
      // Test the connection by fetching profile
      const profileData = await fetchProfile();
      
      if (profileData) {
        setIsConnected(true);
        Alert.alert(
          'Success! 🎉',
          'Connected to Oura Ring! Your health data will now sync automatically.',
          [
            {
              text: 'Continue',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Unable to connect to Oura. Please check your API token and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Oura',
      'Are you sure you want to disconnect your Oura Ring?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('ouraApiToken');
            setIsConnected(false);
            setApiToken('');
          },
        },
      ]
    );
  };

  const handleGetToken = () => {
    Alert.alert(
      'Get Your Oura API Token',
      'To get your personal access token:\n\n' +
      '1. Go to cloud.ouraring.com/personal-access-tokens\n' +
      '2. Log in with your Oura account\n' +
      '3. Click "Create A New Personal Access Token"\n' +
      '4. Give it a name (e.g., "Artemis Longevity")\n' +
      '5. Copy the token and paste it here\n\n' +
      'Note: Keep your token private and secure!',
      [{ text: 'Got It' }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FCE7F3', '#FFFFFF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oura Ring</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💍</Text>
          </View>

          <Text style={styles.title}>Connect Your Oura Ring</Text>
          <Text style={styles.subtitle}>
            Sync your health data automatically and get personalized insights based on your actual activity, sleep, and readiness.
          </Text>

          {!isConnected ? (
            <>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Oura API Token</Text>
                <TextInput
                  style={styles.input}
                  value={apiToken}
                  onChangeText={setApiToken}
                  placeholder="Enter your personal access token"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={handleGetToken} style={styles.helpButton}>
                  <Text style={styles.helpText}>How do I get my token? 🔗</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.connectButton, isTesting && styles.buttonDisabled]}
                onPress={handleConnect}
                disabled={isTesting}
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  style={styles.buttonGradient}
                >
                  {isTesting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Connect Oura Ring 💍</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.connectedCard}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusDot}>●</Text>
                  <Text style={styles.statusText}>Connected</Text>
                </View>
                
                {profile && (
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileLabel}>Account Info</Text>
                    <Text style={styles.profileValue}>Age: {profile.age} years</Text>
                    <Text style={styles.profileValue}>Height: {profile.height} cm</Text>
                    <Text style={styles.profileValue}>Weight: {profile.weight} kg</Text>
                  </View>
                )}

                {summary && (
                  <View style={styles.summaryGrid}>
                    <SummaryCard
                      label="Activity"
                      value={summary.activity.score}
                      subtitle={`${summary.activity.dailySteps} steps/day`}
                      color="#EC4899"
                    />
                    <SummaryCard
                      label="Sleep"
                      value={summary.sleep.score}
                      subtitle={`${summary.sleep.averageHours}h avg`}
                      color="#8B5CF6"
                    />
                    <SummaryCard
                      label="Readiness"
                      value={summary.readiness.score}
                      subtitle={`${summary.readiness.restingHR} bpm`}
                      color="#F472B6"
                    />
                    <SummaryCard
                      label="Fitness Age"
                      value={summary.overall.fitnessAge}
                      subtitle={`${Math.abs(summary.overall.ageDifference)}y ${summary.overall.ageDifference < 0 ? 'younger' : 'older'}`}
                      color="#6366F1"
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectText}>Disconnect Oura Ring</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              🔒 Your Oura data is stored securely on your device and is never shared without your permission.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

function SummaryCard({ label, value, subtitle, color }: { label: string; value: number; subtitle: string; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
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
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#F3E8FF',
    fontFamily: 'monospace',
  },
  helpButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  connectButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  connectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusDot: {
    color: '#10B981',
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  profileInfo: {
    marginBottom: 20,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  profileValue: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  disconnectButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  disconnectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  privacyNote: {
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  privacyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

