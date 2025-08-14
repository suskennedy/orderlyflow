import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../../lib/contexts/TasksContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useVendors } from '../../../lib/contexts/VendorsContext';

export default function AddEditTasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh } = useTasks();
  const { vendors } = useVendors();
  const { colors } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Filter to only show active tasks, sorted by due date
  const activeTasks = tasks
    .filter(task => 
      task.is_active && (
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
    // Navigate to edit task screen
    router.push(`/(tabs)/(tasks)/edit?taskName=${encodeURIComponent(task.title)}` as any);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAssignedVendor = (task: any) => {
    if (!task.assigned_vendor_id) return null;
    return vendors.find(v => v.id === task.assigned_vendor_id);
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
        Go to settings to add tasks or activate existing ones
      </Text>
      <TouchableOpacity
        style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
        activeOpacity={0.8}
      >
        <View style={styles.addFirstButtonContent}>
          <Ionicons name="settings" size={24} color={colors.background} />
          <Text style={[styles.addFirstButtonText, { color: colors.background }]}>
            Go to Settings
          </Text>
        </View>
    </TouchableOpacity>
    </Animated.View>
  );

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => {
    const assignedVendor = getAssignedVendor(item);
    
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
                {item.status === 'completed' && (
                  <View style={[styles.completedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.background} />
                    <Text style={[styles.completedText, { color: colors.background }]}>
                      Completed
                    </Text>
                  </View>
                )}
              </View>
              {item.category && (
                <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
                  {item.category} • {item.subcategory || 'General'}
                </Text>
              )}
              {assignedVendor && (
                <Text style={[styles.taskVendor, { color: colors.primary }]}>
                  Assigned to: {assignedVendor.name}
                </Text>
              )}
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
          Sorted by due date • {activeTasks.length} tasks
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add / Edit Tasks</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(tabs)/(tasks)/settings' as any)}
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
          data={activeTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list, 
            { paddingBottom: insets.bottom + 120 }
          ]}
          ListHeaderComponent={activeTasks.length > 0 ? renderHeader : null}
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
  backButton: {
    padding: 8,
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
  taskVendor: {
    fontSize: 12,
    fontWeight: '500',
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
}); 