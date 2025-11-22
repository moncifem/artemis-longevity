import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const weeklyData = [
  { day: 'Mon', steps: 5289, date: 16 },
  { day: 'Tue', steps: 6543, date: 17 },
  { day: 'Wed', steps: 4234, date: 18 },
  { day: 'Thu', steps: 5269, date: 19 },
  { day: 'Fri', steps: 7123, date: 20 },
  { day: 'Sat', steps: 6234, date: 21 },
  { day: 'Sun', steps: 6496, date: 22 },
];

const timeFilters = ['Today', 'This Week', 'This Month', 'This Year'];
const statTypes = ['Steps', 'Time', 'Calories', 'Distance'];

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedFilter, setSelectedFilter] = useState('This Week');
  const [selectedStat, setSelectedStat] = useState('Steps');

  const maxSteps = Math.max(...weeklyData.map(d => d.steps));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Your <Text style={{ color: colors.primary }}>Report</Text>
        </Text>
        <TouchableOpacity style={[styles.menuButton, { backgroundColor: colors.card }]}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="footsteps" size={32} color="#FFFFFF" />
            <Text style={styles.summaryTotal}>256,480</Text>
          </View>
          <Text style={styles.summaryLabel}>Total steps all the time</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <View>
                <Text style={styles.summaryStatValue}>85h 24m</Text>
                <Text style={styles.summaryStatLabel}>time</Text>
              </View>
            </View>
            <View style={styles.summaryStat}>
              <Ionicons name="flame" size={20} color="#FFFFFF" />
              <View>
                <Text style={styles.summaryStatValue}>20,492</Text>
                <Text style={styles.summaryStatLabel}>kcal</Text>
              </View>
            </View>
            <View style={styles.summaryStat}>
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <View>
                <Text style={styles.summaryStatValue}>294.35</Text>
                <Text style={styles.summaryStatLabel}>km</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Filter Tabs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && { backgroundColor: colors.primary },
                selectedFilter !== filter && { backgroundColor: colors.card },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && { color: '#FFFFFF' },
                selectedFilter !== filter && { color: colors.text },
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            {statTypes.map((stat) => (
              <TouchableOpacity
                key={stat}
                style={[
                  styles.statType,
                  selectedStat === stat && styles.statTypeActive,
                ]}
                onPress={() => setSelectedStat(stat)}
              >
                <Text style={[
                  styles.statTypeText,
                  selectedStat === stat && { color: colors.primary },
                  selectedStat !== stat && { color: colors.icon },
                ]}>
                  {stat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bar Chart */}
          <View style={styles.chart}>
            {weeklyData.map((data, index) => {
              const height = (data.steps / maxSteps) * 150;
              const isToday = index === weeklyData.length - 1;
              
              return (
                <View key={data.day} style={styles.chartBar}>
                  <Text style={[styles.chartValue, { color: colors.text }]}>
                    {(data.steps / 1000).toFixed(1)}k
                  </Text>
                  <TouchableOpacity style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        { 
                          height,
                          backgroundColor: isToday ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.chartDay, { color: colors.icon }]}>
                    {data.date}
                  </Text>
                  <Text style={[styles.chartLabel, { color: colors.icon }]}>
                    {data.day.slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Progress Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <View style={styles.calendarHeader}>
            <Text style={[styles.calendarTitle, { color: colors.text }]}>
              Your Progress
            </Text>
            <TouchableOpacity style={styles.calendarNav}>
              <Text style={[styles.calendarMonth, { color: colors.text }]}>December</Text>
              <Ionicons name="chevron-down" size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendar}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={[styles.weekDay, { color: colors.icon }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarDays}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const hasActivity = day <= 22;
              const isToday = day === 22;
              
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.calendarDay,
                    isToday && { 
                      backgroundColor: colors.primary,
                      borderWidth: 0,
                    },
                    !isToday && hasActivity && { 
                      borderColor: colors.primary,
                      borderWidth: 2,
                    },
                    !hasActivity && {
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    isToday && { color: '#FFFFFF' },
                    !isToday && hasActivity && { color: colors.primary },
                    !hasActivity && { color: colors.icon },
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
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
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filtersScroll: {
    maxHeight: 50,
    marginBottom: 20,
  },
  filtersContent: {
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  statType: {
    paddingBottom: 8,
  },
  statTypeActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  statTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartValue: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  barContainer: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 28,
    borderRadius: 14,
  },
  chartDay: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  calendarCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calendarMonth: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

