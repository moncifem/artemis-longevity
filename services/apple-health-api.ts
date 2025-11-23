import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { Platform } from 'react-native';

// Define permissions we need
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.BodyTemperature,
      AppleHealthKit.Constants.Permissions.Height,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.DateOfBirth,
      AppleHealthKit.Constants.Permissions.BiologicalSex,
    ],
    write: [],
  },
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

    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.log('[ERROR] Cannot grant permissions!', error);
        resolve(false);
        return;
      }
      console.log('HealthKit initialized successfully');
      resolve(true);
    });
  });
};

/**
 * Check if HealthKit is available
 */
export const isHealthKitAvailable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(false);
      return;
    }

    AppleHealthKit.isAvailable((err: Object, available: boolean) => {
      if (err) {
        console.log('Error checking HealthKit availability:', err);
        resolve(false);
        return;
      }
      resolve(available);
    });
  });
};

/**
 * Get today's step count
 */
export const getTodaySteps = (): Promise<number> => {
  return new Promise((resolve) => {
    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    AppleHealthKit.getStepCount(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.log('Error getting steps:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
};

/**
 * Get distance walked/run today (in meters)
 */
export const getTodayDistance = (): Promise<number> => {
  return new Promise((resolve) => {
    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    AppleHealthKit.getDistanceWalkingRunning(options, (err: Object, results: HealthValue) => {
      if (err) {
        console.log('Error getting distance:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
};

/**
 * Get active calories burned today
 */
export const getTodayActiveCalories = (): Promise<number> => {
  return new Promise((resolve) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getActiveEnergyBurned(options, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting active calories:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
};

/**
 * Get basal (resting) calories burned today
 */
export const getTodayBasalCalories = (): Promise<number> => {
  return new Promise((resolve) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    AppleHealthKit.getBasalEnergyBurned(options, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting basal calories:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
};

/**
 * Get latest heart rate
 */
export const getLatestHeartRate = (): Promise<number> => {
  return new Promise((resolve) => {
    AppleHealthKit.getLatestHeartRateSample(null, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting heart rate:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
};

/**
 * Get resting heart rate
 */
export const getRestingHeartRate = (): Promise<number> => {
  return new Promise((resolve) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 1,
    };

    AppleHealthKit.getRestingHeartRate(options, (err: Object, results: any[]) => {
      if (err || !results || results.length === 0) {
        console.log('Error getting resting heart rate:', err);
        resolve(0);
        return;
      }
      resolve(results[0].value || 0);
    });
  });
};

/**
 * Get heart rate variability (HRV)
 */
export const getHeartRateVariability = (): Promise<number> => {
  return new Promise((resolve) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      limit: 1,
    };

    AppleHealthKit.getHeartRateVariabilitySamples(options, (err: Object, results: any[]) => {
      if (err || !results || results.length === 0) {
        console.log('Error getting HRV:', err);
        resolve(0);
        return;
      }
      resolve(results[0].value || 0);
    });
  });
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
  return new Promise((resolve) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    AppleHealthKit.getSleepSamples(options, (err: Object, results: any[]) => {
      if (err || !results) {
        console.log('Error getting sleep:', err);
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
  });
};

/**
 * Get user's biological sex
 */
export const getBiologicalSex = (): Promise<'male' | 'female' | 'other' | ''> => {
  return new Promise((resolve) => {
    AppleHealthKit.getBiologicalSex(null, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting biological sex:', err);
        resolve('');
        return;
      }
      
      const sex = results.value;
      if (sex === 'male' || sex === 'female') {
        resolve(sex);
      } else {
        resolve('other');
      }
    });
  });
};

/**
 * Get user's date of birth and calculate age
 */
export const getAge = (): Promise<number> => {
  return new Promise((resolve) => {
    AppleHealthKit.getDateOfBirth(null, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting date of birth:', err);
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
  });
};

/**
 * Get user's height (in cm)
 */
export const getHeight = (): Promise<number> => {
  return new Promise((resolve) => {
    AppleHealthKit.getLatestHeight(null, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting height:', err);
        resolve(0);
        return;
      }
      // Convert from meters to cm
      resolve((results.value || 0) * 100);
    });
  });
};

/**
 * Get user's weight (in kg)
 */
export const getWeight = (): Promise<number> => {
  return new Promise((resolve) => {
    AppleHealthKit.getLatestWeight(null, (err: Object, results: any) => {
      if (err) {
        console.log('Error getting weight:', err);
        resolve(0);
        return;
      }
      resolve(results.value || 0);
    });
  });
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
      deepSleep: sleep.deepSleep / 60, // Convert to minutes
      remSleep: sleep.remSleep / 60,
      lightSleep: sleep.lightSleep / 60,
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

