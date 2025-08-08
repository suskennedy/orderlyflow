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

  // View mode state
  const [viewMode, setViewMode] = useState<'tasks' | 'calendar'>('tasks');

  // Filter to only show user-created and user-selected tasks, sorted by due date
  const userTasks = tasks
    .filter(task => 
      task.task_type === 'custom' || 
      task.task_type === 'preset' || 
      !task.task_type // Include legacy tasks
    )
    .sort((a, b) => {
      const dateA = a.next_due || a.due_date;
      const dateB = b.next_due || b.due_date;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateA).getTime() - new Date(dateB).getTime();
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
    // Show 404 alert for now (placeholder for future detail page)
    Alert.alert('Task Details', 'Task detail page coming soon!');
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      // Find the task to get current status
      const task = tasks.find(t => t.id === taskId);
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
          completion_notes: 'Completed from tasks screen'
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDueDay = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const getFrequencyText = (task: any) => {
    if (task.recurrence_pattern) {
      return task.recurrence_pattern;
    }
    if (task.next_due) {
      return `Due ${formatDate(task.next_due)}`;
    }
    return '';
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
        onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
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
              backgroundColor: item.status === 'completed' ? '#E8F5E8' : '#E3F2FD',
              opacity: item.status === 'completed' ? 0.8 : 1
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
                    color: item.status === 'completed' ? colors.textSecondary : colors.text,
                    textDecorationLine: item.status === 'completed' ? 'line-through' : 'none'
                  }
                ]}>
                  {item.title}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleTaskComplete(item.id)}
                  style={styles.taskCheckbox}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.status === 'completed' ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color="#7fbbdd" 
                  />
                </TouchableOpacity>
              </View>
              {item.status === 'completed' && item.completed_at && (
                <Text style={[styles.completionDate, { color: colors.textSecondary }]}>
                  Completed: {formatDate(item.completed_at)}
                </Text>
              )}
            </View>
            
            <View style={styles.taskDate}>
              <View style={[
                styles.datePill, 
                { 
                  backgroundColor: item.status === 'completed' ? colors.textSecondary : '#1976D2' 
                }
              ]}>
                <Text style={[styles.dateText, { color: '#FFFFFF' }]}>
                  {item.next_due ? formatDate(item.next_due) : formatDate(item.due_date)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderViewToggle = () => (
    <Animated.View 
      style={[
        styles.viewToggleContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === 'tasks' && { backgroundColor: colors.primary }
        ]}
        onPress={handleAddEditTasks}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.toggleButtonText,
          { color: viewMode === 'tasks' ? colors.background : colors.text }
        ]}>
          Add / Edit Tasks
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          viewMode === 'calendar' && { backgroundColor: colors.primary }
        ]}
        onPress={handleCalendarView}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.toggleButtonText,
          { color: viewMode === 'calendar' ? colors.background : colors.text }
        ]}>
          Calendar View
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const handleAddEditTasks = () => {
    if (userTasks.length === 0) {
      Alert.alert('No Tasks Yet', 'You haven\'t set up any tasks yet. Go to settings to add tasks.');
      return;
    }
    // Show active tasks in sorted order instead of going to settings
    router.push('/(tabs)/(tasks)/add' as any);
  };

  const handleCalendarView = () => {
    router.push('/(tabs)/(calendar)' as any);
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/(tasks)/settings' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {renderViewToggle()}
          
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
    padding: 8,
    borderRadius: 8,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskCheckbox: {
    padding: 4,
  },
  completionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  taskDate: {
    alignItems: 'flex-end',
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
});