import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityUser, WorkoutSession, UserPrivacySettings, UserLocation } from '@/types/community';
import { locationService } from './location-service';

const STORAGE_KEYS = {
  PRIVACY_SETTINGS: 'privacy_settings',
  NEARBY_USERS: 'nearby_users',
  WORKOUT_SESSIONS: 'workout_sessions',
  MY_SESSIONS: 'my_workout_sessions',
};

// Mock data for demonstration - In production, this would come from a backend API
const MOCK_USERS: CommunityUser[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 28,
    avatar: '👩',
    fitnessLevel: 'advanced',
    sharingLocation: true,
    bio: 'Marathon runner and yoga enthusiast',
    interests: ['running', 'yoga', 'hiking'],
    joinedDate: Date.now() - 86400000 * 30,
  },
  {
    id: '2',
    name: 'Mike Chen',
    age: 32,
    avatar: '👨',
    fitnessLevel: 'intermediate',
    sharingLocation: true,
    bio: 'CrossFit athlete looking for workout partners',
    interests: ['crossfit', 'weightlifting', 'cycling'],
    joinedDate: Date.now() - 86400000 * 45,
  },
  {
    id: '3',
    name: 'Emma Wilson',
    age: 25,
    avatar: '👱‍♀️',
    fitnessLevel: 'beginner',
    sharingLocation: true,
    bio: 'Starting my fitness journey',
    interests: ['yoga', 'pilates', 'walking'],
    joinedDate: Date.now() - 86400000 * 15,
  },
  {
    id: '4',
    name: 'James Rodriguez',
    age: 35,
    avatar: '🧔',
    fitnessLevel: 'advanced',
    sharingLocation: true,
    bio: 'Personal trainer and nutrition coach',
    interests: ['hiit', 'strength training', 'boxing'],
    joinedDate: Date.now() - 86400000 * 60,
  },
  {
    id: '5',
    name: 'Lisa Park',
    age: 29,
    avatar: '👩‍🦰',
    fitnessLevel: 'intermediate',
    sharingLocation: true,
    bio: 'Cyclist and outdoor enthusiast',
    interests: ['cycling', 'hiking', 'swimming'],
    joinedDate: Date.now() - 86400000 * 20,
  },
];

class CommunityService {
  /**
   * Get nearby users based on current location
   */
  async getNearbyUsers(radiusKm: number = 10): Promise<CommunityUser[]> {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation) {
        return [];
      }

      // In production, this would be an API call to get users near the location
      // For now, we'll generate mock locations around the user
      const nearbyUsers = MOCK_USERS.map((user) => {
        // Generate random location within radius
        const randomDistance = Math.random() * radiusKm;
        const randomAngle = Math.random() * 2 * Math.PI;
        
        const lat = currentLocation.latitude + (randomDistance / 111) * Math.cos(randomAngle);
        const lng = currentLocation.longitude + (randomDistance / (111 * Math.cos(currentLocation.latitude * Math.PI / 180))) * Math.sin(randomAngle);
        
        const distance = locationService.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          lat,
          lng
        );

        return {
          ...user,
          location: {
            id: `loc-${user.id}`,
            userId: user.id,
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
          },
          distance: parseFloat(distance.toFixed(2)),
        };
      }).filter((user) => user.sharingLocation);

      // Sort by distance
      nearbyUsers.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      await AsyncStorage.setItem(STORAGE_KEYS.NEARBY_USERS, JSON.stringify(nearbyUsers));
      return nearbyUsers;
    } catch (error) {
      console.error('Error getting nearby users:', error);
      return [];
    }
  }

  /**
   * Get all community users
   */
  async getAllUsers(): Promise<CommunityUser[]> {
    // In production, this would be an API call
    return MOCK_USERS.filter((user) => user.sharingLocation);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<CommunityUser | null> {
    const users = await this.getAllUsers();
    return users.find((user) => user.id === userId) || null;
  }

  /**
   * Get user privacy settings
   */
  async getPrivacySettings(): Promise<UserPrivacySettings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Default settings
      return {
        shareLocation: false,
        visibleToAll: true,
        visibilityRadius: 10,
        showOnMap: false,
        allowWorkoutInvites: true,
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return {
        shareLocation: false,
        visibleToAll: true,
        visibilityRadius: 10,
        showOnMap: false,
        allowWorkoutInvites: true,
      };
    }
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(settings: Partial<UserPrivacySettings>): Promise<void> {
    try {
      const currentSettings = await this.getPrivacySettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  }

  /**
   * Create a new workout session
   */
  async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'createdAt' | 'participants' | 'status'>): Promise<WorkoutSession> {
    try {
      const newSession: WorkoutSession = {
        ...session,
        id: Date.now().toString(),
        participants: [session.creatorId],
        status: 'upcoming',
        createdAt: Date.now(),
      };

      const sessions = await this.getWorkoutSessions();
      sessions.push(newSession);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions));

      return newSession;
    } catch (error) {
      console.error('Error creating workout session:', error);
      throw error;
    }
  }

  /**
   * Get all workout sessions
   */
  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    try {
      const sessions = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
      if (sessions) {
        return JSON.parse(sessions);
      }
      
      // Return some mock sessions
      const mockSessions = await this.generateMockSessions();
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(mockSessions));
      return mockSessions;
    } catch (error) {
      console.error('Error getting workout sessions:', error);
      return [];
    }
  }

  /**
   * Get nearby workout sessions
   */
  async getNearbyWorkoutSessions(radiusKm: number = 10): Promise<WorkoutSession[]> {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (!currentLocation) {
        return [];
      }

      const allSessions = await this.getWorkoutSessions();
      const nearbySessions = allSessions.filter((session) => {
        const distance = locationService.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          session.location.latitude,
          session.location.longitude
        );
        return distance <= radiusKm && session.status === 'upcoming';
      });

      return nearbySessions;
    } catch (error) {
      console.error('Error getting nearby workout sessions:', error);
      return [];
    }
  }

  /**
   * Join a workout session
   */
  async joinWorkoutSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const sessions = await this.getWorkoutSessions();
      const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return false;
      }

      const session = sessions[sessionIndex];
      
      // Check if already joined
      if (session.participants.includes(userId)) {
        return true;
      }

      // Check if session is full
      if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
        throw new Error('Session is full');
      }

      session.participants.push(userId);
      sessions[sessionIndex] = session;
      
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error joining workout session:', error);
      throw error;
    }
  }

  /**
   * Leave a workout session
   */
  async leaveWorkoutSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const sessions = await this.getWorkoutSessions();
      const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return false;
      }

      const session = sessions[sessionIndex];
      session.participants = session.participants.filter((id) => id !== userId);
      sessions[sessionIndex] = session;
      
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error leaving workout session:', error);
      return false;
    }
  }

  /**
   * Get user's workout sessions
   */
  async getMyWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
    try {
      const allSessions = await this.getWorkoutSessions();
      return allSessions.filter((session) => 
        session.participants.includes(userId) || session.creatorId === userId
      );
    } catch (error) {
      console.error('Error getting my workout sessions:', error);
      return [];
    }
  }

  /**
   * Generate mock workout sessions for demo
   */
  private async generateMockSessions(): Promise<WorkoutSession[]> {
    const currentLocation = await locationService.getCurrentLocation();
    if (!currentLocation) {
      return [];
    }

    const now = Date.now();
    const oneHour = 3600000;
    const oneDay = 86400000;

    return [
      {
        id: '1',
        title: 'Morning Run Club',
        description: 'Join us for a refreshing 5K morning run!',
        creatorId: '1',
        creatorName: 'Sarah Johnson',
        type: 'running',
        location: {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01,
          placeName: 'Central Park',
        },
        dateTime: now + oneDay,
        duration: 60,
        maxParticipants: 10,
        participants: ['1', '3'],
        difficulty: 'moderate',
        status: 'upcoming',
        createdAt: now - oneHour,
      },
      {
        id: '2',
        title: 'HIIT Workout Session',
        description: 'High-intensity interval training for all levels',
        creatorId: '4',
        creatorName: 'James Rodriguez',
        type: 'hiit',
        location: {
          latitude: currentLocation.latitude - 0.02,
          longitude: currentLocation.longitude + 0.015,
          placeName: 'Fitness Park',
        },
        dateTime: now + oneDay * 2,
        duration: 45,
        maxParticipants: 15,
        participants: ['4', '2', '5'],
        difficulty: 'hard',
        status: 'upcoming',
        createdAt: now - oneHour * 3,
      },
      {
        id: '3',
        title: 'Sunset Yoga',
        description: 'Relaxing yoga session at sunset',
        creatorId: '3',
        creatorName: 'Emma Wilson',
        type: 'yoga',
        location: {
          latitude: currentLocation.latitude + 0.015,
          longitude: currentLocation.longitude - 0.01,
          placeName: 'Beachside',
        },
        dateTime: now + oneDay * 3,
        duration: 90,
        participants: ['3', '1', '5'],
        difficulty: 'easy',
        status: 'upcoming',
        createdAt: now - oneHour * 5,
      },
    ];
  }
}

export const communityService = new CommunityService();

