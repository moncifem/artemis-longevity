import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Header Logo */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
          <Text style={styles.headerTitle}>artemis</Text>
        </View>

        {/* Central Glowing Orb */}
        <View style={styles.orbContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.6)', 'rgba(236, 72, 153, 0.3)', 'transparent']}
            style={styles.glowOrb}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.innerOrb}>
             <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.orbGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
           {/* Orbit Ring */}
           <View style={styles.orbitRing} />
        </View>

        {/* Main Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.headline}>
            Find your strength,{'\n'}fuel your longevity
          </Text>
          <Text style={styles.description}>
            Science-based metrics, personalized insights, and a path to living stronger for longer.
          </Text>

          {/* Pagination Dots (Visual only for now) */}
          <View style={styles.pagination}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Bottom Action */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/onboarding/user-info')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505', // Very dark background
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  orbContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 40,
  },
  glowOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.5,
    filter: 'blur(40px)', // Note: blur might need different handling on native, usually works on web/some versions
  },
  innerOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  orbitRing: {
    position: 'absolute',
    width: 220,
    height: 80,
    borderRadius: 110, // Elliptical look
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '-15deg' }],
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 'auto',
    marginBottom: 40,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    color: '#A1A1AA', // Light gray
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  activeDot: {
    backgroundColor: '#FFF',
  },
  footer: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

