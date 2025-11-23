import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initHealthKit, getAllHealthData } from '@/services/apple-health-api';

const { width } = Dimensions.get('window');

export default function AppleHealthConnect() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Initialize HealthKit
      const initialized = await initHealthKit();
      
      if (!initialized) {
        Alert.alert(
          'Permission Denied',
          'Please enable Health permissions in Settings to use this feature.',
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        return;
      }

      // Test data fetch
      const healthData = await getAllHealthData();
      
      if (healthData) {
        // Save connection status
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        
        Alert.alert(
          'Success! 🎉',
          'Your Apple Health is now connected to Artemis!',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Could not fetch health data. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting Apple Health:', error);
      Alert.alert('Error', 'Failed to connect to Apple Health. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#FAF5FF', '#FFFFFF', '#FDF2F8']}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <LinearGradient
              colors={['#F3E8FF', '#FFFFFF']}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backText}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.iconGradient}
            >
              <Text style={styles.appleIcon}>🍎</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>
            Connect Apple Health
          </Text>
          <Text style={styles.subtitle}>
            Unlock the full power of Artemis with your Apple Health data
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="📊"
            title="Real-time Activity"
            description="Steps, distance, and calories burned"
          />
          <FeatureItem
            icon="❤️"
            title="Heart Health"
            description="Resting HR, heart rate variability"
          />
          <FeatureItem
            icon="😴"
            title="Sleep Analysis"
            description="Total sleep, deep sleep, REM, and more"
          />
          <FeatureItem
            icon="🔒"
            title="Private & Secure"
            description="Your data stays on your device"
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCardWrapper}>
          <LinearGradient
            colors={['#F3E8FF', '#FCE7F3']}
            style={styles.infoCard}
          >
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              We'll only access data you permit. You can revoke access anytime in iOS Settings.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          disabled={isConnecting}
        >
          <Text style={styles.skipText}>Skip for Now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.connectButton} 
          onPress={handleConnect}
          disabled={isConnecting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
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

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    color: '#8B5CF6',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
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
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#6B7280',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#F3E8FF',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  connectButton: {
    flex: 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
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

