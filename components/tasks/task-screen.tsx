import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useHomesStore } from '../../lib/stores/homesStore';
import { useProjectsStore } from '../../lib/stores/projectsStore';
import { useRepairsStore } from '../../lib/stores/repairsStore';
import { useTasksStore } from '../../lib/stores/tasksStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import TaskCompletionModal from '../TaskCompletionModal';
import TaskSkeleton from '../ui/TaskSkeleton';
import TaskSpinner from '../ui/TaskSpinner';
import TaskListItem from './list/TaskListItem';


const EMPTY_ARRAY: any[] = [];
interface TasksScreenProps {
  homeId?: string;
}

export default function TasksScreen({ homeId }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const homeTasksByHome = useTasksStore(state => state.homeTasksByHome);
  const currentHomeId = useTasksStore(state => state.currentHomeId);
  const loading = useTasksStore(state => state.loading);
  const setCurrentHomeId = useTasksStore(state => state.setCurrentHomeId);
  const fetchHomeTasks = useTasksStore(state => state.fetchHomeTasks);
  const completeHomeTask = useTasksStore(state => state.completeHomeTask);
  const homeTasks = currentHomeId ? (homeTasksByHome[currentHomeId] || EMPTY_ARRAY) : [];
  const homes = useHomesStore(state => state.homes);
  const vendors = useVendorsStore(state => state.vendors);
  const { colors } = useTheme();
  const { user } = useAuth();

  // Custom Repairs and Projects
  const repairsByHome = useRepairsStore(state => state.repairsByHome);
  const fetchRepairs = useRepairsStore(state => state.fetchRepairs);
  const updateRepair = useRepairsStore(state => state.updateRepair);
  const projectsByHome = useProjectsStore(state => state.projectsByHome);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const updateProject = useProjectsStore(state => state.updateProject);

  const repairs = homeId ? (repairsByHome[homeId] || EMPTY_ARRAY) : [];
  const projects = homeId ? (projectsByHome[homeId] || EMPTY_ARRAY) : [];

  // Get the current home name
  const currentHome = homeId ? homes.find(home => home.id === homeId) : null;

  // Set current home when component mounts - use ref to prevent loops
  const lastHomeIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      setCurrentHomeId(homeId);
      fetchHomeTasks(homeId);

      if (user?.id) {
        fetchRepairs(homeId, user.id);
        fetchProjects(homeId, user.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]); // Only depend on homeId - functions are stable

  // Add timeout to prevent stuck loading state
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('TaskScreen: Loading timeout - forcing loading to false');
        // This will be handled by the context, but we can add a fallback here if needed
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // State
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isHomeModalVisible, setIsHomeModalVisible] = useState(false);


  // Unified active tasks
  const activeTasks = useMemo(() => {
    if (!homeId) return [];

    const tasks = (homeTasks as any[]).filter(ht =>
      ht.home_id === homeId &&
      ht.is_active === true &&
      ht.status !== 'completed' &&
      ht.status !== 'inactive'
    ).map(t => ({ ...t, item_type: 'task' }));

    const activeRepairs = (repairs as any[]).filter(r =>
      (r.is_active !== false) && r.status !== 'complete' && r.status !== 'cancelled'
    ).map(r => ({ ...r, item_type: 'repair', due_date: r.reminder_date }));

    const activeProjects = (projects as any[]).filter(p =>
      (p.is_active !== false) && p.status !== 'completed' && p.status !== 'on_hold'
    ).map(p => ({ ...p, item_type: 'project', due_date: p.start_date }));

    return [...tasks, ...activeRepairs, ...activeProjects].sort((a, b) => {
      const dateA = (a as any).next_due || (a as any).due_date;
      const dateB = (b as any).next_due || (b as any).due_date;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [homeId, homeTasks, repairs, projects]);

  // Unified completed tasks
  const completedTasks = useMemo(() => {
    if (!homeId) return [];

    const tasks = (homeTasks as any[]).filter(ht => ht.home_id === homeId && ht.status === 'completed')
      .map(t => ({ ...t, item_type: 'task' }));

    const completedRepairs = (repairs as any[]).filter(r => r.status === 'complete')
      .map(r => ({ ...r, item_type: 'repair', completed_at: r.updated_at }));

    const completedProjects = (projects as any[]).filter(p => p.status === 'completed')
      .map(p => ({ ...p, item_type: 'project', completed_at: p.updated_at }));

    return [...tasks, ...completedRepairs, ...completedProjects].sort((a, b) => {
      const dateA = (a as any).completed_at;
      const dateB = (b as any).completed_at;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [homeId, homeTasks, repairs, projects]);

  // Combined list for display
  const allTasks = useMemo(() => {
    const list: any[] = [...activeTasks];
    if (completedTasks.length > 0) {
      list.push({ id: 'completed-header', isHeader: true, title: 'Completed' });
      list.push(...completedTasks);
    }
    return list;
  }, [activeTasks, completedTasks]);

  // Tasks are automatically fetched when setCurrentHome is called

  // Helper function to get the display date for a task
  const getTaskDisplayDate = useCallback((task: any) => {
    return task.next_due || task.due_date || task.completed_at;
  }, []);

  // Helper function to check if a task is recurring
  const isRecurringTask = useCallback((task: any) => {
    return task.is_recurring || task.recurrence_pattern;
  }, []);

  // Helper function to format dates
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Handle task press to show details
  const handleTaskPress = useCallback((task: any) => {
    setExpandedTask(expandedTask === task.id ? null : task.id);
  }, [expandedTask]);

  // Resolve actual DB id for repairs/projects (task-screen uses prefixed ids like repair_xxx, project_xxx)
  const getTaskDbId = useCallback((task: any) => {
    if ((task as any).original_id) return (task as any).original_id;
    if (task.id?.startsWith('repair_')) return task.id.replace(/^repair_/, '');
    if (task.id?.startsWith('project_')) return task.id.replace(/^project_/, '');
    return task.id;
  }, []);

  // Handle task completion toggle
  const handleTaskToggle = useCallback(async (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        setCurrentTask(task);
        setShowCompletionModal(true);
      }
    } else {
      // Mark as incomplete
      try {
        setSavingTaskId(taskId);
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.item_type === 'task') {
          await completeHomeTask(taskId, currentHomeId || '', { status: 'pending', is_active: true });
        } else if (task.item_type === 'repair' && currentHomeId) {
          await updateRepair(currentHomeId, getTaskDbId(task), { status: 'to_do' });
          if (user?.id) fetchRepairs(currentHomeId, user.id);
        } else if (task.item_type === 'project' && currentHomeId) {
          await updateProject(currentHomeId, getTaskDbId(task), { status: 'in_progress' });
          if (user?.id) fetchProjects(currentHomeId, user.id);
        }
        setExpandedTask(null);
      } catch (error) {
        console.error('Error marking as incomplete:', error);
      } finally {
        setSavingTaskId(null);
      }
    }
  }, [allTasks, completeHomeTask, updateRepair, updateProject, currentHomeId, getTaskDbId, user?.id, fetchRepairs, fetchProjects]);

  // Handle completion from modal
  const handleTaskCompletion = useCallback(async (completionData: any) => {
    if (!currentTask) return;

    try {
      setSavingTaskId(currentTask.id);
      setShowCompletionModal(false);

      if (currentTask.item_type === 'task') {
        const completionPayload = {
          ...completionData,
          is_active: false, // Deactivate task when completed
        };
        await completeHomeTask(currentTask.id, currentHomeId || '', completionPayload);
      } else if (currentTask.item_type === 'repair' && currentHomeId) {
        const repairId = getTaskDbId(currentTask);
        await updateRepair(currentHomeId, repairId, {
          status: 'complete',
          final_cost: completionData.final_cost,
          notes: completionData.notes ? `${currentTask.notes || ''}\n\nCompletion Notes: ${completionData.notes}` : currentTask.notes
        });
        if (user?.id) fetchRepairs(currentHomeId, user.id);
      } else if (currentTask.item_type === 'project' && currentHomeId) {
        const projectId = getTaskDbId(currentTask);
        await updateProject(currentHomeId, projectId, {
          status: 'completed',
          final_cost: completionData.final_cost,
          notes: completionData.notes ? `${currentTask.notes || ''}\n\nCompletion Notes: ${completionData.notes}` : currentTask.notes
        });
        if (user?.id) fetchProjects(currentHomeId, user.id);
      }

      // Close dropdown and clear current task
      setExpandedTask(null);
      setCurrentTask(null);
    } catch (error) {
      console.error('Task completion error:', error);
      Alert.alert('Error', 'Failed to complete item. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  }, [currentTask, completeHomeTask, updateRepair, updateProject, currentHomeId, getTaskDbId, user?.id, fetchRepairs, fetchProjects]);

  // Handle modal close
  const handleCompletionModalClose = useCallback(() => {
    setShowCompletionModal(false);
    setCurrentTask(null);
  }, []);



  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim, scaleAnim]);

  // Helper function to get task type icon and color
  const getTaskTypeInfo = useCallback((item: any) => {
    if (item.item_type === 'repair') {
      return { icon: 'construct', color: '#FF6B35', label: 'Repair' };
    } else if (item.item_type === 'project') {
      return { icon: 'hammer', color: '#4ECDC4', label: 'Project' };
    } else {
      return { icon: 'checkmark-circle', color: colors.primary, label: 'Reminder' };
    }
  }, [colors.primary]);

  // Memoized task item renderer for better performance
  const renderTaskItem = useCallback(({ item }: { item: any }) => {
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {item.title}
          </Text>
        </View>
      );
    }

    return (
      <TaskListItem
        item={item}
        isExpanded={expandedTask === item.id}
        isCompleted={item.status === 'completed' || item.status === 'complete'}
        savingTaskId={savingTaskId}
        colors={colors}
        homes={homes}
        vendors={vendors}
        onPress={() => handleTaskPress(item)}
        onToggle={() => handleTaskToggle(item.id, item.status !== 'completed' && item.status !== 'complete')}
        onClose={() => setExpandedTask(null)}
        formatDate={formatDate}
      />
    );
  }, [expandedTask, savingTaskId, colors, homes, vendors, handleTaskPress, handleTaskToggle, formatDate]);

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.emptyIconInner, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark-circle" size={32} color={colors.background} />
        </View>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Reminders</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Go to Settings to add reminders or activate existing ones
      </Text>
      <TouchableOpacity
        style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push(homeId ? `/(tabs)/(home)/${homeId}/tasks/settings` : '/(tabs)/(tasks)' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.addFirstButtonContent}>
          <Ionicons name="settings" size={24} color={colors.background} />
          <Text style={[styles.addFirstButtonText, { color: colors.background }]}>
            Add/Edit Reminders
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Active Reminders</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {activeTasks.length} active • {completedTasks.length} completed
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(homeId ? `/(tabs)/(home)/${homeId}/tasks/settings` : '/(tabs)/(tasks)' as any)}
        >
          <Ionicons name="settings" size={20} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>
            Add/Edit Reminders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push(`/(tabs)/(home)/${homeId}/calendar` as any)}
        >
          <Ionicons name="calendar" size={20} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>
            Calendar View
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );



  // REMOVED: Console logging that slowed down rendering

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        paddingTop: insets.top + 20
      }]}>
        <View style={styles.headerLeft}>
          {homeId && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {homeId ? 'Reminders' : 'Select Home'}
            </Text>
            {currentHome && (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {currentHome.name}
              </Text>
            )}
          </View>
        </View>

        {homeId && (
          <TouchableOpacity
            style={[styles.switchHomeButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => setIsHomeModalVisible(true)}
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            <Text style={[styles.switchHomeText, { color: colors.primary }]}>Switch</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && homeId ? (
        <TaskSkeleton count={5} />
      ) : allTasks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={allTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => homeId && fetchHomeTasks(homeId)} />
          }
          ListHeaderComponent={renderHeader}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          getItemLayout={(data, index) => ({
            length: 120, // Fixed height for each task item
            offset: 120 * index,
            index,
          })}
          extraData={expandedTask || savingTaskId} // Only re-render when these change
          ListEmptyComponent={null} // Empty state handled outside FlatList
        />
      )}

      {/* Task Spinner */}
      <TaskSpinner
        visible={!!savingTaskId}
        message="Saving reminder..."
        type="saving"
      />

      {/* Task Completion Modal */}
      <TaskCompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionModalClose}
        onComplete={handleTaskCompletion}
        vendors={vendors}
      />

      {/* Switch Home Modal */}
      <Modal
        visible={isHomeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHomeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsHomeModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderInner}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Property</Text>
              <TouchableOpacity onPress={() => setIsHomeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {homes.map(home => (
              <TouchableOpacity
                key={home.id}
                style={[styles.homeSelectItem, homeId === home.id && { backgroundColor: colors.primary + '20' }]}
                onPress={() => {
                  setIsHomeModalVisible(false);
                  router.replace(`/(tabs)/(home)/${home.id}/tasks` as any);
                }}
              >
                <Ionicons name="home" size={20} color={homeId === home.id ? colors.primary : colors.textSecondary} />
                <Text style={[styles.homeSelectName, { color: homeId === home.id ? colors.primary : colors.text }]}>
                  {home.name}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 20 }} />
          </View>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitleContainer: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    paddingHorizontal: 20,
  },
  taskItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskHeader: {
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 'auto',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  taskCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  completionDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  recurrenceInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  addFirstButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  addFirstButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 10,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  completedSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dropdownContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  dropdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownValue: {
    fontSize: 14,
    flex: 1.5,
    textAlign: 'right',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskList: {
    paddingBottom: 120, // Add padding for the spinner at the bottom
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  switchHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  switchHomeText: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  modalHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});