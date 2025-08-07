import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { routes } from '../../lib/navigation';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { onRefresh: homesRefresh, homes } = useHomes();
  const { tasks: allTasks, onRefresh: tasksRefresh, completeTask } = useTasks();
  const { events, onRefresh: eventsRefresh } = useCalendar();
  const { onRefresh: vendorsRefresh } = useVendors();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Get the latest 5 items from each context
  const tasks = allTasks.slice(0, 5);
  const recentEvents = events.slice(0, 5);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh all contexts using their onRefresh methods
    Promise.all([
      homesRefresh?.() || Promise.resolve(),
      tasksRefresh?.() || Promise.resolve(),
      eventsRefresh?.() || Promise.resolve(),
      vendorsRefresh?.() || Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      // Find the task to get current status
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      // If task is already completed, uncomplete it
      if (task.status === 'completed') {
        await completeTask(taskId, {
          status: 'pending',
          completed_by_type: null,
          completed_at: null,
          completion_verification_status: null,
          completion_notes: null,
          last_completed: null,
          completion_date: null
        });
      } else {
        // Complete the task
        await completeTask(taskId, {
          completed_by_type: 'user',
          completed_at: new Date().toISOString(),
          completion_verification_status: 'verified',
          completion_notes: 'Completed from home screen'
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Simple test to show all tasks if none are being displayed
  const showAllTasks = allTasks.length > 0 && allTasks.filter(task => 
    task.task_type === 'custom' || 
    task.task_type === 'preset' || 
    !task.task_type
  ).length === 0;

  // const getUpcomingTasks = () => {
  //   return tasks.filter(task => task.status !== 'completed').slice(0, 3);
  // };

  // const getUpcomingEvents = () => {
  //   const now = new Date();
  //   return recentEvents.filter(event => new Date(event.start_time) >= now).slice(0, 3);
  // };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      {/* Upper Left - Home (Dashboard) and Profile/User */}
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/' as any)}
        >
          <Ionicons name="home" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(profile)' as any)}
        >
          <Ionicons name="person" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Center - Empty space where Dashboard text was */}
      <View style={styles.headerCenter} />

      {/* Upper Right - Settings, Info, and Flo */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(settings)' as any)}
        >
          <Ionicons name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/info' as any)}
        >
          <Ionicons name="information-circle" size={20} color={colors.text} />
        </TouchableOpacity>
        
      </View>
    </View>
  );

  const renderQuickLinks = () => (
    <View style={styles.quickLinksContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Links</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickLinksScroll}
      >
        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(routes.vendors.add as any)}
        >
          <Ionicons name="person-add" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(routes.tasks.settings as any)}
        >
          <Ionicons name="checkbox" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(routes.tabs.flo as any)}
        >
          <Ionicons name="chatbubble" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Ask Flo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => {
            // Check if user has homes, if not redirect to add home first
            if (homes.length === 0) {
              router.push(routes.home.add as any);
            } else {
              // Navigate to the first home's appliances page
              const firstHome = homes[0];
              router.push(routes.home.appliances(firstHome.id) as any);
            }
          }}
        >
          <Ionicons name="construct" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Appliance</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTasks = () => {
    // Filter user tasks (custom and preset) - show all active tasks
    let userTasks = allTasks.filter(task => 
      (task.task_type === 'custom' || 
       task.task_type === 'preset' || 
       !task.task_type) &&
      task.is_active !== false // Show all tasks that are not explicitly inactive
    );

    // If no tasks found with filtering, show all tasks
    if (userTasks.length === 0) {
      userTasks = allTasks;
    }

    // Group tasks by time period - handle frequencies properly
    const now = new Date();
    const thisWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thisYear = new Date(now.getFullYear() + 1, 0, 1); // End of current year

    // Filter tasks for this week based on frequency
    const thisWeekTasks = userTasks.filter(task => {
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
              return dueDate <= thisWeek && dueDate >= now;
            }
            // If no due date, show weekly tasks
            return true;
            
          case 'bi-weekly':
          case 'biweekly':
            // Bi-weekly tasks should show if they're due this week
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisWeek && dueDate >= now;
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
              return dueDate <= thisWeek && dueDate >= now;
            }
            return false;
            
          default:
            // For unknown patterns, check due date
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisWeek && dueDate >= now;
            }
            return false;
        }
      }
      
      // For non-recurring tasks, check if they're due this week
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate <= thisWeek && dueDate >= now;
      }
      
      // If no due date and not recurring, show the task anyway (newly added tasks)
      return true;
    });

    // Filter tasks for this month based on frequency (exclude this week tasks)
    const thisMonthTasks = userTasks.filter(task => {
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
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
            
          case 'bi-weekly':
          case 'biweekly':
            // Bi-weekly tasks should show if they're due this month but after this week
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
            
          case 'monthly':
            // Monthly tasks should show if they're due this month but after this week
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
            
          case 'quarterly':
            // Quarterly tasks should show if they're due this month but after this week
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
            
          case 'semi-annually':
          case 'annually':
          case 'yearly':
            // Longer frequency tasks should show if they're due this month but after this week
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
            
          default:
            // For unknown patterns, check due date
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisMonth && dueDate > thisWeek;
            }
            return false;
        }
      }
      
      // For non-recurring tasks, check if they're due this month but after this week
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate <= thisMonth && dueDate > thisWeek;
      }
      
      // If no due date, don't show in this month (already shown in this week)
      return false;
    });

    // Filter tasks for this year based on frequency (exclude this week and this month tasks)
    const thisYearTasks = userTasks.filter(task => {
      if (task.status === 'completed' || task.is_active === false) return false;
      
      // Handle recurring tasks based on frequency
      if (task.is_recurring && task.recurrence_pattern) {
        const pattern = task.recurrence_pattern.toLowerCase();
        
        switch (pattern) {
          case 'daily':
          case 'weekly':
          case 'bi-weekly':
          case 'biweekly':
          case 'monthly':
            // These frequencies should not show in this year (already in this week/month)
            return false;
            
          case 'quarterly':
            // Quarterly tasks should show if they're due this year but after this month
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisYear && dueDate > thisMonth;
            }
            return false;
            
          case 'semi-annually':
            // Semi-annually tasks should show if they're due this year but after this month
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisYear && dueDate > thisMonth;
            }
            return false;
            
          case 'annually':
          case 'yearly':
            // Annual tasks should show if they're due this year but after this month
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisYear && dueDate > thisMonth;
            }
            return false;
            
          default:
            // For unknown patterns, check due date
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              return dueDate <= thisYear && dueDate > thisMonth;
            }
            return false;
        }
      }
      
      // For non-recurring tasks, check if they're due this year but after this month
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        return dueDate <= thisYear && dueDate > thisMonth;
      }
      
      // If no due date, don't show in this year (already shown in this week)
      return false;
    });

    // Group tasks by category
    const groupTasksByCategory = (taskList: any[]) => {
      const grouped: { [key: string]: any[] } = {};
      taskList.forEach(task => {
        const category = task.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(task);
      });
      return grouped;
    };

    let thisWeekGrouped = groupTasksByCategory(thisWeekTasks);
    let thisMonthGrouped = groupTasksByCategory(thisMonthTasks);
    let thisYearGrouped = groupTasksByCategory(thisYearTasks);

    const renderTaskList = (groupedTasks: { [key: string]: any[] }) => {
      return Object.entries(groupedTasks).map(([category, tasks]) => (
        <View key={category}>
          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>{category}</Text>
          </View>
          <View style={styles.taskItems}>
            {tasks.slice(0, 3).map((task, index) => (
              <View key={task.id || index} style={styles.taskItem}>
                <TouchableOpacity 
                  onPress={() => handleTaskComplete(task.id)}
                  style={styles.taskCheckbox}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={task.status === 'completed' ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={task.status === 'completed' ? colors.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
                <Text style={[
                  styles.taskText, 
                  { 
                    color: task.status === 'completed' ? colors.textSecondary : colors.text,
                    textDecorationLine: task.status === 'completed' ? 'line-through' : 'none'
                  }
                ]}>
                  {task.title}
                </Text>
            </View>
            ))}
            {tasks.length === 0 && (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks due
              </Text>
            )}
          </View>
        </View>
      ));
    };

    return (
      <View style={styles.tasksContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(dashboard)/tasks' as any)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
          </View>
        <View style={styles.tasksColumns}>
          {/* This Week Column */}
          <View style={styles.taskColumn}>
            <Text style={[styles.columnTitle, { color: colors.text }]}>This Week</Text>
            {Object.keys(thisWeekGrouped).length > 0 ? (
              renderTaskList(thisWeekGrouped)
            ) : (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks due this week
              </Text>
            )}
          </View>

          {/* This Month Column */}
          <View style={styles.taskColumn}>
            <Text style={[styles.columnTitle, { color: colors.text }]}>This Month</Text>
            {Object.keys(thisMonthGrouped).length > 0 ? (
              renderTaskList(thisMonthGrouped)
            ) : (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks due this month
              </Text>
            )}
          </View>

          {/* This Year Column */}
          <View style={styles.taskColumn}>
            <Text style={[styles.columnTitle, { color: colors.text }]}>This Year</Text>
            {Object.keys(thisYearGrouped).length > 0 ? (
              renderTaskList(thisYearGrouped)
            ) : (
              <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>
                No tasks due this year
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderQuickLinks()}
        {renderTasks()}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerCenter: {
    width: 100, // Adjust as needed for the empty space
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  quickLinksContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickLinksScroll: {
    paddingRight: 20,
  },
  quickLinkButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    minHeight: 80,
  },
  quickLinkText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tasksContainer: {
    marginBottom: 30,
  },
  tasksColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  taskColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskCategory: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItems: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  taskText: {
    marginLeft: 8,
    fontSize: 14,
  },
  noTasksText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
}); 