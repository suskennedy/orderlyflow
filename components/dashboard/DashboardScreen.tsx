import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Task {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
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
  const { homes, loading: homesLoading } = useHomes();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      if (!user?.id) return;

      const [tasksData, eventsData, vendorsData, inventoryData] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, priority, due_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('calendar_events')
          .select('id, title, start_time, end_time')
          .eq('user_id', user.id)
          .order('start_time', { ascending: true })
          .limit(5),
        supabase
          .from('vendors')
          .select('id, name, category')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('appliances')
          .select('id, name, warranty_expiration')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setTasks(tasksData.data || []);
      setEvents(eventsData.data || []);
      setVendors(vendorsData.data || []);
      setInventory((inventoryData.data || []).map(item => ({
        ...item,
        warranty_expiry: item.warranty_expiration
      })));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => task.status !== 'completed').slice(0, 3);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => new Date(event.start_time) >= now).slice(0, 3);
  };

  const getExpiringWarranties = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return inventory.filter(item => {
      if (!item.warranty_expiry) return false;
      const expiryDate = new Date(item.warranty_expiry);
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
    }).slice(0, 3);
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(dashboard)/homes/add')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="home-outline" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.quickActionText}>Add Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(dashboard)/tasks/add')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
          </View>
          <Text style={styles.quickActionText}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(dashboard)/calendar/add')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="calendar-outline" size={24} color="#DC2626" />
          </View>
          <Text style={styles.quickActionText}>Add Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(dashboard)/inventory/add')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="cube-outline" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.quickActionText}>Add Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatistics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const upcomingEvents = getUpcomingEvents().length;
    const expiringWarranties = getExpiringWarranties().length;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="home" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.statNumber}>{homes.length}</Text>
            <Text style={styles.statLabel}>Homes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
            <Text style={styles.statNumber}>{completedTasks}/{totalTasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={20} color="#DC2626" />
            </View>
            <Text style={styles.statNumber}>{upcomingEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{expiringWarranties}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentActivity = () => (
    <View style={styles.recentActivityContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/tasks')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {getUpcomingTasks().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activitySectionTitle}>Upcoming Tasks</Text>
          {getUpcomingTasks().map((task) => (
            <View key={task.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color={task.priority === 'high' ? '#DC2626' : task.priority === 'medium' ? '#F59E0B' : '#059669'} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>{task.title}</Text>
                <Text style={styles.activityDate}>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {getUpcomingEvents().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activitySectionTitle}>Upcoming Events</Text>
          {getUpcomingEvents().map((event) => (
            <View key={event.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="calendar-outline" size={16} color="#DC2626" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.activityDate}>
                  {new Date(event.start_time).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {getExpiringWarranties().length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.activitySectionTitle}>Expiring Warranties</Text>
          {getExpiringWarranties().map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.activityDate}>
                  Expires {item.warranty_expiry ? new Date(item.warranty_expiry).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading || homesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 90 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</Text>
          <Text style={styles.username}>{user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={32} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStatistics()}
        {renderQuickActions()}
        {renderRecentActivity()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
    color: '#4F46E5',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  recentActivityContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activitySection: {
    marginBottom: 20,
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
  },
}); 