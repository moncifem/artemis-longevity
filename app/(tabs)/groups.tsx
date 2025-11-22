import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const myGroups = [
  {
    id: 1,
    name: 'Morning Warriors',
    members: 24,
    activity: 'Daily 6am workouts',
    avatar: '🌅',
    color: ['#8B5CF6', '#A78BFA'],
    progress: 85,
  },
  {
    id: 2,
    name: 'Yoga Enthusiasts',
    members: 18,
    activity: 'Weekly yoga sessions',
    avatar: '🧘',
    color: ['#EC4899', '#F472B6'],
    progress: 70,
  },
  {
    id: 3,
    name: 'Weekend Runners',
    members: 32,
    activity: '10K training',
    avatar: '🏃',
    color: ['#10B981', '#34D399'],
    progress: 92,
  },
];

const suggestedGroups = [
  {
    id: 4,
    name: 'HIIT Squad',
    members: 45,
    activity: 'High intensity training',
    avatar: '🔥',
    color: ['#F59E0B', '#FBBF24'],
  },
  {
    id: 5,
    name: 'Strength Club',
    members: 28,
    activity: 'Weight training',
    avatar: '💪',
    color: ['#6366F1', '#818CF8'],
  },
  {
    id: 6,
    name: 'Mindful Movers',
    members: 21,
    activity: 'Mind-body balance',
    avatar: '🌟',
    color: ['#14B8A6', '#2DD4BF'],
  },
];

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Fitness <Text style={{ color: colors.primary }}>Groups</Text>
        </Text>
        <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-groups' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('my-groups')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'my-groups' && { color: '#FFFFFF' },
            activeTab !== 'my-groups' && { color: colors.icon },
          ]}>
            My Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'discover' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'discover' && { color: '#FFFFFF' },
            activeTab !== 'discover' && { color: colors.icon },
          ]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'my-groups' ? (
          <>
            {/* Featured Group */}
            <LinearGradient
              colors={myGroups[0].color}
              style={styles.featuredGroup}
            >
              <View style={styles.featuredHeader}>
                <View>
                  <Text style={styles.featuredBadge}>⭐ Most Active</Text>
                  <Text style={styles.featuredName}>{myGroups[0].name}</Text>
                  <Text style={styles.featuredActivity}>{myGroups[0].activity}</Text>
                </View>
                <Text style={styles.featuredAvatar}>{myGroups[0].avatar}</Text>
              </View>
              <View style={styles.featuredStats}>
                <View style={styles.featuredStat}>
                  <Ionicons name="people" size={20} color="#FFFFFF" />
                  <Text style={styles.featuredStatText}>
                    {myGroups[0].members} members
                  </Text>
                </View>
                <View style={styles.featuredProgress}>
                  <Text style={styles.progressText}>Group Goal: {myGroups[0].progress}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${myGroups[0].progress}%` }]} />
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* My Groups List */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All My Groups</Text>
            {myGroups.slice(1).map((group) => (
              <GroupCard key={group.id} group={group} colors={colors} />
            ))}
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested For You</Text>
            {suggestedGroups.map((group) => (
              <SuggestedGroupCard key={group.id} group={group} colors={colors} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function GroupCard({ group, colors }: any) {
  return (
    <TouchableOpacity style={[styles.groupCard, { backgroundColor: colors.card }]}>
      <LinearGradient colors={group.color} style={styles.groupAvatar}>
        <Text style={styles.groupAvatarText}>{group.avatar}</Text>
      </LinearGradient>
      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
        <Text style={[styles.groupActivity, { color: colors.icon }]}>{group.activity}</Text>
        <View style={styles.groupMeta}>
          <Ionicons name="people" size={14} color={colors.icon} />
          <Text style={[styles.groupMembers, { color: colors.icon }]}>
            {group.members} members
          </Text>
        </View>
      </View>
      <View style={styles.groupProgress}>
        <Text style={[styles.groupProgressText, { color: colors.primary }]}>
          {group.progress}%
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      </View>
    </TouchableOpacity>
  );
}

function SuggestedGroupCard({ group, colors }: any) {
  return (
    <TouchableOpacity style={[styles.suggestedCard, { backgroundColor: colors.card }]}>
      <LinearGradient colors={group.color} style={styles.suggestedAvatar}>
        <Text style={styles.suggestedAvatarText}>{group.avatar}</Text>
      </LinearGradient>
      <View style={styles.suggestedInfo}>
        <Text style={[styles.suggestedName, { color: colors.text }]}>{group.name}</Text>
        <Text style={[styles.suggestedActivity, { color: colors.icon }]}>{group.activity}</Text>
        <View style={styles.suggestedMeta}>
          <Ionicons name="people" size={14} color={colors.icon} />
          <Text style={[styles.suggestedMembers, { color: colors.icon }]}>
            {group.members} members
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.joinButtonText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  featuredGroup: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featuredBadge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  featuredName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredActivity: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuredAvatar: {
    fontSize: 48,
  },
  featuredStats: {
    gap: 16,
  },
  featuredStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredStatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featuredProgress: {
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 12,
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    fontSize: 28,
  },
  groupInfo: {
    flex: 1,
    gap: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupActivity: {
    fontSize: 13,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  groupMembers: {
    fontSize: 12,
  },
  groupProgress: {
    alignItems: 'flex-end',
    gap: 4,
  },
  groupProgressText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 12,
  },
  suggestedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedAvatarText: {
    fontSize: 28,
  },
  suggestedInfo: {
    flex: 1,
    gap: 4,
  },
  suggestedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestedActivity: {
    fontSize: 13,
  },
  suggestedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  suggestedMembers: {
    fontSize: 12,
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

