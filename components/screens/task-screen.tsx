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

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh, completeTask } = useTasks();
  const { vendors } = useVendors();
  const { colors } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // State for expanded task dropdowns
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Filter tasks: active tasks first, then completed tasks
  const activeTasks = tasks
    .filter(task => 
      task.is_active && task.status !== 'completed' && (
        task.task_type === 'custom' || 
        task.task_type === 'preset' || 
        !task.task_type
      )
    )
    .sort((a, b) => {
      const dateA = a.next_due || a.due_date;
      const dateB = b.next_due || b.due_date;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  const completedTasks = tasks
    .filter(task => 
      task.is_active && task.status === 'completed' && (
        task.task_type === 'custom' || 
        task.task_type === 'preset' || 
        !task.task_type
      )
    )
    .sort((a, b) => {
      const dateA = a.completed_at;
      const dateB = b.completed_at;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateB).getTime() - new Date(dateA).getTime(); // Most recent first
    });

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
    // Toggle dropdown for task
    setExpandedTask(expandedTask === task.id ? null : task.id);
  };

  const handleCompleteTask = async (task: any) => {
    try {
      await completeTask(task.id, {
        completed_by_type: 'user',
        completed_at: new Date().toISOString(),
        completion_verification_status: 'verified',
        completion_notes: 'Completed from tasks screen'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAssignedVendor = (task: any) => {
    if (!task.assigned_vendor_id) return null;
    return vendors.find(v => v.id === task.assigned_vendor_id);
  };

  const renderTaskDropdown = (task: any) => {
    const assignedVendor = getAssignedVendor(task);
    
    return (
      <View style={[styles.dropdownContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Assigned Vendor</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {assignedVendor ? assignedVendor.name : 'Not assigned'}
          </Text>
        </View>
        
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Last Completed</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {task.last_completed ? formatDate(task.last_completed) : 'Never'}
          </Text>
        </View>
        
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Next Due</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {formatDate(task.next_due || task.due_date)}
          </Text>
        </View>
        
        <View style={styles.dropdownRow}>
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>Frequency</Text>
          <Text style={[styles.dropdownValue, { color: colors.text }]}>
            {task.recurrence_pattern ? `Every ${task.recurrence_pattern}` : 'One-time'}
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
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={() => setExpandedTask(null)}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>Close</Text>
        </TouchableOpacity>
      </View>
    );
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
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Tasks</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Go to Task Settings to add tasks or activate existing ones
      </Text>
      <TouchableOpacity
        style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
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

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => {
    const isCompleted = item.status === 'completed';
    const isExpanded = expandedTask === item.id;
    
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
            </View>
            
            <View style={styles.taskActions}>
              <View style={[
                styles.datePill, 
                { 
                  backgroundColor: isCompleted ? colors.textSecondary : '#1976D2' 
                }
              ]}>
                <Text style={[styles.dateText, { color: '#FFFFFF' }]}>
                  {item.next_due ? formatDate(item.next_due) : formatDate(item.due_date)}
                </Text>
              </View>
              
              {!isCompleted && (
                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleCompleteTask(item)}
                >
                  <Ionicons name="checkmark" size={20} color={colors.background} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Dropdown Details */}
        {isExpanded && renderTaskDropdown(item)}
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
        <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>Active Tasks</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {activeTasks.length} active • {completedTasks.length} completed
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
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

  const allTasks = [...activeTasks, ...completedTasks];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
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
  headerTitle: {
    fontSize: 24,
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
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
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
});