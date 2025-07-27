import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface TaskHistory {
  id: string;
  completed_at: string;
  completed_by?: string;
  notes?: string;
}

interface Task {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  isActive: boolean;
  suggested_frequency: string;
  custom_frequency?: string | null;
  last_completed?: string | null;
  next_due?: string | null;
  assigned_vendor?: string | null;
  assigned_user?: string | null;
  instructions?: string | null;
  estimated_cost?: string | null;
  image_url?: string | null;
  history: TaskHistory[];
}

const TASK_CATEGORIES = [
  {
    name: 'Home Maintenance',
    subcategories: [
      'Filters',
      'Light Bulbs', 
      'Irrigation',
      'Window Cleaning',
      'Furniture Cleaning',
      'Rug Cleaning',
      'Exterior Home',
      'Painting',
      'Gutters',
      'Chimney / Fireplace',
      'Decks / Patio',
      'Tree / Shrub Trimming',
      'Grass cutting',
      'HVAC Service',
      'Sump Pump',
      'Security Systems and Cameras'
    ]
  },
  {
    name: 'Health + Safety',
    subcategories: [
      'Smoke / CO2 Detectors',
      'Fire Extinguisher',
      'Emergency Kit',
      'Medication Clean Out'
    ]
  },
  {
    name: 'Deep Cleaning',
    subcategories: [
      'Fridge',
      'Dryer Vents',
      'Trash Cans',
      'Sheets',
      'Baseboards and Door Frames',
      'Light Fixtures + Ceiling Fans',
      'Vents + Air Returns',
      'Shower Heads',
      'Garbage Disposal',
      'Washer + Dryer',
      'Grout',
      'Garage'
    ]
  },
  {
    name: 'Repairs',
    subcategories: [
      'General Repairs'
    ]
  }
];

// Task frequency suggestions
const FREQUENCY_SUGGESTIONS: { [key: string]: string } = {
  'Filters': '30-90 days',
  'Light Bulbs': 'As needed - check monthly',
  'Irrigation': 'Spring (start-up) / Fall (winterize)',
  'Window Cleaning': '2x a year - spring and fall',
  'Furniture Cleaning': '6 months',
  'Rug Cleaning': '6 months',
  'Exterior Home': 'Annually (spring or summer)',
  'Painting': 'Touch ups annually; full repair every 5-10 years',
  'Gutters': 'Spring and fall',
  'Chimney / Fireplace': 'Annually (fall)',
  'Decks / Patio': 'Annually (spring / summer)',
  'Tree / Shrub Trimming': 'Annually (late winter / early spring or after blooming)',
  'Grass cutting': 'Weekly or as needed',
  'HVAC Service': 'Twice per year (spring and fall)',
  'Sump Pump': 'Annually',
  'Security Systems and Cameras': 'Annually (test and clean)',
  'Smoke / CO2 Detectors': 'Test monthly, replace batteries annually',
  'Fire Extinguisher': 'Inspect annually',
  'Emergency Kit': 'Review and update every 6 months',
  'Medication Clean Out': 'Annually',
  'Fridge': '6 months',
  'Dryer Vents': 'Annually',
  'Trash Cans': 'Monthly',
  'Sheets': 'Weekly or bi-weekly',
  'Baseboards and Door Frames': '6 months',
  'Light Fixtures + Ceiling Fans': 'Quarterly',
  'Vents + Air Returns': 'Quarterly',
  'Shower Heads': '6 months',
  'Garbage Disposal': 'Monthly (deep clean 6 months)',
  'Washer + Dryer': 'Annually',
  'Grout': 'Annually',
  'Garage': 'Quarterly'
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh, toggleTaskActive, updateTask, completeTask } = useTasks();
  const { colors } = useTheme();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [customFrequencies, setCustomFrequencies] = useState<{ [key: string]: string }>({});
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<{ [key: string]: boolean }>({});

  // Use real data from database
  const displayTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    category: task.category || 'Uncategorized',
    subcategory: task.subcategory || 'General',
    isActive: task.is_active ?? true,
    suggested_frequency: task.suggested_frequency || 'As needed',
    custom_frequency: task.custom_frequency,
    last_completed: task.last_completed,
    next_due: task.next_due,
    assigned_vendor: task.assigned_vendor?.name,
    assigned_user: task.assigned_user?.display_name,
    instructions: task.instructions,
    estimated_cost: task.estimated_cost ? `$${task.estimated_cost}` : undefined,
    image_url: task.image_url,
    history: task.task_history?.map(h => ({
      id: h.id,
      completed_at: h.completed_at,
      completed_by: h.completed_by,
      notes: h.notes
    })) || []
  }));

  // Initialize custom frequencies from database
  useEffect(() => {
    const initialFrequencies: { [key: string]: string } = {};
    tasks.forEach(task => {
      if (task.custom_frequency) {
        initialFrequencies[task.id] = task.custom_frequency;
      }
    });
    setCustomFrequencies(initialFrequencies);
  }, [tasks]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleToggleTaskActive = async (taskId: string, currentState: boolean) => {
    try {
      await toggleTaskActive(taskId, !currentState);
    } catch (error) {
      console.error('Error toggling task:', error);
      // You could show a toast notification here
    }
  };

  const handleCustomFrequencyChange = (taskId: string, frequency: string) => {
    setCustomFrequencies(prev => ({
      ...prev,
      [taskId]: frequency
    }));
    setUnsavedChanges(prev => ({
      ...prev,
      [taskId]: true
    }));
  };

  const handleApplySuggestedFrequency = async (taskId: string, suggestedFreq: string) => {
    try {
      await updateTask(taskId, { 
        custom_frequency: suggestedFreq,
        frequency_type: 'suggested'
      });
      // Update local state
      setCustomFrequencies(prev => ({
        ...prev,
        [taskId]: suggestedFreq
      }));
      setUnsavedChanges(prev => ({
        ...prev,
        [taskId]: false
      }));
    } catch (error) {
      console.error('Error applying suggested frequency:', error);
    }
  };

  const handleSaveCustomFrequency = async (taskId: string) => {
    const frequency = customFrequencies[taskId];
    if (!frequency?.trim()) return;

    try {
      await updateTask(taskId, { 
        custom_frequency: frequency,
        frequency_type: 'custom'
      });
      setEditingTask(null);
      setUnsavedChanges(prev => ({
        ...prev,
        [taskId]: false
      }));
    } catch (error) {
      console.error('Error saving custom frequency:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId, {
        notes: 'Task completed',
        completion_rating: 5,
        time_spent_minutes: 30
      });
      Alert.alert('Success', 'Task marked as completed!');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleTaskPress = (task: any) => {
    // Navigate to task detail page (404 for now as requested)
    Alert.alert('Task Detail', 'Task detail page coming soon!');
  };

  const getTasksByCategory = (category: string) => {
    return displayTasks.filter(task => task.category === category);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTaskHistory = (history: TaskHistory[]) => (
    <View style={styles.historySection}>
      <Text style={[styles.historyTitle, { color: colors.text }]}>History</Text>
      {history.length === 0 ? (
        <Text style={[styles.noHistory, { color: colors.textSecondary }]}>No completion history</Text>
      ) : (
        history.map((entry) => (
          <View key={entry.id} style={[styles.historyItem, { backgroundColor: colors.background }]}>
            <Text style={[styles.historyDate, { color: colors.text }]}>
              {formatDateTime(entry.completed_at)}
            </Text>
            <Text style={[styles.historyUser, { color: colors.primary }]}>
              Completed by: {entry.completed_by || 'N/A'}
            </Text>
            {entry.notes && (
              <Text style={[styles.historyNotes, { color: colors.textSecondary }]}>
                {entry.notes}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderTaskCard = (task: any) => {
    const isExpanded = expandedTasks.includes(task.id);
    const suggestedFreq = FREQUENCY_SUGGESTIONS[task.subcategory] || task.suggested_frequency;
    const isEditing = editingTask === task.id;
    const isUnsaved = unsavedChanges[task.id];

    return (
      <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.surface }]}>
        {/* Task Header */}
        <TouchableOpacity 
          style={styles.taskHeader}
          onPress={() => handleTaskPress(task)}
        >
          <View style={styles.taskTitleSection}>
            <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
            <Text style={[styles.taskSubcategory, { color: colors.textSecondary }]}>
              {task.subcategory}
            </Text>
          </View>
          <View style={styles.taskControls}>
            <TouchableOpacity 
              style={[
                styles.toggleSwitch, 
                { 
                  backgroundColor: task.isActive ? colors.primary : '#E5E7EB',
                  borderColor: task.isActive ? colors.primary : '#D1D5DB'
                }
              ]}
              onPress={() => handleToggleTaskActive(task.id, task.isActive)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.toggleKnob, 
                { 
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: task.isActive ? 22 : 2 }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3
                }
              ]} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => toggleTask(task.id)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Task Details (when expanded) */}
        {isExpanded && (
          <View style={styles.taskDetails}>
            {/* Frequency Section */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Suggested Frequency</Text>
              <TouchableOpacity 
                style={[styles.frequencyButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => handleApplySuggestedFrequency(task.id, suggestedFreq)}
              >
                <Text style={[styles.frequencyText, { color: colors.primary }]}>{suggestedFreq}</Text>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              </TouchableOpacity>
              {isEditing ? (
                <TextInput
                  style={[styles.customFrequencyInput, { 
                    backgroundColor: colors.background, 
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  placeholder="Or enter custom frequency..."
                  placeholderTextColor={colors.textSecondary}
                  value={customFrequencies[task.id] || ''}
                  onChangeText={(text) => handleCustomFrequencyChange(task.id, text)}
                  onBlur={() => handleSaveCustomFrequency(task.id)}
                  onSubmitEditing={() => handleSaveCustomFrequency(task.id)}
                  autoFocus
                />
              ) : (
                <TouchableOpacity 
                  style={[styles.customFrequencyInput, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border 
                  }]}
                  onPress={() => setEditingTask(task.id)}
                >
                  <Text style={[styles.customFrequencyText, { color: colors.textSecondary }]}>
                    {customFrequencies[task.id] || 'Not set'}
                  </Text>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              {isUnsaved && (
                <TouchableOpacity 
                  style={[styles.saveFrequencyButton, { backgroundColor: colors.primaryLight }]}
                  onPress={() => handleSaveCustomFrequency(task.id)}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.saveFrequencyText, { color: colors.primary }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Assignment Section */}
            <View style={styles.detailSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Assignment</Text>
              <View style={styles.assignmentRow}>
                <View style={styles.assignmentItem}>
                  <Text style={[styles.assignmentLabel, { color: colors.textSecondary }]}>User</Text>
                  <TouchableOpacity style={[styles.dropdownButton, { backgroundColor: colors.background }]}>
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {task.assigned_user || 'Select user'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.assignmentItem}>
                  <Text style={[styles.assignmentLabel, { color: colors.textSecondary }]}>Vendor</Text>
                  <TouchableOpacity style={[styles.dropdownButton, { backgroundColor: colors.background }]}>
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {task.assigned_vendor || 'Select vendor'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Instructions */}
            {task.instructions && (
              <View style={styles.detailSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Instructions</Text>
                <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                  {task.instructions}
                </Text>
              </View>
            )}

            {/* Cost Estimate (for repairs) */}
            {task.estimated_cost && (
              <View style={styles.detailSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Estimated Cost</Text>
                <Text style={[styles.costText, { color: colors.primary }]}>
                  {task.estimated_cost}
                </Text>
              </View>
            )}

            {/* Last Completed & Next Due */}
            <View style={styles.detailSection}>
              <View style={styles.dateRow}>
                <View style={styles.dateItem}>
                  <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Last Completed</Text>
                  <Text style={[styles.dateValue, { color: colors.text }]}>
                    {task.last_completed ? formatDate(task.last_completed) : 'Never'}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Next Due</Text>
                  <Text style={[styles.dateValue, { color: colors.text }]}>
                    {task.next_due ? formatDate(task.next_due) : 'Not scheduled'}
                  </Text>
                </View>
              </View>
            </View>

            {/* History */}
            {renderTaskHistory(task.history)}

            {/* Complete Task Button */}
            <View style={styles.detailSection}>
              <TouchableOpacity
                style={[styles.completeTaskButton, { backgroundColor: colors.primary }]}
                onPress={() => handleCompleteTask(task.id)}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.background} />
                <Text style={[styles.completeTaskText, { color: colors.background }]}>
                  Mark as Completed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = (category: any) => {
    const categoryTasks = getTasksByCategory(category.name);
    const isExpanded = expandedCategories.includes(category.name);

    return (
      <View key={category.name} style={styles.categorySection}>
        <View style={[styles.categoryHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.categoryInfo}
            onPress={() => toggleCategory(category.name)}
          >
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.name}</Text>
            <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>
              {categoryTasks.length} tasks
            </Text>
          </TouchableOpacity>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push({
                pathname: '/(dashboard)/tasks/add' as any,
                params: { category: category.name }
              })}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleCategory(category.name)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.categoryContent}>
            {categoryTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No tasks in this category
                </Text>
              </View>
            ) : (
              categoryTasks.map(renderTaskCard)
            )}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        {TASK_CATEGORIES.map(renderCategorySection)}
        
        {/* Add a Task Button */}
        <TouchableOpacity
          style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(dashboard)/tasks/add' as any)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={[styles.addTaskText, { color: colors.background }]}>Add a Task</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categorySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryContent: {
    paddingLeft: 8,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitleSection: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskSubcategory: {
    fontSize: 12,
    marginTop: 4,
  },
  taskControls: {
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
    marginRight: 8,
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
  expandButton: {
    padding: 8,
  },
  taskDetails: {
    paddingTop: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  frequencyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customFrequencyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  customFrequencyText: {
    flex: 1,
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  assignmentItem: {
    flex: 1,
  },
  assignmentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  costText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  historyItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyUser: {
    fontSize: 13,
    fontWeight: '500',
  },
  historyNotes: {
    fontSize: 12,
    marginTop: 4,
  },
  noHistory: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addTaskText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  completeTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  completeTaskText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveFrequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
    gap: 4,
  },
  saveFrequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddButton: {
    padding: 8,
    borderRadius: 8,
  },
});