import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../lib/hooks/useAuth';
import { useHomes } from '../../lib/hooks/useHomes';
import { navigate } from '../../lib/navigation';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types/database';

export default function Dashboard() {
  const { user, userProfile, signOut } = useAuth();
  const { currentHome, homes, loading: homesLoading } = useHomes();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });

  useEffect(() => {
    if (currentHome) {
      fetchRecentTasks();
      fetchTaskStats();
    }
  }, [currentHome]);

  const fetchRecentTasks = async () => {
    if (!currentHome) return;

    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('home_id', currentHome.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent tasks:', error);
      } else {
        setRecentTasks(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    if (!currentHome) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('home_id', currentHome.id);

      if (error) {
        console.error('Error fetching task stats:', error);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const totalTasks = data?.length || 0;
      const completedTasks = data?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = data?.filter(task => task.status === 'pending').length || 0;
      const overdueTasks = data?.filter(task => 
        task.status !== 'completed' && 
        task.due_date && 
        task.due_date < today
      ).length || 0;

      setStats({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleAddHome = () => {
    navigate.toAddHome();
  };

  const handleViewHomes = () => {
    router.push('/homes' as any);
  };

  const handleAddTask = () => {
    navigate.toAddTask();
  };

  const handleAddAppliance = () => {
    navigate.toAddAppliance();
  };

  const handleViewCalendar = () => {
    navigate.toCalendar();
  };

  const handleViewInventory = () => {
    navigate.toInventory();
  };

  const handleViewTasks = () => {
    router.push('/tasks' as any);
  };

  const getStatusBadgeStyle = (status: string | null) => {
    switch (status) {
      case 'pending': return styles.pendingBadge;
      case 'in_progress': return styles.inProgressBadge;
      case 'completed': return styles.completedBadge;
      case 'overdue': return styles.overdueBadge;
      default: return styles.pendingBadge;
    }
  };

  const getStatusTextStyle = (status: string | null) => {
    switch (status) {
      case 'pending': return styles.pendingText;
      case 'in_progress': return styles.inProgressText;
      case 'completed': return styles.completedText;
      case 'overdue': return styles.overdueText;
      default: return styles.pendingText;
    }
  };

  const getPriorityStyle = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return styles.urgentPriority;
      case 'high': return styles.highPriority;
      case 'medium': return styles.mediumPriority;
      case 'low': return styles.lowPriority;
      default: return styles.mediumPriority;
    }
  };

  if (homesLoading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  if (!currentHome && homes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Welcome to OrderlyFlow!</Text>
          <Text style={styles.emptyDescription}>
            Lets start by adding your first home to begin managing your household tasks and inventory.
          </Text>
          <Button
            title="Add Your First Home"
            onPress={handleAddHome}
            style={styles.addHomeButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
          </Text>
          <Text style={styles.userName}>{userProfile?.display_name || userProfile?.full_name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Home */}
        {currentHome && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Home</Text>
              {homes.length > 1 && (
                <TouchableOpacity onPress={handleViewHomes}>
                  <Text style={styles.sectionAction}>Switch</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.homeCard}>
              <View style={styles.homeInfo}>
                <Text style={styles.homeName}>{currentHome.name}</Text>
                {currentHome.address && (
                  <Text style={styles.homeAddress}>{currentHome.address}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>
        )}

        {/* Task Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.totalStat]}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={[styles.statCard, styles.completedStat]}>
              <Text style={styles.statNumber}>{stats.completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, styles.pendingStat]}>
              <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, styles.overdueStat]}>
              <Text style={styles.statNumber}>{stats.overdueTasks}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* Recent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Tasks</Text>
            <TouchableOpacity onPress={handleViewTasks}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {tasksLoading ? (
            <LoadingSpinner size="small" />
          ) : recentTasks.length > 0 ? (
            <View style={styles.tasksList}>
              {recentTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
                      <Text style={[styles.statusText, getStatusTextStyle(task.status)]}>
                        {task.status?.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    {task.priority && (
                      <View style={[styles.priorityBadge, getPriorityStyle(task.priority)]}>
                        <Text style={styles.priorityText}>
                          {task.priority.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTasks}>
              <Text style={styles.emptyTasksText}>No tasks yet</Text>
              <Button
                title="Create Your First Task"
                onPress={handleAddTask}
                size="small"
              />
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleAddTask}
            >
              <Ionicons name="add-circle-outline" size={32} color="#4F46E5" />
              <Text style={styles.quickActionText}>Add Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleAddAppliance}
            >
              <Ionicons name="construct-outline" size={32} color="#4F46E5" />
              <Text style={styles.quickActionText}>Add Appliance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleViewCalendar}
            >
              <Ionicons name="calendar-outline" size={32} color="#4F46E5" />
              <Text style={styles.quickActionText}>View Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={handleViewInventory}
            >
              <Ionicons name="grid-outline" size={32} color="#4F46E5" />
              <Text style={styles.quickActionText}>View Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  signOutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionAction: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  homeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  homeAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  totalStat: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  completedStat: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  pendingStat: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  overdueStat: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  tasksList: {
    gap: 8,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  taskCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    color: '#92400E',
  },
  inProgressBadge: {
    backgroundColor: '#DBEAFE',
  },
  inProgressText: {
    color: '#1E40AF',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  completedText: {
    color: '#065F46',
  },
  overdueBadge: {
    backgroundColor: '#FEF2F2',
  },
  overdueText: {
    color: '#991B1B',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  lowPriority: {
    backgroundColor: '#6B7280',
  },
  mediumPriority: {
    backgroundColor: '#F59E0B',
  },
  highPriority: {
    backgroundColor: '#EF4444',
  },
  urgentPriority: {
    backgroundColor: '#DC2626',
  },
  emptyTasks: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addHomeButton: {
    paddingHorizontal: 32,
  },
}); 