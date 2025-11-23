import { Platform } from 'react-native';

// Dynamically import react-native-health only on iOS
let AppleHealthKit: any = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
  }
} catch (error) {
  console.log('Apple HealthKit module not available:', error);
}

// Define permissions we need
const permissions = {
  permissions: {
    read: [
      'Steps',
      'StepCount',
      'DistanceWalkingRunning',
      'ActiveEnergyBurned',
      'BasalEnergyBurned',
      'HeartRate',
      'RestingHeartRate',
      'HeartRateVariability',
      'SleepAnalysis',
      'Height',
      'Weight',
      'DateOfBirth',
      'BiologicalSex',
    ],
    write: [],
  },
};

/**
 * Check if HealthKit is available
 */
export const isHealthKitAvailable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      resolve(false);
      return;
    }

    if (!AppleHealthKit) {
      console.log('HealthKit module not loaded');
      resolve(false);
      return;
    }

    try {
      AppleHealthKit.isAvailable((err: any, available: boolean) => {
        if (err) {
          console.log('Error checking HealthKit availability:', err);
          resolve(false);
          return;
        }
        resolve(available);
      });
    } catch (error) {
      console.log('HealthKit not supported:', error);
      resolve(false);
    }
  });
};

/**
 * Initialize Apple HealthKit
 */
export const initHealthKit = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      console.log('HealthKit is only available on iOS');
      resolve(false);
      return;
    }

    if (!AppleHealthKit) {
      console.log('HealthKit module not available. Make sure you are using a development or production build.');
      resolve(false);
      return;
    }

    try {
      AppleHealthKit.initHealthKit(permissions, (error: any) => {
        if (error) {
          console.log('[ERROR] Cannot grant permissions:', error);
          resolve(false);
          return;
        }
        console.log('✅ HealthKit initialized successfully');
        resolve(true);
      });
    } catch (error) {
      console.log('Error initializing HealthKit:', error);
      resolve(false);
    }
  });
};

/**
 * Safe wrapper for HealthKit calls
 */
const safeHealthKitCall = <T>(
  callback: (resolve: (value: T) => void) => void,
  defaultValue: T
): Promise<T> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      resolve(defaultValue);
      return;
    }

    try {
      callback(resolve);
    } catch (error) {
      console.log('HealthKit call error:', error);
      resolve(defaultValue);
    }
  });
};

/**
 * Get today's step count
 */
export const getTodaySteps = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    AppleHealthKit.getStepCount(options, (err: any, results: any) => {
      if (err) {
        console.log('Error getting steps:', err);
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get distance walked/run today (in meters)
 */
export const getTodayDistance = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    AppleHealthKit.getDistanceWalkingRunning(options, (err: any, results: any) => {
      if (err) {
        console.log('Error getting distance:', err);
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get active calories burned today
 */
export const getTodayActiveCalories = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any) => {
      if (err) {
        console.log('Error getting active calories:', err);
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get basal (resting) calories burned today
 */
export const getTodayBasalCalories = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getBasalEnergyBurned(options, (err: any, results: any) => {
      if (err) {
        console.log('Error getting basal calories:', err);
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get latest heart rate
 */
export const getLatestHeartRate = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    AppleHealthKit.getLatestHeartRateSample(null, (err: any, results: any) => {
      if (err) {
        console.log('Error getting heart rate:', err);
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get resting heart rate
 */
export const getRestingHeartRate = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 1,
    };

    AppleHealthKit.getRestingHeartRate(options, (err: any, results: any[]) => {
      if (err || !results || results.length === 0) {
        resolve(0);
        return;
      }
      resolve(results[0]?.value || 0);
    });
  }, 0);
};

/**
 * Get heart rate variability (HRV)
 */
export const getHeartRateVariability = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 1,
    };

    AppleHealthKit.getHeartRateVariabilitySamples(options, (err: any, results: any[]) => {
      if (err || !results || results.length === 0) {
        resolve(0);
        return;
      }
      resolve(results[0]?.value || 0);
    });
  }, 0);
};

/**
 * Get sleep analysis for last night
 */
export const getLastNightSleep = (): Promise<{
  totalSleep: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  awake: number;
}> => {
  return safeHealthKitCall((resolve) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getSleepSamples(options, (err: any, results: any[]) => {
      if (err || !results) {
        resolve({ totalSleep: 0, deepSleep: 0, remSleep: 0, lightSleep: 0, awake: 0 });
        return;
      }

      let totalSleep = 0;
      let deepSleep = 0;
      let remSleep = 0;
      let lightSleep = 0;
      let awake = 0;

      results.forEach((sample: any) => {
        const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / 1000;
        
        switch (sample.value) {
          case 'INBED':
          case 'ASLEEP':
            totalSleep += duration;
            break;
          case 'DEEP':
            deepSleep += duration;
            totalSleep += duration;
            break;
          case 'REM':
            remSleep += duration;
            totalSleep += duration;
            break;
          case 'CORE':
          case 'LIGHT':
            lightSleep += duration;
            totalSleep += duration;
            break;
          case 'AWAKE':
            awake += duration;
            break;
        }
      });

      resolve({
        totalSleep,
        deepSleep,
        remSleep,
        lightSleep,
        awake,
      });
    });
  }, { totalSleep: 0, deepSleep: 0, remSleep: 0, lightSleep: 0, awake: 0 });
};

/**
 * Get user's biological sex
 */
export const getBiologicalSex = (): Promise<'male' | 'female' | 'other' | ''> => {
  return safeHealthKitCall((resolve) => {
    AppleHealthKit.getBiologicalSex(null, (err: any, results: any) => {
      if (err) {
        resolve('');
        return;
      }
      
      const sex = results?.value;
      if (sex === 'male' || sex === 'female') {
        resolve(sex);
      } else {
        resolve('other');
      }
    });
  }, '');
};

/**
 * Get user's date of birth and calculate age
 */
export const getAge = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    AppleHealthKit.getDateOfBirth(null, (err: any, results: any) => {
      if (err) {
        resolve(0);
        return;
      }

      const birthDate = new Date(results.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      resolve(age);
    });
  }, 0);
};

/**
 * Get user's height (in cm)
 */
export const getHeight = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    AppleHealthKit.getLatestHeight(null, (err: any, results: any) => {
      if (err) {
        resolve(0);
        return;
      }
      // Convert from meters to cm
      resolve((results?.value || 0) * 100);
    });
  }, 0);
};

/**
 * Get user's weight (in kg)
 */
export const getWeight = (): Promise<number> => {
  return safeHealthKitCall((resolve) => {
    AppleHealthKit.getLatestWeight(null, (err: any, results: any) => {
      if (err) {
        resolve(0);
        return;
      }
      resolve(results?.value || 0);
    });
  }, 0);
};

/**
 * Get all dashboard data at once
 */
export const getAllHealthData = async () => {
  try {
    const [
      steps,
      distance,
      activeCalories,
      basalCalories,
      heartRate,
      restingHR,
      hrv,
      sleep,
    ] = await Promise.all([
      getTodaySteps(),
      getTodayDistance(),
      getTodayActiveCalories(),
      getTodayBasalCalories(),
      getLatestHeartRate(),
      getRestingHeartRate(),
      getHeartRateVariability(),
      getLastNightSleep(),
    ]);

    return {
      steps,
      distance,
      activeCalories,
      totalCalories: activeCalories + basalCalories,
      heartRate,
      restingHR,
      hrv,
      sleepHours: sleep.totalSleep / 3600, // Convert seconds to hours
      deepSleep: sleep.deepSleep, // Already in seconds
      remSleep: sleep.remSleep,
      lightSleep: sleep.lightSleep,
      sleepEfficiency: sleep.totalSleep > 0 
        ? Math.round((sleep.totalSleep / (sleep.totalSleep + sleep.awake)) * 100)
        : 0,
    };
  } catch (error) {
    console.error('Error getting all health data:', error);
    return null;
  }
};

/**
 * Get user profile data from HealthKit
 */
export const getUserProfile = async () => {
  try {
    const [sex, age, height, weight] = await Promise.all([
      getBiologicalSex(),
      getAge(),
      getHeight(),
      getWeight(),
    ]);

    return {
      sex,
      age,
      height,
      weight,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};
