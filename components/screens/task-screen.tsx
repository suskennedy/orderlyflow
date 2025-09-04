import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import TaskCompletionModal from '../TaskCompletionModal';
import TaskSkeleton from '../ui/TaskSkeleton';
import TaskSpinner from '../ui/TaskSpinner';

interface TasksScreenProps {
  homeId?: string;
}

export default function TasksScreen({ homeId }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const { homeTasks, loading, refreshing, onRefresh, completeTask, setCurrentHome, fetchTasksForHome } = useTasks();
  const { homes } = useHomes();
  const { vendors } = useVendors();
  const { colors } = useTheme();
  
  // Get the current home name
  const currentHome = homeId ? homes.find(home => home.id === homeId) : null;
  
  // Set current home when component mounts
  useEffect(() => {
    if (homeId) {
      setCurrentHome(homeId);
    }
  }, [homeId, setCurrentHome]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // State
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);


  // Active tasks filter - only show truly active tasks
  const activeTasks = useMemo(() => {
    if (!homeId || !homeTasks) return [];
    return homeTasks.filter(ht => 
      ht.home_id === homeId && 
      ht.is_active === true && 
      ht.status !== 'completed' && 
      ht.status !== 'inactive'
    );
  }, [homeId, homeTasks]);

  // Fast completed tasks filter - no unnecessary mapping
  const completedTasks = useMemo(() => {
    if (!homeId || !homeTasks) return [];
    return homeTasks.filter(ht => ht.home_id === homeId && ht.status === 'completed');
  }, [homeId, homeTasks]);

  // Simple combined tasks - fast array combination
  const allTasks = useMemo(() => [...activeTasks, ...completedTasks], [activeTasks, completedTasks]);

  // Fetch tasks when home changes
  useEffect(() => {
    if (homeId) {
      fetchTasksForHome(homeId);
    }
  }, [homeId, fetchTasksForHome]);

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

  // Handle task completion toggle
  const handleTaskToggle = useCallback(async (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      const task = homeTasks.find(ht => ht.id === taskId);
      if (task) {
        setCurrentTask(task);
        setShowCompletionModal(true);
      }
    } else {
      // Mark task as incomplete
      try {
        setSavingTaskId(taskId);
        await completeTask(taskId, { status: 'pending', is_active: true });
        setExpandedTask(null);
      } catch (error) {
        console.error('Error marking task as incomplete:', error);
      } finally {
        setSavingTaskId(null);
      }
    }
  }, [homeTasks, completeTask]);

  // Handle completion from modal
  const handleTaskCompletion = useCallback(async (completionData: any) => {
    if (!currentTask) return;

    try {
      setSavingTaskId(currentTask.id);
      setShowCompletionModal(false);
      
      const completionPayload = {
        ...completionData,
        is_active: false, // Deactivate task when completed
      };

      await completeTask(currentTask.id, completionPayload);
      
      // Close dropdown and clear current task
      setExpandedTask(null);
      setCurrentTask(null);
    } catch (error) {
      console.error('Task completion error:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  }, [currentTask, completeTask]);

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

  // Memoized task item renderer for better performance
  const renderTaskItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isCompleted = item.status === 'completed';
    const isExpanded = expandedTask === item.id;
    const isRecurring = isRecurringTask(item);
    const displayDate = getTaskDisplayDate(item);
    
    return (
      <Animated.View
        style={[
          styles.taskItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.taskCard, 
            { 
              backgroundColor: isCompleted ? '#F5F5F5' : colors.surface,
              opacity: isCompleted ? 0.7 : 1
            }
          ]}
          onPress={() => handleTaskPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.taskContent}>
            <View style={styles.taskInfo}>
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle, 
                  { 
                    color: isCompleted ? colors.textSecondary : colors.text,
                    textDecorationLine: isCompleted ? 'line-through' : 'none'
                  }
                ]}>
                  {item.title}
                </Text>
              </View>
              {item.category && (
                <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
                  {item.category} • {item.home_name || 'No home assigned'}
                </Text>
              )}
              {isCompleted && item.completed_at && (
                <Text style={[styles.completionDate, { color: colors.textSecondary }]}>
                  Completed: {formatDate(item.completed_at)}
                </Text>
              )}
              {isRecurring && !isCompleted && (
                <Text style={[styles.recurrenceInfo, { color: colors.textSecondary }]}>
                  Recurring: {item.recurrence_pattern}
                </Text>
              )}
            </View>
            
            <View style={styles.taskActions}>
              <View style={[
                styles.datePill, 
                { 
                  backgroundColor: isCompleted ? colors.textSecondary : '#1976D2' 
                }
              ]}>
                <Text style={[styles.dateText, { color: '#FFFFFF' }]}>
                  {isCompleted ? formatDate(item.completed_at) : formatDate(displayDate)}
                </Text>
              </View>
              
                <TouchableOpacity
                style={[
                  styles.completeButton, 
                  { 
                    backgroundColor: isCompleted ? colors.success : colors.border,
                    opacity: savingTaskId === item.id ? 0.6 : 1,
                  }
                ]}
                onPress={() => handleTaskToggle(item.id, !isCompleted)}
                disabled={savingTaskId === item.id}
              >
                <Ionicons 
                  name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={isCompleted ? colors.textInverse : colors.text} 
                />
                </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Task Details Dropdown */}
        {isExpanded && (
          <View style={[styles.dropdownContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.dropdownRow}>
              <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Assigned Vendor</Text>
              <Text style={[styles.dropdownValue, { color: colors.text }]}>
                {item.assigned_vendor_id ? vendors.find(v => v.id === item.assigned_vendor_id)?.name : 'Not assigned'}
              </Text>
            </View>
            
            <View style={styles.dropdownRow}>
              <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Due Date</Text>
              <Text style={[styles.dropdownValue, { color: colors.text }]}>
                {formatDate(item.next_due || item.due_date)}
              </Text>
            </View>
            
            {item.notes && (
              <View style={styles.dropdownRow}>
                <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={[styles.dropdownValue, { color: colors.text }]}>
                  {item.notes}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setExpandedTask(null)}
            >
              <Text style={[styles.closeButtonText, { color: colors.textInverse }]}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  }, [expandedTask, savingTaskId, colors, fadeAnim, slideAnim, handleTaskToggle, handleTaskPress, vendors, getTaskDisplayDate, formatDate, isRecurringTask]);

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
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Tasks</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Go to Task Settings to add tasks or activate existing ones
      </Text>
      <TouchableOpacity
        style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push(homeId ? `/(tabs)/(home)/${homeId}/tasks/settings` : '/(tabs)/(tasks)' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.addFirstButtonContent}>
          <Ionicons name="settings" size={24} color={colors.background} />
          <Text style={[styles.addFirstButtonText, { color: colors.background }]}>
            Add/Edit Tasks
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
        <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Active Tasks</Text>
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
            Add/Edit Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/(calendar)' as any)}
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
              {homeId ? 'Tasks' : 'Select Home'}
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
          style={styles.settingsButton}
            onPress={() => router.push(`/(tabs)/(home)/${homeId}/tasks/settings` as any)}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        )}
      </View>
          
      {loading ? (
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
        message="Saving task..." 
        type="saving" 
      />

      {/* Task Completion Modal */}
      <TaskCompletionModal
        visible={showCompletionModal}
        onClose={handleCompletionModalClose}
        onComplete={handleTaskCompletion}
        vendors={vendors}
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dropdownValue: {
    fontSize: 14,
    flex: 2,
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
});