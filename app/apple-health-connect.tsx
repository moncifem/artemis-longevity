import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initHealthKit, getAllHealthData, isHealthKitAvailable } from '@/services/apple-health-api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function AppleHealthConnect() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Check platform
    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      Alert.alert(
        'Not Available',
        'Apple Health is only available on iOS devices.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    // Check if HealthKit is available
    const available = await isHealthKitAvailable();
    setIsAvailable(available);
    
    if (!available) {
      Alert.alert(
        'HealthKit Not Available',
        'Apple Health is not available on this device. This might be because:\n\n• You are using an iOS Simulator\n• HealthKit is not supported on this device\n• The app was not built with native modules\n\nPlease ensure you are using a native build (EAS Build) on a real iOS device.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Double check availability
      if (!isAvailable) {
        Alert.alert(
          'Not Available',
          'Apple Health is not available. Please use a native build on a real iOS device.',
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        return;
      }

      // Initialize HealthKit
      console.log('🔄 Initializing HealthKit...');
      const initialized = await initHealthKit();
      
      if (!initialized) {
        Alert.alert(
          'Permission Required',
          'Artemis needs permission to access your Apple Health data.\n\nTo grant access:\n1. Open Settings app\n2. Go to Health > Data Access & Devices\n3. Select Artemis\n4. Enable all requested permissions',
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        return;
      }

      console.log('✅ HealthKit initialized, fetching data...');

      // Test data fetch
      const healthData = await getAllHealthData();
      
      if (healthData) {
        console.log('✅ Health data fetched successfully:', healthData);
        
        // Save connection status
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        await AsyncStorage.setItem('healthDataSource', 'appleHealth');
        
        Alert.alert(
          'Success! 🎉',
          'Your Apple Health is now connected to Artemis! We\'ll sync your activity, sleep, and heart rate data.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        console.log('⚠️ No health data returned');
        Alert.alert(
          'Limited Data',
          'We could connect to Apple Health but couldn\'t fetch data yet. This might be because:\n\n• You haven\'t granted all permissions\n• There\'s no recent health data available\n\nYou can try again later or check your Health app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error connecting Apple Health:', error);
      Alert.alert(
        'Connection Error',
        `Failed to connect to Apple Health.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease make sure:\n• You are using a native build (not Expo Go)\n• You are on a real iOS device\n• HealthKit permissions are enabled`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { shadowColor: theme.shadow }]}>
            <LinearGradient
              colors={theme.gradients.card}
              style={[styles.backButtonGradient, { borderColor: theme.cardBorder, borderWidth: 1 }]}
            >
              <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { shadowColor: theme.shadow }]}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.iconGradient}
            >
              <Text style={styles.appleIcon}>🍎</Text>
            </LinearGradient>
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>
            Connect Apple Health
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock the full power of Artemis with your Apple Health data
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="📊"
            title="Real-time Activity"
            description="Steps, distance, and calories burned"
            theme={theme}
          />
          <FeatureItem
            icon="❤️"
            title="Heart Health"
            description="Resting HR, heart rate variability"
            theme={theme}
          />
          <FeatureItem
            icon="😴"
            title="Sleep Analysis"
            description="Total sleep, deep sleep, REM, and more"
            theme={theme}
          />
          <FeatureItem
            icon="🔒"
            title="Private & Secure"
            description="Your data stays on your device"
            theme={theme}
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCardWrapper}>
          <LinearGradient
            colors={theme.gradients.card}
            style={[styles.infoCard, { borderColor: theme.primary, borderWidth: 1 }]}
          >
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              We'll only access data you permit. You can revoke access anytime in iOS Settings.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.glass }]}>
        <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: theme.input }]} 
          onPress={handleSkip}
          disabled={isConnecting}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip for Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.connectButton, { shadowColor: theme.shadow }]} 
          onPress={handleConnect}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.connectButtonGradient}
          >
            {isConnecting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Apple Health</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, title, description, theme }: { icon: string; title: string; description: string, theme: any }) {
  return (
    <View style={[styles.featureItem, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: theme.input }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
    borderRadius: 60,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleIcon: {
    fontSize: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCardWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    fontSize: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  connectButton: {
    flex: 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  connectButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
