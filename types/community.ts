export interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface CommunityUser {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  location?: UserLocation;
  distance?: number; // Distance from current user in km
  sharingLocation: boolean;
  bio?: string;
  interests?: string[];
  joinedDate: number;
}

export interface WorkoutSession {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  type: 'running' | 'cycling' | 'gym' | 'yoga' | 'hiit' | 'sports' | 'other';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    placeName?: string;
  };
  dateTime: number;
  duration: number; // in minutes
  maxParticipants?: number;
  participants: string[]; // user IDs
  difficulty: 'easy' | 'moderate' | 'hard';
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface LocationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface UserPrivacySettings {
  shareLocation: boolean;
  visibleToAll: boolean;
  visibilityRadius: number; // in km
  showOnMap: boolean;
  allowWorkoutInvites: boolean;
}

