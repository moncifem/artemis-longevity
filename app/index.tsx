import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      const userProfile = await AsyncStorage.getItem('userProfile');
      
      // Small delay for splash effect
      setTimeout(() => {
        if (!hasOnboarded || !userProfile) {
          router.replace('/onboarding/welcome');
        } else {
          router.replace('/(tabs)');
        }
      }, 1500);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      router.replace('/onboarding/welcome');
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: Colors.light.primary
    }}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

