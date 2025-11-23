import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { communityService } from '@/services/community-service';
import { locationService } from '@/services/location-service';
import { CommunityUser, WorkoutSession } from '@/types/community';
import { StatusBar } from 'expo-status-bar';

// Only import MapView on native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

export default function CommunityMapScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [nearbyUsers, setNearbyUsers] = useState<CommunityUser[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [showUsers, setShowUsers] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      const [users, sessions] = await Promise.all([
        communityService.getNearbyUsers(20),
        communityService.getNearbyWorkoutSessions(20),
      ]);

      setNearbyUsers(users);
      setWorkoutSessions(sessions);
    } catch (error) {
      console.error('Error loading map data:', error);
      Alert.alert('Error', 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (marker: any, type: 'user' | 'session') => {
    setSelectedMarker({ ...marker, type });
  };

  const handleCenterOnUser = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  // Show message on web
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community Map</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.webNotSupported}>
          <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.webNotSupportedTitle, { color: colors.text }]}>
            Map View Not Available on Web
          </Text>
          <Text style={[styles.webNotSupportedText, { color: colors.textSecondary }]}>
            The interactive map is only available on iOS and Android devices. Please use the mobile app to view nearby users and workout sessions on the map.
          </Text>
          <TouchableOpacity
            style={[styles.backToCommunityButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backToCommunityButtonText}>Back to Community</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading || !userLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={userLocation}
        region={userLocation}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* User Markers */}
        {showUsers && nearbyUsers.map((user) => {
          if (!user.location) return null;
          return (
            <Marker
              key={`user-${user.id}`}
              coordinate={{
                latitude: user.location.latitude,
                longitude: user.location.longitude,
              }}
              onPress={() => handleMarkerPress(user, 'user')}
            >
              <View style={styles.userMarker}>
                <View style={[styles.userMarkerInner, { backgroundColor: colors.primary }]}>
                  <Text style={styles.userMarkerText}>{user.avatar}</Text>
                </View>
              </View>
            </Marker>
          );
        })}

        {/* Session Markers */}
        {showSessions && workoutSessions.map((session) => (
          <Marker
            key={`session-${session.id}`}
            coordinate={{
              latitude: session.location.latitude,
              longitude: session.location.longitude,
            }}
            onPress={() => handleMarkerPress(session, 'session')}
          >
            <View style={styles.sessionMarker}>
              <View style={[styles.sessionMarkerInner, { backgroundColor: '#EC4899' }]}>
                <Ionicons name="fitness" size={18} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Community Map</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showUsers ? colors.primary : colors.card },
          ]}
          onPress={() => setShowUsers(!showUsers)}
        >
          <Ionicons name="people" size={20} color={showUsers ? '#FFFFFF' : colors.text} />
          <Text style={[styles.filterText, { color: showUsers ? '#FFFFFF' : colors.text }]}>
            Users ({nearbyUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showSessions ? colors.primary : colors.card },
          ]}
          onPress={() => setShowSessions(!showSessions)}
        >
          <Ionicons name="calendar" size={20} color={showSessions ? '#FFFFFF' : colors.text} />
          <Text style={[styles.filterText, { color: showSessions ? '#FFFFFF' : colors.text }]}>
            Sessions ({workoutSessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Button */}
      <TouchableOpacity
        style={[styles.locationButton, { backgroundColor: colors.card }]}
        onPress={handleCenterOnUser}
      >
        <Ionicons name="navigate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <View style={[styles.markerInfo, { backgroundColor: colors.card }]}>
          <View style={styles.markerInfoHeader}>
            {selectedMarker.type === 'user' ? (
              <>
                <View style={[styles.markerAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={styles.markerAvatarText}>{selectedMarker.avatar}</Text>
                </View>
                <View style={styles.markerDetails}>
                  <Text style={[styles.markerTitle, { color: colors.text }]}>
                    {selectedMarker.name}
                  </Text>
                  <Text style={[styles.markerSubtitle, { color: colors.textSecondary }]}>
                    {selectedMarker.fitnessLevel} • {selectedMarker.distance?.toFixed(1)} km away
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.markerAvatar, { backgroundColor: '#EC4899' }]}>
                  <Ionicons name="fitness" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.markerDetails}>
                  <Text style={[styles.markerTitle, { color: colors.text }]}>
                    {selectedMarker.title}
                  </Text>
                  <Text style={[styles.markerSubtitle, { color: colors.textSecondary }]}>
                    {new Date(selectedMarker.dateTime).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity onPress={() => setSelectedMarker(null)}>
              <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  filterContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  userMarker: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarkerText: {
    fontSize: 20,
  },
  sessionMarker: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  markerInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerAvatarText: {
    fontSize: 28,
  },
  markerDetails: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  markerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  webNotSupportedTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  webNotSupportedText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToCommunityButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 12,
  },
  backToCommunityButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

