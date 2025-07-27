import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCalendar } from '../../lib/contexts/CalendarContext';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useInventory } from '../../lib/contexts/InventoryContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CalendarEvent } from '../../types/database';

interface Task {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
}

interface Event extends CalendarEvent {
  // Extends CalendarEvent from types/database.ts
}

interface Vendor {
  id: string;
  name: string;
  category: string | null;
}

interface InventoryItem {
  id: string;
  name: string;
  warranty_expiry: string | null;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { homes, loading: homesLoading, onRefresh: homesRefresh } = useHomes();
  const { tasks: allTasks, loading: tasksLoading, syncTasksToCalendar, onRefresh: tasksRefresh } = useTasks();
  const { events, loading: eventsLoading, onRefresh: eventsRefresh } = useCalendar();
  const { vendors, loading: vendorsLoading, onRefresh: vendorsRefresh } = useVendors();
  const { items: inventory, loading: inventoryLoading, onRefresh: inventoryRefresh } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Get the latest 5 items from each context
  const tasks = allTasks.slice(0, 5);
  const recentEvents = events.slice(0, 5);
  const recentVendors = vendors.slice(0, 5);
  const recentInventory = inventory.slice(0, 5);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh all contexts using their onRefresh methods
    Promise.all([
      homesRefresh?.() || Promise.resolve(),
      tasksRefresh?.() || Promise.resolve(),
      eventsRefresh?.() || Promise.resolve(),
      vendorsRefresh?.() || Promise.resolve(),
      inventoryRefresh?.() || Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleSyncTasksToCalendar = async () => {
    try {
      await syncTasksToCalendar();
      Alert.alert('Success', 'Tasks synced to calendar successfully!');
    } catch (error) {
      console.error('Error syncing tasks to calendar:', error);
      Alert.alert('Error', 'Failed to sync tasks to calendar');
    }
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => task.status !== 'completed').slice(0, 3);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return recentEvents.filter(event => new Date(event.start_time) >= now).slice(0, 3);
  };

  const getExpiringWarranties = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return recentInventory.filter(item => {
      if (!item.warranty_expiry) return false;
      const expiryDate = new Date(item.warranty_expiry);
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
    }).slice(0, 3);
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(dashboard)/homes/add')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="home-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(dashboard)/tasks/add')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(dashboard)/calendar/add')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="calendar-outline" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(dashboard)/inventory/add')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="cube-outline" size={24} color={colors.info} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Item</Text>
        </TouchableOpacity>
      </View>
      
      {/* Test button for debugging recurring tasks */}
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: colors.primary }]}
        onPress={handleSyncTasksToCalendar}
      >
        <Ionicons name="sync-outline" size={20} color={colors.textInverse} />
        <Text style={[styles.testButtonText, { color: colors.textInverse }]}>Sync Tasks to Calendar (Debug)</Text>
      </TouchableOpacity>
      
      {/* Test button for checking calendar events */}
      <TouchableOpacity
        style={[styles.testButton, { marginTop: 8, backgroundColor: colors.secondary }]}
        onPress={async () => {
          try {
            const { data, error } = await supabase
              .from('calendar_events')
              .select('*')
              .eq('user_id', user?.id || '');
            
            if (error) {
              console.error('Error fetching calendar events:', error);
            } else {
              console.log('=== CALENDAR EVENTS DATABASE CHECK ===');
              console.log('Total calendar events in database:', data?.length);
              
              const recurringEvents = data?.filter(event => event.is_recurring) || [];
              const regularEvents = data?.filter(event => !event.is_recurring) || [];
              
              console.log('Regular events:', regularEvents.length);
              console.log('Recurring events:', recurringEvents.length);
              
              recurringEvents.forEach((event, index) => {
                console.log(`Recurring Event ${index + 1}:`, {
                  id: event.id,
                  title: event.title,
                  is_recurring: event.is_recurring,
                  recurrence_pattern: event.recurrence_pattern,
                  recurrence_end_date: event.recurrence_end_date,
                  start_time: event.start_time,
                  task_id: event.task_id
                });
              });
              
              console.log('=== END CALENDAR EVENTS DATABASE CHECK ===');
            }
          } catch (error) {
            console.error('Error checking calendar events:', error);
          }
        }}
      >
        <Ionicons name="eye-outline" size={20} color={colors.textInverse} />
        <Text style={[styles.testButtonText, { color: colors.textInverse }]}>Check Calendar Events</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatistics = () => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === 'completed').length;
    const upcomingEvents = getUpcomingEvents().length;
    const expiringWarranties = getExpiringWarranties().length;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="home" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{homes.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Homes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{completedTasks}/{totalTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Tasks</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="calendar" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{upcomingEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Events</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="warning" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{expiringWarranties}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Expiring</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentActivity = () => (
    <View style={styles.recentActivityContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/tasks')}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {getUpcomingTasks().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.activitySectionTitle, { color: colors.textSecondary }]}>Upcoming Tasks</Text>
          {getUpcomingTasks().map((task) => (
            <View key={task.id} style={[styles.activityItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color={task.priority === 'high' ? colors.error : task.priority === 'medium' ? colors.warning : colors.success} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                <Text style={[styles.activityDate, { color: colors.textTertiary }]}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {getUpcomingEvents().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.activitySectionTitle, { color: colors.textSecondary }]}>Upcoming Events</Text>
          {getUpcomingEvents().map((event) => (
            <View key={event.id} style={[styles.activityItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.activityDate, { color: colors.textTertiary }]}>
                  {new Date(event.start_time).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {getExpiringWarranties().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.activitySectionTitle, { color: colors.textSecondary }]}>Expiring Warranties</Text>
          {getExpiringWarranties().map((item) => (
            <View key={item.id} style={[styles.activityItem, { backgroundColor: colors.surface }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.activityDate, { color: colors.textTertiary }]}>
                  Expires {item.warranty_expiry ? new Date(item.warranty_expiry).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { 
      backgroundColor: colors.surface,
      borderBottomColor: colors.border 
    }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.appTitle, { color: colors.text }]}>OrderlyFlow</Text>
        <Text style={[styles.appSubtitle, { color: colors.textTertiary }]}>Property Management</Text>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.push('/(dashboard)/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.push('/(dashboard)/profile')}
        >
          <Ionicons name="person-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.push('/(dashboard)/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Check if any context is still loading
  const isLoading = homesLoading || tasksLoading || eventsLoading || vendorsLoading || inventoryLoading;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 80
    }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {renderStatistics()}
          {renderQuickActions()}
          {renderRecentActivity()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statisticsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  recentActivityContainer: {
    paddingBottom: 20,
  },
  activitySection: {
    marginBottom: 20,
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 