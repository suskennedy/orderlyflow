import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useCalendar } from '../../lib/hooks/useCalendar';
import { useHomes } from '../../lib/hooks/useHomes';
import { useProjects } from '../../lib/hooks/useProjects';
import { useRepairs } from '../../lib/hooks/useRepairs';
import { useTasks } from '../../lib/hooks/useTasks';
import { useVendors } from '../../lib/hooks/useVendors';
import { routes } from '../../lib/navigation';
import TaskCompletionModal from '../ui/TaskCompletionModal';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { homes } = useHomes();
  const { allHomeTasks, completeHomeTask, fetchAllHomeTasks } = useTasks();
  const { repairs, fetchRepairs } = useRepairs();
  const { projects, fetchProjects } = useProjects();
  const { onRefresh: eventsRefresh } = useCalendar();
  const { onRefresh: vendorsRefresh } = useVendors();
  const [refreshing, setRefreshing] = useState(false);
  const [tasksToShow, setTasksToShow] = useState<3 | 5>(3);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<any>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Use allHomeTasks to show tasks from all homes - ensure it's always an array
  const allTasks = Array.isArray(allHomeTasks) ? allHomeTasks : [];
  const homesArray = Array.isArray(homes) ? homes : [];
 
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchAllHomeTasks().catch(console.error),
      // Fetch repairs and projects for all homes
      ...homesArray.map(home => fetchRepairs(home.id).catch(console.error)),
      ...homesArray.map(home => fetchProjects(home.id).catch(console.error)),
      eventsRefresh?.() || Promise.resolve(),
      vendorsRefresh?.() || Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const handleTaskUncomplete = useCallback(async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await completeHomeTask(taskId, {
        status: 'pending',
        completed_by_type: null,
        completed_at: null,
        completion_verification_status: null,
        completion_notes: null,
        last_completed: null,
        completion_date: null
      });
    } catch (error) {
      console.error('Error uncompleting task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  }, [completeHomeTask]);

  const handleTaskClick = useCallback((task: any) => {
    if (task.status === 'completed') {
      // If already completed, uncomplete it
      handleTaskUncomplete(task.id);
    } else {
      // If not completed, show completion modal
      setSelectedTaskForCompletion(task);
      setCompletionModalVisible(true);
    }
  }, [handleTaskUncomplete]);

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
        completion_notes: completionData.notes || 'Completed from home screen',
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

      await completeHomeTask(selectedTaskForCompletion.id, completionPayload);
      
      // Close modal and reset state
      setCompletionModalVisible(false);
      setSelectedTaskForCompletion(null);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  }, [completeHomeTask, selectedTaskForCompletion]);

  const handleCancelCompletion = useCallback(() => {
    setCompletionModalVisible(false);
    setSelectedTaskForCompletion(null);
  }, []);

  // Helper function to get the start and end of current week
  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  // Helper function to get the start and end of current month
  const getCurrentMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return { startOfMonth, endOfMonth };
  };

  // Helper function to get the start and end of current year
  const getCurrentYearRange = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    return { startOfYear, endOfYear };
  };

  // Helper function to check if a date is within a range
  const isDateInRange = (date: Date, start: Date, end: Date) => {
    return date >= start && date <= end;
  };

  // Helper function to get task due date
  const getTaskDueDate = (task: any) => {
    return task.next_due || task.due_date;
  };

  // Filter tasks, repairs, and projects based on current date and time - memoized to prevent re-renders
  const filterTasksByTimePeriod = React.useMemo((): { thisWeekTasks: any[], thisMonthTasks: any[], thisYearTasks: any[] } => {
    const now = new Date();
    const { startOfWeek, endOfWeek } = getCurrentWeekRange();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const { startOfYear, endOfYear } = getCurrentYearRange();

    console.log('Date ranges:', {
      now: now.toISOString(),
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      monthStart: startOfMonth.toISOString(),
      monthEnd: endOfMonth.toISOString(),
      yearStart: startOfYear.toISOString(),
      yearEnd: endOfYear.toISOString()
    });

    const userTasks = Array.isArray(allTasks) ? allTasks.filter(task => 
      task.is_active === true // Only show active home tasks
    ) : [];

    // Convert repairs to task-like format for filtering
    const repairTasks = Array.isArray(repairs) ? repairs.map(repair => ({
      ...repair,
      title: `🔧 ${repair.title}`,
        due_date: repair.reminder_date || null,
      status: repair.status === 'complete' ? 'completed' : 'pending',
    })) : [];

    // Filter tasks for this week
    const thisWeekTasks = [...userTasks, ...repairTasks].filter(task => {
      if (task.status === 'completed') return false; // Already filtered for active tasks
      
      const dueDate = getTaskDueDate(task);
      if (!dueDate) return false;
      
      const taskDueDate = new Date(dueDate);
      
      // Must be in this week
      return isDateInRange(taskDueDate, startOfWeek, endOfWeek);
    });

    // Filter tasks for this month (excluding this week)
    const thisMonthTasks = userTasks.filter(task => {
      if (task.status === 'completed') return false; // Already filtered for active tasks
      
      const dueDate = getTaskDueDate(task);
      if (!dueDate) return false;
      
      const taskDueDate = new Date(dueDate);
      
      // Must be in this month but not in this week
      return isDateInRange(taskDueDate, startOfMonth, endOfMonth) && 
             !isDateInRange(taskDueDate, startOfWeek, endOfWeek);
    });

    // Filter items for this year (excluding this week and this month)
    const thisYearTasks = [...userTasks, ...repairTasks].filter(task => {
      if (task.status === 'completed') return false; // Already filtered for active tasks
      
      const dueDate = getTaskDueDate(task);
      if (!dueDate) return false;
      
      const taskDueDate = new Date(dueDate);
      
      // Must be in this year but not in this week or this month
      return isDateInRange(taskDueDate, startOfYear, endOfYear) && 
             !isDateInRange(taskDueDate, startOfWeek, endOfWeek) &&
             !isDateInRange(taskDueDate, startOfMonth, endOfMonth);
    });

    console.log('Item counts:', {
        total: [...userTasks, ...repairTasks].length,
      thisWeek: Array.isArray(thisWeekTasks) ? thisWeekTasks.length : 0,
      thisMonth: Array.isArray(thisMonthTasks) ? thisMonthTasks.length : 0,
      thisYear: Array.isArray(thisYearTasks) ? thisYearTasks.length : 0
    });

    return { 
      thisWeekTasks: Array.isArray(thisWeekTasks) ? thisWeekTasks : [],
      thisMonthTasks: Array.isArray(thisMonthTasks) ? thisMonthTasks : [],
      thisYearTasks: Array.isArray(thisYearTasks) ? thisYearTasks : []
    };
  }, [allTasks, repairs]);


  const renderTaskList = (tasks: any[]) => {
    return tasks.slice(0, tasksToShow).map((task, index) => {
      // Get home name for the task by matching home_id with homes array
      const homeName = Array.isArray(homes) ? homes.find(home => home.id === task.home_id)?.name || 'Unknown Home' : 'Unknown Home';
      
      return (
        <View key={task.id || index} style={styles.taskItem}>
          <TouchableOpacity 
            onPress={() => handleTaskClick(task)}
            style={[
              styles.taskCheckbox,
              { opacity: completingTaskId === task.id ? 0.6 : 1 }
            ]}
            activeOpacity={0.7}
            disabled={completingTaskId === task.id}
          >
            <Ionicons 
              name={task.status === 'completed' ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color="#7fbbdd" 
            />
          </TouchableOpacity>
          <Text style={[
            styles.taskText, 
            { 
              color: task.status === 'completed' ? colors.textSecondary : colors.text,
              textDecorationLine: task.status === 'completed' ? 'line-through' : 'none'
            }
          ]}>
            {task.title} ({homeName})
          </Text>
        </View>
      );
    });
  };

  const { thisWeekTasks, thisMonthTasks, thisYearTasks } = filterTasksByTimePeriod;
  // Ensure all task arrays are always arrays
  const safeThisWeekTasks = Array.isArray(thisWeekTasks) ? thisWeekTasks : [];
  const safeThisMonthTasks = Array.isArray(thisMonthTasks) ? thisMonthTasks : [];
  const safeThisYearTasks = Array.isArray(thisYearTasks) ? thisYearTasks : [];


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
          onPress={() => router.push(routes.tasks.selector as any)}
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
            if (!Array.isArray(homes) || homes.length === 0) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderQuickLinks()}
        <View style={styles.tasksContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
            <View style={styles.actionsRight}>
              <View style={[styles.countToggle, { borderColor: colors.border }]}> 
                <TouchableOpacity
                  style={[styles.countBtn, tasksToShow === 3 && { backgroundColor: colors.primary }]}
                  onPress={() => setTasksToShow(3 as 3)}
                >
                  <Text style={[styles.countBtnText, { color: tasksToShow === 3 ? colors.background : colors.text }]}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.countBtn, tasksToShow === 5 && { backgroundColor: colors.primary }]}
                  onPress={() => setTasksToShow(5 as 5)}
                >
                  <Text style={[styles.countBtnText, { color: tasksToShow === 5 ? colors.background : colors.text }]}>5</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push('/(dashboard)/tasks' as any)}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.singleColumnContainer}>
            <View style={styles.timeSection}>
              <Text style={[styles.columnTitle, { color: colors.text }]}>This Week</Text>
              {safeThisWeekTasks.length > 0 ? (
                <View style={styles.taskItems}>
                  {renderTaskList(safeThisWeekTasks)}
                </View>
              ) : (
                <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>No tasks due this week</Text>
              )}
            </View>

            <View style={styles.timeSection}>
              <Text style={[styles.columnTitle, { color: colors.text }]}>This Month</Text>
              {safeThisMonthTasks.length > 0 ? (
                <View style={styles.taskItems}>
                  {renderTaskList(safeThisMonthTasks)}
                </View>
              ) : (
                <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>No tasks due this month</Text>
              )}
            </View>

            <View style={styles.timeSection}>
              <Text style={[styles.columnTitle, { color: colors.text }]}>This Year</Text>
              {safeThisYearTasks.length > 0 ? (
                <View style={styles.taskItems}>
                  {renderTaskList(safeThisYearTasks)}
                </View>
              ) : (
                <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>No tasks due this year</Text>
              )}
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
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
  singleColumnContainer: {
    flex: 1,
  },
  timeSection: {
    marginBottom: 24,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  taskItems: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
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
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  countBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countBtnText: {
    fontSize: 12,
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