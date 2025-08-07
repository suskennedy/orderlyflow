import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import TaskDueDateModal from '../TaskDueDateModal';

const TASK_CATEGORIES = [
  {
    name: 'Maintenance',
    tasks: [
      { name: 'Fridge filter', suggestedFrequency: '6 months' },
      { name: 'Change air filter', suggestedFrequency: '3 months' },
      { name: 'Clean dishwasher', suggestedFrequency: 'Monthly' },
      { name: 'Test smoke detectors', suggestedFrequency: 'Monthly' },
      { name: 'Clean garbage disposal', suggestedFrequency: 'Monthly' },
      { name: 'Vacuum refrigerator coils', suggestedFrequency: 'Yearly' },
      { name: 'Flush water heater', suggestedFrequency: 'Yearly' },
    ]
  },
  {
    name: 'Health + Safety',
    tasks: [
      { name: 'Test smoke detectors', suggestedFrequency: 'Monthly' },
      { name: 'Check fire extinguisher', suggestedFrequency: 'Yearly' },
      { name: 'Update emergency kit', suggestedFrequency: '6 months' },
      { name: 'Clean medication cabinet', suggestedFrequency: '6 months' },
    ]
  },
  {
    name: 'Deep Cleaning',
    tasks: [
      { name: 'Deep clean carpets', suggestedFrequency: 'Yearly' },
      { name: 'Window cleaning', suggestedFrequency: '6 months' },
      { name: 'Clean pantry', suggestedFrequency: '3 months' },
      { name: 'Bathtub caulking', suggestedFrequency: 'As needed' },
    ]
  },
  {
    name: 'Repairs',
    tasks: [
      { name: 'General repairs', suggestedFrequency: 'As needed' },
    ]
  }
];

export default function TaskSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { tasks, addTask } = useTasks();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const toggleTaskExpansion = (taskName: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskName)) {
      newExpandedTasks.delete(taskName);
    } else {
      newExpandedTasks.add(taskName);
    }
    setExpandedTasks(newExpandedTasks);
  };

  const toggleTask = (task: any) => {
    const taskName = task.name;
    const newSelectedTasks = new Set(selectedTasks);
    
    if (newSelectedTasks.has(taskName)) {
      // Remove task
      newSelectedTasks.delete(taskName);
      setSelectedTasks(newSelectedTasks);
    } else {
      // Add task - show due date modal
      setSelectedTask(task);
      setShowDueDateModal(true);
    }
  };

  const handleDueDateConfirm = async (dueDate: string, recurrencePattern: string | null, isRecurring: boolean) => {
    if (!selectedTask) return;

    try {
      // Create task in database
      const taskData = {
        title: selectedTask.name,
        suggested_frequency: selectedTask.suggestedFrequency,
        due_date: dueDate,
        next_due: dueDate,
        is_recurring: isRecurring,
        is_recurring_task: isRecurring,
        recurrence_pattern: recurrencePattern,
        task_type: 'preset',
        status: 'pending',
        is_active: true,
        category: getCategoryForTask(selectedTask.name),
      };

      await addTask(taskData);
      
      // Add to selected tasks
      const newSelectedTasks = new Set(selectedTasks);
      newSelectedTasks.add(selectedTask.name);
      setSelectedTasks(newSelectedTasks);
      
      setSelectedTask(null);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const getCategoryForTask = (taskName: string) => {
    for (const category of TASK_CATEGORIES) {
      if (category.tasks.some(task => task.name === taskName)) {
        return category.name;
      }
    }
    return 'General';
  };

  const isTaskInDatabase = (taskName: string) => {
    return tasks.some(task => task.title === taskName);
  };

  const getTaskFromDatabase = (taskName: string) => {
    return tasks.find(task => task.title === taskName);
  };

  const handleTaskPress = (taskName: string) => {
    // Navigate to edit task screen
    router.push(`/(tabs)/(tasks)/edit?taskName=${encodeURIComponent(taskName)}` as any);
  };

  const handleProjectsPress = () => {
    router.push('/(tabs)/(tasks)/projects' as any);
  };

  const handleMakeListPress = () => {
    router.push('/(tabs)/(tasks)/add' as any);
  };

  const renderTaskDetails = (task: any) => {
    const dbTask = getTaskFromDatabase(task.name);
    const isExpanded = expandedTasks.has(task.name);
    const isSelected = selectedTasks.has(task.name) || isTaskInDatabase(task.name);

    return (
      <View key={task.name} style={styles.taskItem}>
        <TouchableOpacity
          style={styles.taskHeader}
          onPress={() => toggleTaskExpansion(task.name)}
          activeOpacity={0.7}
        >
          <View style={styles.taskInfo}>
            <Text style={[styles.taskName, { color: colors.text }]}>
              {task.name}
            </Text>
            <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
              Suggested: {task.suggestedFrequency}
            </Text>
          </View>
          
          <View style={styles.taskActions}>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                { backgroundColor: isSelected ? colors.primary : colors.border }
              ]}
              onPress={() => toggleTask(task)}
            >
              <View style={[
                styles.toggleKnob,
                { 
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: isSelected ? 22 : 2 }]
                }
              ]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleTaskExpansion(task.name)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={[styles.taskDetails, { backgroundColor: colors.background }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Category:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{getCategoryForTask(task.name)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Suggested Frequency:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{task.suggestedFrequency}</Text>
            </View>
            
            {dbTask && (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{dbTask.status || 'Pending'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {dbTask.due_date ? new Date(dbTask.due_date).toLocaleDateString() : 'Not set'}
                  </Text>
                </View>
                
                {dbTask.is_recurring && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Recurrence:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{dbTask.recurrence_pattern}</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleTaskPress(task.name)}
                >
                  <Text style={[styles.editButtonText, { color: colors.background }]}>Edit Task</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCategory = (category: any) => {
    const isExpanded = expandedCategory === category.name;
    
    return (
      <View key={category.name} style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryHeader, { backgroundColor: colors.surface }]}
          onPress={() => toggleCategory(category.name)}
          activeOpacity={0.7}
        >
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            {category.name}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={[styles.categoryContent, { backgroundColor: colors.surface }]}>
            {category.tasks.map(renderTaskDetails)}
          </View>
        )}
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        {TASK_CATEGORIES.map(renderCategory)}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleProjectsPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Projects
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.background,
              borderColor: colors.primary,
              borderWidth: 2
            }]}
            onPress={handleMakeListPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              + Make a List
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Task Due Date Modal */}
      <TaskDueDateModal
        visible={showDueDateModal}
        onClose={() => {
          setShowDueDateModal(false);
          setSelectedTask(null);
        }}
        onConfirm={handleDueDateConfirm}
        taskTitle={selectedTask?.name || ''}
        suggestedFrequency={selectedTask?.suggestedFrequency || ''}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContent: {
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent', // Make it transparent to show background behind
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskFrequency: {
    fontSize: 14,
    fontWeight: '400',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  expandButton: {
    padding: 8,
  },
  taskDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 