import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.secondary]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏃</Text>
          </View>
          
          <Text style={styles.title}>Artemis Longevity</Text>
          <Text style={styles.subtitle}>
            Your Ultimate Fitness & Longevity Companion
          </Text>

          <View style={styles.features}>
            <FeatureItem icon="📊" text="Track your fitness age" />
            <FeatureItem icon="💪" text="Personalized exercises" />
            <FeatureItem icon="👥" text="Group motivation" />
            <FeatureItem icon="📈" text="Monitor your progress" />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/onboarding/user-info')}
          >
            <Text style={styles.buttonText}>Let's Get Started</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  features: {
    width: '100%',
    marginBottom: 50,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

