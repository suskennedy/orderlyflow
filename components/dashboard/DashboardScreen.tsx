import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { routes } from '../../lib/navigation';
import { supabase } from '../../lib/supabase';
import { CalendarEvent } from '../../types/database';
import TaskCompletionModal from '../ui/TaskCompletionModal';

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
  const { tasks: allTasks, loading: tasksLoading, syncTasksToCalendar, onRefresh: tasksRefresh, completeTask } = useTasks();
  const { events, loading: eventsLoading, onRefresh: eventsRefresh } = useCalendar();
  const { vendors, loading: vendorsLoading, onRefresh: vendorsRefresh } = useVendors();
  const { items: inventory, loading: inventoryLoading, onRefresh: inventoryRefresh } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<any>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Get the latest 5 items from each context - memoized for performance
  const tasks = useMemo(() => allTasks.slice(0, 5), [allTasks]);
  const recentEvents = useMemo(() => events.slice(0, 5), [events]);
  const recentVendors = useMemo(() => vendors.slice(0, 5), [vendors]);
  const recentInventory = useMemo(() => inventory.slice(0, 5), [inventory]);

  // Track task updates for real-time debugging
  useEffect(() => {
    console.log('Dashboard: Tasks updated, count:', allTasks.length);
    if (allTasks.length > 0) {
      console.log('Dashboard: Latest task:', allTasks[0].title);
    }
  }, [allTasks]);

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
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return allTasks
      .filter(task => {
        // Only show active, non-completed tasks
        if (task.status === 'completed' || !task.is_active) return false;
        
        // If task has a due date, check if it's within 30 days
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          return dueDate >= now && dueDate <= thirtyDaysFromNow;
        }
        
        // If no due date, show tasks created recently (within last 7 days)
        if (task.created_at) {
          const createdDate = new Date(task.created_at);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdDate >= sevenDaysAgo;
        }
        
        return false;
      })
      .sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1, 'urgent': 4 };
        const aPriority = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Then sort by due date (earliest first)
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        
        // If one has due date and other doesn't, prioritize the one with due date
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        // Finally sort by creation date (newest first)
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        
        return 0;
      })
      .slice(0, 5); // Show top 5 upcoming tasks
  };

  const getTasksForThisWeek = () => {
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return allTasks
      .filter(task => {
        // Only show active, non-completed tasks
        if (task.status === 'completed' || task.is_active === false) return false;
        
        // Handle recurring tasks based on frequency
        if (task.is_recurring && task.recurrence_pattern) {
          const pattern = task.recurrence_pattern.toLowerCase();
          
          switch (pattern) {
            case 'daily':
              // Daily tasks should always show in this week
              return true;
              
            case 'weekly':
              // Weekly tasks should show if they're due this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate >= now && dueDate <= endOfWeek;
              }
              // If no due date, show weekly tasks
              return true;
              
            case 'bi-weekly':
            case 'biweekly':
              // Bi-weekly tasks should show if they're due this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate >= now && dueDate <= endOfWeek;
              }
              return false;
              
            case 'monthly':
            case 'quarterly':
            case 'semi-annually':
            case 'annually':
            case 'yearly':
              // Monthly and longer frequency tasks should show if they're due this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate >= now && dueDate <= endOfWeek;
              }
              return false;
              
            default:
              // For unknown patterns, check due date
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate >= now && dueDate <= endOfWeek;
              }
              return false;
          }
        }
        
        // For non-recurring tasks, check if they're due this week
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          return dueDate >= now && dueDate <= endOfWeek;
        }
        
        // If no due date and not recurring, show the task anyway (newly added tasks)
        return true;
      })
      .sort((a, b) => {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        // Tasks without due dates go to the end
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && !b.due_date) return -1;
        return 0;
      });
  };

  const getTasksForThisMonth = () => {
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endOfMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return allTasks
      .filter(task => {
        // Only show active, non-completed tasks
        if (task.status === 'completed' || task.is_active === false) return false;
        
        // Handle recurring tasks based on frequency
        if (task.is_recurring && task.recurrence_pattern) {
          const pattern = task.recurrence_pattern.toLowerCase();
          
          switch (pattern) {
            case 'daily':
              // Daily tasks should not show in this month (already in this week)
              return false;
              
            case 'weekly':
              // Weekly tasks should show if they're due this month but after this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
              
            case 'bi-weekly':
            case 'biweekly':
              // Bi-weekly tasks should show if they're due this month but after this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
              
            case 'monthly':
              // Monthly tasks should show if they're due this month but after this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
              
            case 'quarterly':
              // Quarterly tasks should show if they're due this month but after this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
              
            case 'semi-annually':
            case 'annually':
            case 'yearly':
              // Longer frequency tasks should show if they're due this month but after this week
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
              
            default:
              // For unknown patterns, check due date
              if (task.due_date) {
                const dueDate = new Date(task.due_date);
                return dueDate > endOfWeek && dueDate <= endOfMonth;
              }
              return false;
          }
        }
        
        // For non-recurring tasks, check if they're due this month but after this week
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          return dueDate > endOfWeek && dueDate <= endOfMonth;
        }
        
        // If no due date, don't show in this month (already shown in this week)
        return false;
      })
      .sort((a, b) => {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return 0;
      });
  };

  const groupTasksByCategory = (tasks: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    tasks.forEach(task => {
      const category = task.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(task);
    });
    
    return grouped;
  };

  const handleTaskClick = useCallback((task: any) => {
    if (task.status === 'completed') {
      // If already completed, uncomplete it
      handleTaskUncomplete(task.id);
    } else {
      // If not completed, show completion modal
      setSelectedTaskForCompletion(task);
      setCompletionModalVisible(true);
    }
  }, []);

  const handleTaskUncomplete = useCallback(async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await completeTask(taskId, {
        status: 'pending',
        completed_by_type: null,
        completed_at: null,
        completion_verification_status: null,
        completion_notes: null
      });
    } catch (error) {
      console.error('Error uncompleting task:', error);
      Alert.alert('Error', 'Failed to uncomplete task. Please try again.');
    } finally {
      setCompletingTaskId(null);
    }
  }, [completeTask]);

  const handleTaskComplete = useCallback(async (completionData: {
    notes: string;
    completedBy: 'user' | 'vendor' | 'external';
    externalName?: string;
    vendorId?: string;
  }) => {
    if (!selectedTaskForCompletion) return;

    try {
      setCompletingTaskId(selectedTaskForCompletion.id);
      
      const completionPayload: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_verification_status: 'verified',
        completion_notes: completionData.notes || 'Completed from dashboard',
        completed_by_type: completionData.completedBy,
      };

      // Add specific completion details based on who completed it
      if (completionData.completedBy === 'vendor' && completionData.vendorId) {
        completionPayload.completed_by_vendor_id = completionData.vendorId;
      } else if (completionData.completedBy === 'external' && completionData.externalName) {
        completionPayload.completed_by_external_name = completionData.externalName;
      } else {
        completionPayload.completed_by_user_id = null; // Will be set by backend
      }

      await completeTask(selectedTaskForCompletion.id, completionPayload);
      
      // Close modal and reset state
      setCompletionModalVisible(false);
      setSelectedTaskForCompletion(null);
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setCompletingTaskId(null);
    }
  }, [completeTask, selectedTaskForCompletion]);

  const handleCancelCompletion = useCallback(() => {
    setCompletionModalVisible(false);
    setSelectedTaskForCompletion(null);
  }, []);

  const renderTaskWithCheckbox = useCallback((task: any) => (
    <TouchableOpacity
      key={task.id}
      style={[
        styles.taskCheckboxItem,
        { opacity: completingTaskId === task.id ? 0.6 : 1 }
      ]}
      onPress={() => handleTaskClick(task)}
      disabled={completingTaskId === task.id}
    >
      <View style={[
        styles.checkbox,
        { 
          backgroundColor: task.status === 'completed' ? colors.primary : 'transparent',
          borderColor: colors.primary
        }
      ]}>
        {task.status === 'completed' && (
          <Ionicons name="checkmark" size={12} color={colors.background} />
        )}
      </View>
      <Text style={[
        styles.taskCheckboxText,
        { 
          color: colors.text,
          textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
          opacity: task.status === 'completed' ? 0.6 : 1
        }
      ]}>
        {task.title}
      </Text>
    </TouchableOpacity>
  ), [colors, completingTaskId, handleTaskClick]);

  const renderTaskCategory = useCallback((category: string, tasks: any[]) => (
    <View key={category} style={styles.taskCategorySection}>
      <View style={[styles.taskCategoryTitleContainer, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.taskCategoryTitle, { color: colors.primary }]}>
          {category}
        </Text>
      </View>
      {tasks.map(renderTaskWithCheckbox)}
    </View>
  ), [colors, renderTaskWithCheckbox]);

  const renderTasksSection = () => {
    const weekTasks = getTasksForThisWeek();
    const monthTasks = getTasksForThisMonth();
    const weekTasksGrouped = groupTasksByCategory(weekTasks);
    const monthTasksGrouped = groupTasksByCategory(monthTasks);

    return (
      <View style={styles.tasksContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
          <TouchableOpacity onPress={() => router.push(routes.tasks.selector as any)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tasksColumns}>
          {/* This Week Column */}
          <View style={styles.tasksColumn}>
            <Text style={[styles.columnTitle, { color: colors.text }]}>This Week</Text>
            {Object.keys(weekTasksGrouped).length > 0 ? (
              Object.entries(weekTasksGrouped).map(([category, tasks]) => 
                renderTaskCategory(category, tasks)
              )
            ) : (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks this week
              </Text>
            )}
          </View>

          {/* This Month Column */}
          <View style={styles.tasksColumn}>
            <Text style={[styles.columnTitle, { color: colors.text }]}>This Month</Text>
            {Object.keys(monthTasksGrouped).length > 0 ? (
              Object.entries(monthTasksGrouped).map(([category, tasks]) => 
                renderTaskCategory(category, tasks)
              )
            ) : (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks this month
              </Text>
            )}
          </View>
        </View>
      </View>
    );
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
          onPress={() => router.push(routes.home.add as any)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="home-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push(routes.tasks.add as any)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push(routes.calendar.add as any)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="calendar-outline" size={24} color={colors.accent} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Add Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push(routes.inventory.add as any)}
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
      
      {/* Cleanup button for removing duplicate events */}
      <TouchableOpacity
        style={[styles.testButton, { marginTop: 8, backgroundColor: colors.warning }]}
        onPress={async () => {
          try {
            Alert.alert(
              'Cleanup Calendar Events',
              'This will remove duplicate calendar events. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Cleanup',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Get all calendar events
                      const { data: allEvents, error: fetchError } = await supabase
                        .from('calendar_events')
                        .select('*')
                        .eq('user_id', user?.id || '');
                      
                      if (fetchError) {
                        console.error('Error fetching events:', fetchError);
                        Alert.alert('Error', 'Failed to fetch calendar events');
                        return;
                      }
                      
                      // Find duplicates (same task_id and start_time)
                      const duplicates = new Set();
                      const toDelete: string[] = [];
                      
                      allEvents?.forEach((event, index) => {
                        const key = `${event.task_id}_${event.start_time}`;
                        if (duplicates.has(key)) {
                          toDelete.push(event.id);
                        } else {
                          duplicates.add(key);
                        }
                      });
                      
                      if (toDelete.length > 0) {
                        // Delete duplicate events
                        const { error: deleteError } = await supabase
                          .from('calendar_events')
                          .delete()
                          .in('id', toDelete);
                        
                        if (deleteError) {
                          console.error('Error deleting duplicates:', deleteError);
                          Alert.alert('Error', 'Failed to delete duplicate events');
                        } else {
                          console.log(`Deleted ${toDelete.length} duplicate events`);
                          Alert.alert('Success', `Cleaned up ${toDelete.length} duplicate events`);
                          // Refresh calendar events
                          setTimeout(() => eventsRefresh?.(), 100);
                        }
                      } else {
                        Alert.alert('Info', 'No duplicate events found');
                      }
                    } catch (error) {
                      console.error('Error during cleanup:', error);
                      Alert.alert('Error', 'Failed to cleanup calendar events');
                    }
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Error during cleanup:', error);
          }
        }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textInverse} />
        <Text style={[styles.testButtonText, { color: colors.textInverse }]}>Cleanup Duplicates</Text>
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
        <TouchableOpacity onPress={() => router.push(routes.tasks.index as any)}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

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

  const renderUpcomingTasks = () => {
    const upcomingTasks = getUpcomingTasks();
    
    if (upcomingTasks.length === 0) {
      return (
        <View style={styles.upcomingTasksContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => router.push(routes.tasks.index as any)}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Upcoming Tasks</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              You're all caught up! Add new tasks to see them here.
            </Text>
            <TouchableOpacity
              style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(routes.tasks.add as any)}
            >
              <Ionicons name="add" size={20} color={colors.textInverse} />
              <Text style={[styles.addTaskButtonText, { color: colors.textInverse }]}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.upcomingTasksContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Tasks</Text>
          <TouchableOpacity onPress={() => router.push(routes.tasks.index as any)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingTasks.map((task, index) => {
          const dueDate = task.due_date ? new Date(task.due_date) : null;
          const isOverdue = dueDate && dueDate < new Date();
          const isDueToday = dueDate && dueDate.toDateString() === new Date().toDateString();
          const isDueTomorrow = dueDate && dueDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
          
          const getPriorityColor = () => {
            switch (task.priority?.toLowerCase()) {
              case 'urgent': return colors.error;
              case 'high': return colors.error;
              case 'medium': return colors.warning;
              case 'low': return colors.success;
              default: return colors.textSecondary;
            }
          };

          const getDueDateText = () => {
            if (!dueDate) return 'No due date';
            if (isOverdue) return `Overdue ${dueDate.toLocaleDateString()}`;
            if (isDueToday) return 'Due today';
            if (isDueTomorrow) return 'Due tomorrow';
            return `Due ${dueDate.toLocaleDateString()}`;
          };

          const getDueDateColor = () => {
            if (isOverdue) return colors.error;
            if (isDueToday) return colors.warning;
            if (isDueTomorrow) return colors.warning;
            return colors.textTertiary;
          };

          return (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                { backgroundColor: colors.surface },
                isOverdue && { borderLeftWidth: 4, borderLeftColor: colors.error }
              ]}
              onPress={() => router.push(routes.tasks.index as any)}
            >
              <View style={styles.taskCardHeader}>
                <View style={styles.taskCardLeft}>
                  <View style={[
                    styles.taskPriorityIndicator,
                    { backgroundColor: getPriorityColor() }
                  ]} />
                  <View style={styles.taskCardContent}>
                    <Text style={[styles.taskCardTitle, { color: colors.text }]} numberOfLines={2}>
                      {task.title}
                    </Text>
                    {task.category && (
                      <Text style={[styles.taskCardCategory, { color: colors.textSecondary }]}>
                        {task.category}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.taskCardRight}>
                  {task.priority && (
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor() + '20' }
                    ]}>
                      <Text style={[
                        styles.priorityText,
                        { color: getPriorityColor() }
                      ]}>
                        {task.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.taskCardFooter}>
                <View style={styles.taskCardInfo}>
                  <Ionicons name="calendar-outline" size={14} color={getDueDateColor()} />
                  <Text style={[
                    styles.taskCardDate,
                    { color: getDueDateColor() }
                  ]}>
                    {getDueDateText()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

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
          onPress={() => router.push(routes.notifications as any)}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.push(routes.profile.index as any)}
        >
          <Ionicons name="person-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.push(routes.settings.index as any)}
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
          {renderUpcomingTasks()}
          {renderTasksSection()}
          {renderRecentActivity()}
        </View>
      </ScrollView>
      
      {/* Task Completion Modal */}
      <TaskCompletionModal
        visible={completionModalVisible}
        task={selectedTaskForCompletion}
        onComplete={handleTaskComplete}
        onCancel={handleCancelCompletion}
        isLoading={!!completingTaskId}
      />
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
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityCategory: {
    fontSize: 12,
    marginTop: 2,
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
  upcomingTasksContainer: {
    marginBottom: 20,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskPriorityIndicator: {
    width: 8,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  taskCardContent: {
    flex: 1,
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskCardCategory: {
    fontSize: 12,
  },
  taskCardRight: {
    alignItems: 'flex-end',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCardDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  addTaskButton: {
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
  addTaskButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  tasksContainer: {
    marginBottom: 20,
  },
  tasksColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  tasksColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noTasksText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  taskCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  taskCheckboxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  taskCategorySection: {
    marginBottom: 16,
  },
  taskCategoryTitleContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  taskCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 