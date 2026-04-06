import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { FONTS } from '../../lib/typography';
import { useAuth } from '../../lib/hooks/useAuth';
import { useCalendar } from '../../lib/hooks/useCalendar';
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { routes } from '../../lib/navigation';
import { useHomesStore } from '../../lib/stores/homesStore';
import { useProjectsStore } from '../../lib/stores/projectsStore';
import { useRepairsStore } from '../../lib/stores/repairsStore';
import { useTasksStore } from '../../lib/stores/tasksStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import TaskCompletionModal from '../ui/TaskCompletionModal';
import TaskSkeleton from '../ui/TaskSkeleton';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const homes = useHomesStore(state => state.homes);
  const allHomeTasks = useTasksStore(state => state.allHomeTasks);
  const completeHomeTask = useTasksStore(state => state.completeHomeTask);
  const fetchAllHomeTasks = useTasksStore(state => state.fetchAllHomeTasks);
  const tasksLoading = useTasksStore(state => state.loading);
  const currentHomeId = useTasksStore(state => state.currentHomeId);
  const setCurrentHomeId = useTasksStore(state => state.setCurrentHomeId);
  const repairsByHome = useRepairsStore(state => state.repairsByHome);
  const fetchRepairs = useRepairsStore(state => state.fetchRepairs);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const fetchHomes = useHomesStore(state => state.fetchHomes);
  const homesLoading = useHomesStore(state => state.loading);

  const loading = tasksLoading || homesLoading;

  // Get all repairs from all homes
  const repairs = useMemo(() => {
    return Object.values(repairsByHome).flat();
  }, [repairsByHome]);
  const { onRefresh: eventsRefresh } = useCalendar();
  const vendorsRefresh = useVendorsStore(state => state.onRefresh);
  const fetchVendors = useVendorsStore(state => state.fetchVendors);
  const setVendors = useVendorsStore(state => state.setVendors);
  const [refreshing, setRefreshing] = useState(false);

  // Initial vendors data fetch
  const hasFetchedVendorsRef = useRef(false);
  useEffect(() => {
    if (user?.id && !hasFetchedVendorsRef.current) {
      hasFetchedVendorsRef.current = true;
      fetchVendors(user.id);
    }
    return () => {
      hasFetchedVendorsRef.current = false;
    };
  }, [user?.id, fetchVendors]);

  // Real-time subscription for vendors
  const handleVendorChange = useCallback((payload: any) => {
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;
      const currentVendors = useVendorsStore.getState().vendors;

      if (eventType === 'INSERT') {
        setVendors([payload.new, ...currentVendors]);
      }
      else if (eventType === 'UPDATE') {
        setVendors(
          currentVendors.map(vendor =>
            vendor.id === payload.new.id ? payload.new : vendor
          )
        );
      }
      else if (eventType === 'DELETE') {
        setVendors(
          currentVendors.filter(vendor => vendor.id !== payload.old.id)
        );
      }
    }
  }, [user?.id, setVendors]);

  useRealTimeSubscription(
    {
      table: 'vendors',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleVendorChange
  );

  // Real-time subscriptions for repairs
  const handleRepairChange = useCallback((payload: any) => {
    const homeId = payload.new?.home_id || payload.old?.home_id;
    if (homeId && user?.id) {
      fetchRepairs(homeId, user.id);
    }
  }, [user?.id, fetchRepairs]);

  useRealTimeSubscription(
    { table: 'repairs', event: '*' },
    handleRepairChange
  );

  // Real-time subscriptions for projects
  const handleProjectChange = useCallback((payload: any) => {
    const homeId = payload.new?.home_id || payload.old?.home_id;
    if (homeId && user?.id) {
      fetchProjects(homeId, user.id);
    }
  }, [user?.id, fetchProjects]);

  useRealTimeSubscription(
    { table: 'projects', event: '*' },
    handleProjectChange
  );

  const [tasksToShow, setTasksToShow] = useState<3 | 5>(3);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState<any>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isHomeModalVisible, setIsHomeModalVisible] = useState(false);

  // Use allHomeTasks to show tasks from all homes - ensure it's always an array
  const allTasks = useMemo(() => Array.isArray(allHomeTasks) ? allHomeTasks : [], [allHomeTasks]);
  const homesArray = useMemo(() => Array.isArray(homes) ? homes : [], [homes]);

  const onRefresh = useCallback(() => {
    if (!user?.id) return;

    setRefreshing(true);
    Promise.all([
      fetchAllHomeTasks(user.id).catch(console.error),
      // Fetch repairs and projects for all homes
      ...homesArray.map(home => fetchRepairs(home.id, user.id).catch(console.error)),
      ...homesArray.map(home => fetchProjects(home.id, user.id).catch(console.error)),
      eventsRefresh?.() || Promise.resolve(),
      vendorsRefresh(user.id).catch(console.error),
      fetchHomes().catch(console.error),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [user?.id, homesArray, fetchAllHomeTasks, fetchRepairs, fetchProjects, eventsRefresh, vendorsRefresh, fetchHomes]);

  // Initial dashboard data fetch
  const hasInitializedRef = useRef(false);
  // Separate guard: fetch homes at most once when user has no homes yet.
  // Without this, fetchHomes() → set({ homes: [] }) → new [] ref → onRefresh recreates
  // → effect re-fires → fetchHomes() again → infinite loop.
  const hasFetchedEmptyRef = useRef(false);
  useEffect(() => {
    if (!user?.id) return;
    if (homesArray.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      onRefresh();
    } else if (homesArray.length === 0 && !homesLoading && !hasFetchedEmptyRef.current) {
      hasFetchedEmptyRef.current = true;
      fetchHomes();
    }
  }, [user?.id, homesArray.length, homesLoading, onRefresh, fetchHomes]);

  const handleTaskUncomplete = useCallback(async (taskId: string) => {
    try {
      setCompletingTaskId(taskId);
      await completeHomeTask(taskId, currentHomeId, {
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
  }, [completeHomeTask, currentHomeId]);

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

      await completeHomeTask(selectedTaskForCompletion.id, currentHomeId, completionPayload);

      // Close modal and reset state
      setCompletionModalVisible(false);
      setSelectedTaskForCompletion(null);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setCompletingTaskId(null);
    }
  }, [completeHomeTask, selectedTaskForCompletion, currentHomeId]);

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

  // Helper function to format date for comparison (midnight)
  const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Filter tasks, repairs, and projects based on urgency and homeId
  const filterTasksByUrgency = React.useMemo((): { overdueTasks: any[], todayTasks: any[], upcomingTasks: any[] } => {
    const now = new Date();
    const today = getStartOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 8); // Covers next 7 days after today

    // Filter all tasks by active and current home (if selected)
    const baseTasks = Array.isArray(allTasks) ? allTasks.filter(task => {
      const isActive = task.is_active !== false;
      const isNotComplete = task.status !== 'completed' && task.status !== 'complete';
      const homeMatch = currentHomeId ? task.home_id === currentHomeId : true;
      return isActive && isNotComplete && homeMatch;
    }) : [];

    const repairTasks = Array.isArray(repairs) ? repairs.filter(repair => {
      const isNotComplete = repair.status !== 'complete';
      const homeMatch = currentHomeId ? repair.home_id === currentHomeId : true;
      return isNotComplete && homeMatch;
    }).map(repair => ({
      ...repair,
      title: `🔧 ${repair.title}`,
      due_date: repair.reminder_date || null,
      status: 'pending',
      item_type: 'repair'
    })) : [];

    const unifiedList = [...baseTasks, ...repairTasks];

    const overdueTasks: any[] = [];
    const todayTasks: any[] = [];
    const upcomingTasks: any[] = [];

    unifiedList.forEach(task => {
      const dueDateStr = getTaskDueDate(task);
      if (!dueDateStr) return;

      const dueDate = new Date(dueDateStr);
      const dueStartOfDay = getStartOfDay(dueDate);

      if (dueStartOfDay < today) {
        overdueTasks.push(task);
      } else if (dueStartOfDay.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else if (dueStartOfDay >= tomorrow && dueStartOfDay < nextWeek) {
        upcomingTasks.push(task);
      }
    });

    // Sort each list by date
    const sortByDate = (a: any, b: any) => {
      const dateA = new Date(getTaskDueDate(a) || '');
      const dateB = new Date(getTaskDueDate(b) || '');
      return dateA.getTime() - dateB.getTime();
    };

    return {
      overdueTasks: overdueTasks.sort(sortByDate),
      todayTasks: todayTasks.sort(sortByDate),
      upcomingTasks: upcomingTasks.sort(sortByDate)
    };
  }, [allTasks, repairs, currentHomeId]);


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
              color={colors.primary}
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

  const { overdueTasks, todayTasks, upcomingTasks } = filterTasksByUrgency;
  const safeOverdueTasks = Array.isArray(overdueTasks) ? overdueTasks : [];
  const safeTodayTasks = Array.isArray(todayTasks) ? todayTasks : [];
  const safeUpcomingTasks = Array.isArray(upcomingTasks) ? upcomingTasks : [];


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
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Vendor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(routes.tasks.selector as any)}
        >
          <Ionicons name="checkbox" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Reminder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => setIsHomeModalVisible(true)}
        >
          <Ionicons name="swap-horizontal" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Switch Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push(routes.tabs.flo as any)}
        >
          <Ionicons name="chatbubble" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Ask Flo</Text>
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
              <TouchableOpacity onPress={() => {
                if (currentHomeId) {
                  router.push(routes.home.tasks(currentHomeId) as any);
                } else {
                  router.push(routes.dashboard.tasks as any);
                }
              }}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
          {loading && !refreshing ? (
            <View style={{ paddingVertical: 10 }}>
              <TaskSkeleton count={3} />
            </View>
          ) : (
            <View style={styles.singleColumnContainer}>
              {currentHomeId && (
                <View style={[styles.currentHomeBanner, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="home" size={16} color={colors.primary} />
                  <Text style={[styles.currentHomeText, { color: colors.primary }]}>
                    {homes.find(h => h.id === currentHomeId)?.name || 'Property'} mode
                  </Text>
                  <TouchableOpacity onPress={() => setCurrentHomeId(null)}>
                    <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.timeSection}>
                <View style={styles.columnTitleRow}>
                  <Text style={[styles.columnTitle, { color: colors.text }]}>Overdue</Text>
                  {safeOverdueTasks.length > 0 && <View style={[styles.urgencyDot, { backgroundColor: colors.error }]} />}
                </View>
                {safeOverdueTasks.length > 0 ? (
                  <View style={styles.taskItems}>
                    {renderTaskList(safeOverdueTasks)}
                  </View>
                ) : (
                  <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>Great job! Nothing overdue.</Text>
                )}
              </View>

              <View style={styles.timeSection}>
                <Text style={[styles.columnTitle, { color: colors.text }]}>Today</Text>
                {safeTodayTasks.length > 0 ? (
                  <View style={styles.taskItems}>
                    {renderTaskList(safeTodayTasks)}
                  </View>
                ) : (
                  <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>Clear for today!</Text>
                )}
              </View>

              <View style={styles.timeSection}>
                <Text style={[styles.columnTitle, { color: colors.text }]}>Upcoming (Next 7 Days)</Text>
                {safeUpcomingTasks.length > 0 ? (
                  <View style={styles.taskItems}>
                    {renderTaskList(safeUpcomingTasks)}
                  </View>
                ) : (
                  <Text style={[styles.noTasksText, { color: colors.textSecondary }]}>No upcoming tasks this week.</Text>
                )}
              </View>
            </View>
          )}
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

      {/* Switch Home Modal */}
      <Modal
        visible={isHomeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHomeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Property</Text>
              <TouchableOpacity onPress={() => setIsHomeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.homeSelectItem, !currentHomeId && { backgroundColor: colors.primary + '20' }]}
              onPress={() => {
                setCurrentHomeId(null);
                setIsHomeModalVisible(false);
              }}
            >
              <Ionicons name="apps" size={20} color={!currentHomeId ? colors.primary : colors.textSecondary} />
              <Text style={[styles.homeSelectName, { color: !currentHomeId ? colors.primary : colors.text }]}>
                All Properties
              </Text>
            </TouchableOpacity>

            {homes.map(home => (
              <TouchableOpacity
                key={home.id}
                style={[styles.homeSelectItem, currentHomeId === home.id && { backgroundColor: colors.primary + '20' }]}
                onPress={() => {
                  setCurrentHomeId(home.id);
                  setIsHomeModalVisible(false);
                }}
              >
                <Ionicons name="home" size={20} color={currentHomeId === home.id ? colors.primary : colors.textSecondary} />
                <Text style={[styles.homeSelectName, { color: currentHomeId === home.id ? colors.primary : colors.text }]}>
                  {home.name}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 20 }} />
          </View>
        </View>
      </Modal>
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
    fontFamily: FONTS.heading,
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
    fontFamily: FONTS.heading,
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
    fontFamily: FONTS.bodySemiBold,
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryHeading: {
    fontFamily: FONTS.bodySemiBold,
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
    fontFamily: FONTS.body,
    marginLeft: 8,
    fontSize: 14,
  },
  noTasksText: {
    fontFamily: FONTS.body,
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
    fontFamily: FONTS.bodySemiBold,
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
    fontFamily: FONTS.bodySemiBold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: 'bold',
  },
  homeSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  homeSelectName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  currentHomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  currentHomeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});