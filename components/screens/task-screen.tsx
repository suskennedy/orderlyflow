import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import TaskSkeleton from '../ui/TaskSkeleton';
import TaskSpinner from '../ui/TaskSpinner';

interface TasksScreenProps {
  homeId?: string;
}

export default function TasksScreen({ homeId }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh, completeTask } = useTasks();
  const { homes } = useHomes();
  const { vendors } = useVendors();
  const { colors } = useTheme();
  
  // Get the current home name
  const currentHome = homeId ? homes.find(home => home.id === homeId) : null;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // State for expanded task dropdowns and task operations
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [taskCompletionData, setTaskCompletionData] = useState<{[key: string]: {
    notes: string;
    completedBy: 'user' | 'vendor' | 'external';
    externalName?: string;
    vendorId?: string;
  }}>({});

  // Memoized filtered and sorted tasks for performance
  const activeTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const isActive = task.is_active && task.status !== 'completed' && task.status !== 'template';
        const isValidType = task.task_type === 'custom' || task.task_type === 'preset' || !task.task_type;
        const isHomeMatch = !homeId || task.home_id === homeId;
        return isActive && isValidType && isHomeMatch;
      })
      .sort((a, b) => {
        const dateA = a.next_due || a.due_date;
        const dateB = b.next_due || b.due_date;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }, [tasks, homeId]);

  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => 
        task.status === 'completed' && (
          task.task_type === 'custom' || 
          task.task_type === 'preset' || 
          !task.task_type
        ) && (!homeId || task.home_id === homeId)
      )
      .sort((a, b) => {
        const dateA = a.completed_at;
        const dateB = b.completed_at;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // Most recent first
      });
  }, [tasks, homeId]);

  // Debug logging
  useEffect(() => {
    console.log('TasksScreen: Task counts:', {
      total: tasks.length,
      active: activeTasks.length,
      completed: completedTasks.length,
      recurring: tasks.filter(t => t.is_recurring && t.recurrence_pattern).length
    });
    
    // Log recurring tasks specifically
    const recurringTasks = tasks.filter(t => t.is_recurring && t.recurrence_pattern);
    if (recurringTasks.length > 0) {
      console.log('Recurring tasks:', recurringTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        is_active: t.is_active,
        due_date: t.due_date,
        next_due: t.next_due,
        recurrence_pattern: t.recurrence_pattern
      })));
    }

    // Log active tasks to see what's being shown
    console.log('Active tasks:', activeTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      is_active: t.is_active,
      due_date: t.due_date,
      next_due: t.next_due,
      is_recurring: t.is_recurring,
      recurrence_pattern: t.recurrence_pattern
    })));
  }, [tasks, activeTasks, completedTasks]);

  // Helper function to get the display date for a task
  const getTaskDisplayDate = (task: any) => {
    if (task.status === 'completed') {
      return task.completed_at;
    }
    return task.next_due || task.due_date;
  };

  // Helper function to check if a task is recurring
  const isRecurringTask = (task: any) => {
    return task.is_recurring && task.recurrence_pattern;
  };

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

  // Handle task toggle - expand dropdown on completion
  const handleTaskToggle = useCallback(async (taskId: string, isCompleting: boolean) => {
    if (isCompleting) {
      // Expand dropdown for completion details
      setExpandedTask(taskId);
      // Initialize completion data if not exists
      if (!taskCompletionData[taskId]) {
        setTaskCompletionData(prev => ({
          ...prev,
          [taskId]: {
            notes: '',
            completedBy: 'user',
          }
        }));
      }
    } else {
      // Uncomplete task immediately
      try {
        setSavingTaskId(taskId);
        await completeTask(taskId, {
          status: 'pending',
          completed_by_type: null,
          completed_at: null,
          completion_verification_status: null,
          completion_notes: null,
          is_active: true, // Reactivate task when uncompleted
        });
      } catch (error) {
        console.error('Task uncompletion error:', error);
        Alert.alert('Error', 'Failed to uncomplete task. Please try again.');
      } finally {
        setSavingTaskId(null);
      }
    }
  }, [completeTask, taskCompletionData]);

  // Save task completion with details
  const saveTaskCompletion = useCallback(async (taskId: string) => {
    const completionData = taskCompletionData[taskId];
    if (!completionData) return;

    try {
      setSavingTaskId(taskId);
      
      const completionPayload: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_verification_status: 'verified',
        completion_notes: completionData.notes || null,
        completed_by_type: completionData.completedBy,
        is_active: false, // Deactivate task when completed
      };

      // Add specific completion details based on who completed it
      if (completionData.completedBy === 'vendor' && completionData.vendorId) {
        completionPayload.completed_by_vendor_id = completionData.vendorId;
      } else if (completionData.completedBy === 'external' && completionData.externalName) {
        completionPayload.completed_by_external_name = completionData.externalName;
      } else {
        completionPayload.completed_by_user_id = null; // Will be set by backend
      }

      await completeTask(taskId, completionPayload);
      
      // Close dropdown and clear data
      setExpandedTask(null);
      setTaskCompletionData(prev => {
        const newData = { ...prev };
        delete newData[taskId];
        return newData;
      });
    } catch (error) {
      console.error('Task completion error:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    } finally {
      setSavingTaskId(null);
    }
  }, [completeTask, taskCompletionData]);

  // Update completion data
  const updateCompletionData = useCallback((taskId: string, field: string, value: any) => {
    setTaskCompletionData(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  }, []);

  const handleTaskPress = useCallback((task: any) => {
    // Toggle dropdown for task details only
    setExpandedTask(expandedTask === task.id ? null : task.id);
  }, [expandedTask]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

    const renderTaskDropdown = useCallback((task: any) => {
    const completionData = taskCompletionData[task.id];
    const isSaving = savingTaskId === task.id;
    const assignedVendor = task.assigned_vendor_id ? vendors.find(v => v.id === task.assigned_vendor_id) : null;
    
    // If task is completed, show details
    if (task.status === 'completed') {
      return (
        <Animated.View 
          style={[
            styles.dropdownContainer, 
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }
          ]}
        >
          <Text style={[styles.dropdownTitle, { color: colors.text }]}>
            Task Details
          </Text>
          
          <View style={styles.dropdownRow}>
            <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Completed Date</Text>
            <Text style={[styles.dropdownValue, { color: colors.text }]}>
              {formatDate(task.completed_at)}
            </Text>
          </View>
          
          {task.completion_notes && (
            <View style={styles.dropdownRow}>
              <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Completion Notes</Text>
              <Text style={[styles.dropdownValue, { color: colors.text }]}>
                {task.completion_notes}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={() => setExpandedTask(null)}
          >
            <Text style={[styles.closeButtonText, { color: colors.textInverse }]}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }
    
    // If completion data exists, show completion form
    if (completionData) {
      return (
        <Animated.View 
          style={[
            styles.dropdownContainer, 
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }
          ]}
        >
          <Text style={[styles.dropdownTitle, { color: colors.text }]}>
            Complete Task
          </Text>
          
          {/* Completion Notes */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Completion Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              placeholder="Add any notes about completing this task..."
              placeholderTextColor={colors.textSecondary}
              value={completionData.notes}
              onChangeText={(text) => updateCompletionData(task.id, 'notes', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Who Completed */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Completed By
            </Text>
            <View style={styles.completedByContainer}>
              {['user', 'vendor', 'external'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.completedByOption,
                    {
                      backgroundColor: completionData.completedBy === type 
                        ? colors.primary 
                        : colors.background,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => updateCompletionData(task.id, 'completedBy', type)}
                >
                  <Text style={[
                    styles.completedByText,
                    {
                      color: completionData.completedBy === type 
                        ? colors.textInverse 
                        : colors.text
                    }
                  ]}>
                    {type === 'user' ? 'Me' : type === 'vendor' ? 'Vendor' : 'Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vendor Selection */}
          {completionData.completedBy === 'vendor' && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Select Vendor
              </Text>
              <View style={styles.vendorContainer}>
                {vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.vendorOption,
                      {
                        backgroundColor: completionData.vendorId === vendor.id 
                          ? colors.primary 
                          : colors.background,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => updateCompletionData(task.id, 'vendorId', vendor.id)}
                  >
                    <Text style={[
                      styles.vendorText,
                      {
                        color: completionData.vendorId === vendor.id 
                          ? colors.textInverse 
                          : colors.text
                      }
                    ]}>
                      {vendor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* External Name */}
          {completionData.completedBy === 'external' && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Person/Company Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Enter name..."
                placeholderTextColor={colors.textSecondary}
                value={completionData.externalName || ''}
                onChangeText={(text) => updateCompletionData(task.id, 'externalName', text)}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.dropdownActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => {
                setExpandedTask(null);
                setTaskCompletionData(prev => {
                  const newData = { ...prev };
                  delete newData[task.id];
                  return newData;
                });
              }}
              disabled={isSaving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.success,
                  opacity: isSaving ? 0.6 : 1,
                }
              ]}
              onPress={() => saveTaskCompletion(task.id)}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
                  Complete Task
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }
    
    // Default task details view
    return (
      <View style={[styles.dropdownContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Assigned Vendor</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {assignedVendor ? assignedVendor.name : 'Not assigned'}
          </Text>
        </View>
        
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Due Date</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {formatDate(task.next_due || task.due_date)}
          </Text>
        </View>
        
        {task.notes && (
          <View style={styles.dropdownRow}>
            <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Notes</Text>
            <Text style={[styles.dropdownValue, { color: colors.text }]}>
              {task.notes}
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
    );
  }, [colors, taskCompletionData, savingTaskId, vendors, updateCompletionData, saveTaskCompletion]);

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
        
        {/* Dropdown Details */}
        {isExpanded && renderTaskDropdown(item)}
      </Animated.View>
    );
  }, [expandedTask, savingTaskId, colors, fadeAnim, slideAnim, handleTaskToggle, renderTaskDropdown, handleTaskPress]);

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

  const renderCompletedSection = () => {
    if (completedTasks.length === 0) return null;
    
    return (
      <Animated.View 
        style={[
          styles.completedSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={[styles.completedSectionTitle, { color: colors.textSecondary }]}>
          Completed Tasks ({completedTasks.length})
        </Text>
      </Animated.View>
    );
  };

  const allTasks = useMemo(() => [...activeTasks, ...completedTasks], [activeTasks, completedTasks]);

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
      ) : (
        <FlatList
          data={allTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list, 
            { paddingBottom: insets.bottom + 120 }
          ]}
          ListHeaderComponent={allTasks.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          bounces={true}
          alwaysBounceVertical={false}
          ListFooterComponent={renderCompletedSection}
        />
      )}
      
      {/* Task Spinner */}
      <TaskSpinner 
        visible={!!savingTaskId} 
        message="Saving task..." 
        type="saving" 
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
    marginBottom: 8,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCategory: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    padding: 8,
    borderRadius: 8,
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
  completionDate: {
    fontSize: 12,
    marginTop: 4,
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
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  recurrenceInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  // New dropdown styles
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  completedByContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  completedByOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  completedByText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vendorContainer: {
    gap: 8,
  },
  vendorOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  vendorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});