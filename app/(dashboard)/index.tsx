import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  homes: number;
  tasks: number;
  vendors: number;
  inventory: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    homes: 0,
    tasks: 0,
    vendors: 0,
    inventory: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      const [homesRes, tasksRes, vendorsRes, inventoryRes] = await Promise.all([
        supabase.from('homes').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('vendors').select('*').eq('user_id', user.id),
        supabase.from('appliances').select('*'),
      ]);

      setStats({
        homes: homesRes.data?.length || 0,
        tasks: tasksRes.data?.length || 0,
        vendors: vendorsRes.data?.length || 0,
        inventory: inventoryRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: color }]} onPress={onPress}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderQuickAction = (title: string, icon: string, color: string, onPress: () => void) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#4F46E5']}
          tintColor="#4F46E5"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{getUserName()}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard('Homes', stats.homes, 'business', '#4F46E5', () => router.push('/(dashboard)/homes'))}
          {renderStatCard('Tasks', stats.tasks, 'checkbox', '#059669', () => router.push('/(dashboard)/tasks'))}
          {renderStatCard('Vendors', stats.vendors, 'people', '#DC2626', () => router.push('/(dashboard)/vendors'))}
          {renderStatCard('Inventory', stats.inventory, 'cube', '#7C3AED', () => router.push('/(dashboard)/inventory'))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {renderQuickAction('Add Home', 'add-circle', '#4F46E5', () => router.push('/(dashboard)/homes/add'))}
          {renderQuickAction('New Task', 'checkbox', '#059669', () => router.push('/(dashboard)/tasks/add'))}
          {renderQuickAction('Add Vendor', 'person-add', '#DC2626', () => router.push('/(dashboard)/vendors/add'))}
          {renderQuickAction('Add Item', 'cube', '#7C3AED', () => router.push('/(dashboard)/inventory/add'))}
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 64,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
}); 