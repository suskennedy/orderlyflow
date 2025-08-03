import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';
import TaskCompletionModal from '../TaskCompletionModal';
import TaskDetailsDropdown from '../TaskDetailsDropdown';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh, toggleTaskActive, completeTask } = useTasks();
  const { vendors } = useVendors();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Completion modal state
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Task dropdown state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Filter to only show user-created and user-selected tasks
  const userTasks = tasks.filter(task => 
    task.task_type === 'custom' || 
    task.task_type === 'preset' || 
    !task.task_type // Include legacy tasks
  );

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

  const handleTaskPress = (task: any) => {
    // Toggle dropdown instead of navigating
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(task.id);
    }
  };

  const handleToggleTaskActive = async (taskId: string, currentState: boolean) => {
    try {
      await toggleTaskActive(taskId, !currentState);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleCompleteTaskPress = (taskId: string) => {
    setCompletingTaskId(taskId);
    setCompletionModalVisible(true);
  };

  const handleCompleteTask = async (completionData: any) => {
    if (!completingTaskId) return;

    try {
      await completeTask(completingTaskId, completionData);
      
      setCompletionModalVisible(false);
      setCompletingTaskId(null);
      
      Alert.alert('Success', 'Task marked as completed!');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const getAssignedVendor = (task: any) => {
    if (!task.assigned_vendor_id) return null;
    return vendors.find(v => v.id === task.assigned_vendor_id);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (task: any) => {
    if (!task.is_active) return colors.textSecondary;
    if (task.next_due) {
      const dueDate = new Date(task.next_due);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return '#EF4444'; // Overdue - Red
      if (diffDays <= 7) return '#F59E0B'; // Due soon - Orange
      return '#10B981'; // On track - Green
    }
    return colors.textSecondary;
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#EF4444'; // Red
      case 'high': return '#F59E0B'; // Orange
      case 'medium': return '#3B82F6'; // Blue
      case 'low': return '#10B981'; // Green
      default: return '#6B7280'; // Gray
    }
  };

  const getPriorityLabel = (priority: string | null | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Normal';
    }
  };

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
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tasks Yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Select from task templates or create your own to get started
      </Text>
      <TouchableOpacity
        style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(dashboard)/tasks/settings' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.addFirstButtonContent}>
          <Ionicons name="add-circle" size={24} color={colors.background} />
          <Text style={[styles.addFirstButtonText, { color: colors.background }]}>
            Browse Task Templates
            </Text>
        </View>
          </TouchableOpacity>
    </Animated.View>
  );

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => {
    const assignedVendor = getAssignedVendor(item);
    const isExpanded = expandedTaskId === item.id;

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
          style={[styles.taskCard, { backgroundColor: colors.surface }]}
          onPress={() => handleTaskPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.taskContent}>
            <View style={styles.taskInfo}>
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle, 
                  { 
                    color: colors.text,
                    textDecorationLine: item.status === 'completed' ? 'line-through' : 'none',
                    opacity: item.status === 'completed' ? 0.6 : 1
                  }
                ]}>{item.title}</Text>
                <View style={styles.taskHeaderActions}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item) }]} />
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => handleTaskPress(item)}
                  >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
                {item.category} • {item.subcategory}
              </Text>
              {item.next_due && (
                <Text style={[styles.taskDue, { color: colors.textSecondary }]}>
                  Due: {formatDate(item.next_due)}
                </Text>
              )}
              {item.status === 'completed' && (
                <View style={[styles.completionIndicator, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={[styles.completionIndicatorText, { color: colors.primary }]}>
                    Completed {item.completed_at ? formatDate(item.completed_at) : ''}
                    {item.completed_by_type === 'vendor' && item.completed_by_vendor_id && 
                     ` by ${vendors.find(v => v.id === item.completed_by_vendor_id)?.name || 'Vendor'}`}
                    {item.completed_by_type === 'external' && item.completed_by_external_name && 
                     ` by ${item.completed_by_external_name}`}
                  </Text>
                </View>
              )}
              <View style={styles.taskMetaRow}>
                {item.priority && (
                  <View style={[
                    styles.priorityBadge, 
                    { backgroundColor: getPriorityColor(item.priority) + '20' }
                  ]}>
                    <View style={[
                      styles.priorityDot, 
                      { backgroundColor: getPriorityColor(item.priority) }
                    ]} />
                    <Text style={[
                      styles.priorityText, 
                      { color: getPriorityColor(item.priority) }
                    ]}>
                      {getPriorityLabel(item.priority)}
                    </Text>
                  </View>
                )}
                {assignedVendor && (
                  <View style={[styles.vendorBadge, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={10} color={colors.primary} />
                    <Text style={[styles.vendorText, { color: colors.primary }]}>
                      {assignedVendor.name}
                    </Text>
                  </View>
                )}
                {item.task_type === 'preset' && (
                  <View style={[styles.presetBadge, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="library" size={10} color={colors.primary} />
                    <Text style={[styles.presetText, { color: colors.primary }]}>Template</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.taskActions}>
              <TouchableOpacity 
                style={[
                  styles.toggleSwitch, 
                  { 
                    backgroundColor: item.is_active ? colors.primary : '#E5E7EB',
                    borderColor: item.is_active ? colors.primary : '#D1D5DB'
                  }
                ]}
                onPress={() => handleToggleTaskActive(item.id, item.is_active)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.toggleKnob, 
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: item.is_active ? 22 : 2 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3
                  }
                ]} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.completeButton, 
                  { 
                    backgroundColor: item.status === 'completed' ? colors.primary : colors.primaryLight,
                    opacity: item.status === 'completed' ? 0.6 : 1
                  }
                ]}
                onPress={() => handleCompleteTaskPress(item.id)}
                disabled={item.status === 'completed'}
              >
                <Ionicons 
                  name={item.status === 'completed' ? "checkmark-circle" : "ellipse-outline"} 
                  size={18} 
                  color={item.status === 'completed' ? colors.background : colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Task Details Dropdown */}
        <TaskDetailsDropdown
          task={item}
          isExpanded={isExpanded}
          assignedVendor={assignedVendor}
          vendors={vendors}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
        />
      </Animated.View>
    );
  };

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
        <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>My Tasks</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Manage your selected and created tasks
                </Text>
              </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {userTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              My Tasks
            </Text>
          </View>
      </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="play-circle" size={20} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {userTasks.filter(t => t.is_active).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Tasks
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
            <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
            >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
            <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/tasks/settings' as any)}
            >
          <Ionicons name="settings" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
      {loading ? (
        <Animated.View 
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your tasks...
            </Text>
        </View>
        </Animated.View>
      ) : (
        <FlatList
          data={userTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list, 
            { paddingBottom: insets.bottom + 120 }
          ]}
          ListHeaderComponent={userTasks.length > 0 ? renderHeader : null}
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
        />
      )}
      
      <TaskCompletionModal
        visible={completionModalVisible}
        onClose={() => setCompletionModalVisible(false)}
        onComplete={handleCompleteTask}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
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
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  list: {
    paddingHorizontal: 20,
  },
  taskItem: {
    marginBottom: 4,
  },
  taskCard: {
    borderRadius: 16,
    padding: 20,
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
  taskHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  presetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 2,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
    borderWidth: 1,
    position: 'relative',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 16,
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
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 2,
  },
  vendorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  completionIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
  },
});