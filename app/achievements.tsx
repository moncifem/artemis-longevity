import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ACHIEVEMENTS, Achievement, getRarityColor, getRarityLabel } from '@/constants/achievements';
import { calculateAchievementProgress, getAchievementProgress, getUnlockedAchievements } from '@/services/achievement-service';

const { width } = Dimensions.get('window');

export default function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const router = useRouter();
  
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState({ unlockedCount: 0, totalCount: 0, percentage: 0 });
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const unlocked = await getUnlockedAchievements();
    const prog = await calculateAchievementProgress();
    setUnlockedAchievements(unlocked);
    setProgress(prog);
  };

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(a => a.id === achievementId);
  };

  const handleShare = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `🎉 I just unlocked the "${achievement.title}" achievement in Artemis Longevity! ${achievement.description} 💪`,
        title: `Achievement Unlocked: ${achievement.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };

  const getRarityStyle = (rarity: string) => {
    const color = getRarityColor(rarity);
    return { borderColor: color, shadowColor: color };
  };

  return (
    <LinearGradient
      colors={theme.gradients.background}
      style={styles.container}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Achievements</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Progress Card */}
      <LinearGradient
        colors={theme.gradients.primary}
        style={[styles.progressCard, { shadowColor: theme.shadow }]}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
          </View>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progress.unlockedCount}</Text>
            <Text style={styles.progressStatLabel}>Unlocked</Text>
          </View>
          <View style={styles.progressStatDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{progress.totalCount - progress.unlockedCount}</Text>
            <Text style={styles.progressStatLabel}>Locked</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Achievement Grid */}
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map((achievement, index) => {
            const unlocked = isUnlocked(achievement.id);
            
            return (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { 
                    backgroundColor: unlocked ? theme.card : theme.input,
                    borderColor: unlocked ? getRarityColor(achievement.rarity) : theme.cardBorder,
                    borderWidth: unlocked ? 2 : 1,
                  },
                  unlocked && getRarityStyle(achievement.rarity)
                ]}
                onPress={() => handleAchievementPress(achievement)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.achievementIconContainer,
                  { 
                    backgroundColor: unlocked ? 'rgba(139, 92, 246, 0.1)' : theme.cardBorder,
                    opacity: unlocked ? 1 : 0.5,
                  }
                ]}>
                  <Text style={[
                    styles.achievementIcon,
                    { opacity: unlocked ? 1 : 0.3 }
                  ]}>
                    {achievement.icon}
                  </Text>
                </View>
                
                <Text 
                  style={[
                    styles.achievementTitle, 
                    { color: unlocked ? theme.text : theme.textSecondary }
                  ]}
                  numberOfLines={2}
                >
                  {achievement.title}
                </Text>
                
                {unlocked && (
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                    <Text style={styles.rarityText}>{getRarityLabel(achievement.rarity)}</Text>
                  </View>
                )}
                
                {!unlocked && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={theme.gradients.card}
            style={[styles.modalContent, { borderColor: theme.cardBorder, borderWidth: 1 }]}
          >
            {selectedAchievement && (
              <>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>

                <LinearGradient
                  colors={selectedAchievement.gradient}
                  style={styles.modalIconContainer}
                >
                  <Text style={styles.modalIcon}>{selectedAchievement.icon}</Text>
                </LinearGradient>

                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedAchievement.title}
                </Text>
                
                <View style={[
                  styles.modalRarityBadge, 
                  { backgroundColor: getRarityColor(selectedAchievement.rarity) }
                ]}>
                  <Text style={styles.modalRarityText}>
                    {getRarityLabel(selectedAchievement.rarity)}
                  </Text>
                </View>

                <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  {selectedAchievement.description}
                </Text>

                <View style={[styles.modalRequirement, { backgroundColor: theme.input }]}>
                  <Ionicons name="trophy" size={20} color={theme.primary} />
                  <Text style={[styles.modalRequirementText, { color: theme.text }]}>
                    Requirement: {selectedAchievement.requirement.type.replace('_', ' ')} ≥ {selectedAchievement.requirement.value}
                  </Text>
                </View>

                {isUnlocked(selectedAchievement.id) && (
                  <TouchableOpacity
                    style={[styles.shareButton, { shadowColor: theme.shadow }]}
                    onPress={() => handleShare(selectedAchievement)}
                  >
                    <LinearGradient
                      colors={theme.gradients.button}
                      style={styles.shareButtonGradient}
                    >
                      <Ionicons name="share-social" size={20} color="#FFFFFF" />
                      <Text style={styles.shareButtonText}>Share with Friends</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {!isUnlocked(selectedAchievement.id) && (
                  <View style={[styles.lockedMessage, { backgroundColor: theme.input }]}>
                    <Ionicons name="lock-closed" size={20} color={theme.textSecondary} />
                    <Text style={[styles.lockedMessageText, { color: theme.textSecondary }]}>
                      Keep working to unlock this achievement!
                    </Text>
                  </View>
                )}
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  achievementIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 36,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 36,
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 64,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalRarityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalRequirementText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  shareButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  lockedMessageText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

