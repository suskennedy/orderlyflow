import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
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
import { useToast } from '../../lib/contexts/ToastContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useHomes } from '../../lib/hooks/useHomes';

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
  },
  {
    name: 'Projects',
    tasks: [
      { name: 'Kitchen renovation', suggestedFrequency: 'As needed' },
      { name: 'Bathroom remodel', suggestedFrequency: 'As needed' },
      { name: 'Deck construction', suggestedFrequency: 'As needed' },
    ]
  }
];

const QUICK_OPTIONS = [
  'This Week',
  'Next Week', 
  'This Month',
  'Next Month',
  'This Year'
];

const RECURRENCE_OPTIONS = [
  { label: 'No Recurrence', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'bi-weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-annually', value: 'semi-annually' },
  { label: 'Annually', value: 'annually' }
];

export default function TaskSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { tasks, addTask, updateTask } = useTasks();
  const { homes } = useHomes();
  const { vendors } = useVendors();
  const { showToast } = useToast();
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [currentTaskForVendor, setCurrentTaskForVendor] = useState<any>(null);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState<string | null>(null);

  // Task detail form state - one form per task
  const [taskForms, setTaskForms] = useState<{[key: string]: {
    assigned_vendor_id: string;
    assigned_user_id: string;
    due_date: string;
    frequency: string;
    notes: string;
    is_recurring: boolean;
    recurrence_pattern: string | null;
    is_active: boolean;
  }}>({});

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

  // Separate custom tasks from predefined tasks
  const customTasks = tasks.filter(task => 
    task.task_type === 'custom' && task.is_active
  );

  const predefinedTasks = tasks.filter(task => 
    (task.task_type === 'preset' || !task.task_type) && task.is_active
  );

  // Initialize selectedTasks based on existing active tasks
  useEffect(() => {
    const activeTaskNames = new Set(activeTasks.map(t => t.title));
    setSelectedTasks(activeTaskNames);
    console.log('Initialized selectedTasks with active tasks:', Array.from(activeTaskNames));
  }, [tasks]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  const toggleTaskExpansion = (taskName: string) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskName)) {
      newExpandedTasks.delete(taskName);
    } else {
      newExpandedTasks.add(taskName);
      // Initialize form with existing task data when expanding
      const existingTask = tasks.find(t => t.title === taskName);
      if (existingTask) {
        setTaskForms(prev => ({
          ...prev,
          [taskName]: {
            assigned_vendor_id: existingTask.assigned_vendor_id || '',
            assigned_user_id: existingTask.assigned_user_id || '',
            due_date: existingTask.due_date || '',
            frequency: existingTask.recurrence_pattern || '',
            notes: existingTask.notes || '',
            is_recurring: existingTask.is_recurring || false,
            recurrence_pattern: existingTask.recurrence_pattern || null,
            is_active: existingTask.is_active !== false
          }
        }));
      } else {
        // Initialize with default values for new task
        setTaskForms(prev => ({
          ...prev,
          [taskName]: {
            assigned_vendor_id: '',
            assigned_user_id: '',
            due_date: new Date().toISOString().split('T')[0],
            frequency: '',
            notes: '',
            is_recurring: false,
            recurrence_pattern: null,
            is_active: true
          }
        }));
      }
    }
    setExpandedTasks(newExpandedTasks);
  };

  const toggleTask = async (task: any) => {
    console.log('Toggling task:', task);
    const taskName = task.name;
    const existingTask = tasks.find(t => t.title === taskName);
    
    if (existingTask) {
      // Task exists - toggle its active status
      try {
        const newActiveStatus = !existingTask.is_active;
        console.log(`Updating task ${taskName} active status from ${existingTask.is_active} to ${newActiveStatus}`);
        
        await updateTask(existingTask.id, { is_active: newActiveStatus });
        
        // Update local state to reflect the change immediately
        if (newActiveStatus) {
          setSelectedTasks(prev => new Set([...prev, taskName]));
          showToast(`Task "${taskName}" activated successfully!`, 'success');
        } else {
          setSelectedTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskName);
            return newSet;
          });
          showToast(`Task "${taskName}" deactivated successfully!`, 'success');
        }
        
        console.log('Task status updated successfully');
      } catch (error) {
        console.error('Error updating task status:', error);
        showToast('Failed to update task status. Please try again.', 'error');
      }
    } else {
      // Task doesn't exist - create it as active
      console.log('Creating new task:', taskName);
      try {
        const taskData = {
          title: task.name,
          category: task.category || 'General',
          subcategory: task.subcategory || null,
          due_date: new Date().toISOString().split('T')[0],
          is_recurring: false,
          recurrence_pattern: null,
          is_active: true,
          task_type: 'preset',
          suggested_frequency: task.suggestedFrequency
        };

        await addTask(taskData);
        setSelectedTasks(prev => new Set([...prev, taskName]));
        console.log('Task created successfully');
        showToast(`Task "${taskName}" created successfully!`, 'success');
      } catch (error) {
        console.error('Error creating task:', error);
        showToast('Failed to add task. Please try again.', 'error');
      }
    }
  };

  const handleTaskDetailSave = async (task: any) => {
    const taskName = task.name;
    const taskForm = taskForms[taskName];
    const existingTask = tasks.find(t => t.title === taskName);
    
    if (!taskForm) {
      showToast('Task form not found', 'error');
      return;
    }

    try {
      if (existingTask) {
        // Update existing task
        const updates = {
          assigned_vendor_id: taskForm.assigned_vendor_id || null,
          assigned_user_id: taskForm.assigned_user_id || null,
          due_date: taskForm.due_date || null,
          recurrence_pattern: taskForm.recurrence_pattern || null,
          is_recurring: taskForm.is_recurring,
          notes: taskForm.notes || null,
          is_active: taskForm.is_active
        };

        await updateTask(existingTask.id, updates);
        showToast('Task updated successfully!', 'success');
      } else {
        // Create new task
        const taskData = {
          title: taskName,
          category: task.category || 'General',
          subcategory: task.subcategory || null,
          due_date: taskForm.due_date,
          is_recurring: taskForm.is_recurring,
          recurrence_pattern: taskForm.recurrence_pattern,
          is_active: taskForm.is_active,
          task_type: 'preset',
          suggested_frequency: task.suggestedFrequency,
          assigned_vendor_id: taskForm.assigned_vendor_id || null,
          assigned_user_id: taskForm.assigned_user_id || null,
          notes: taskForm.notes || null
        };

        await addTask(taskData);
        showToast('Task created successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Failed to save task. Please try again.', 'error');
    }
  };

  const handleVendorSelection = (vendorId: string) => {
    console.log('Vendor selected:', vendorId);
    if (currentTaskForVendor) {
      const taskName = currentTaskForVendor.name || currentTaskForVendor.title;
      setTaskForms(prev => ({
        ...prev,
        [taskName]: {
          ...prev[taskName],
          assigned_vendor_id: vendorId
        }
      }));
    }
    setShowVendorModal(false);
  };

  const openVendorModal = (task: any) => {
    console.log('Opening vendor modal for task:', task);
    setCurrentTaskForVendor(task);
    setShowVendorModal(true);
  };

  const handleRecurrenceToggle = (taskName: string) => {
    setTaskForms(prev => ({
      ...prev,
      [taskName]: {
        ...prev[taskName],
        is_recurring: !prev[taskName]?.is_recurring,
        recurrence_pattern: !prev[taskName]?.is_recurring ? 'monthly' : null
      }
    }));
  };

  const handleRecurrenceSelect = (pattern: string | null, taskName: string) => {
    setTaskForms(prev => ({
      ...prev,
      [taskName]: {
        ...prev[taskName],
        recurrence_pattern: pattern,
        is_recurring: pattern !== null
      }
    }));
    setShowRecurrenceOptions(null);
  };

  const updateTaskForm = (taskName: string, field: string, value: any) => {
    setTaskForms(prev => ({
      ...prev,
      [taskName]: {
        ...prev[taskName],
        [field]: value
      }
    }));
  };

  const handleQuickOption = (option: string) => {
    // Calculate date based on quick option
    const now = new Date();
    let targetDate = new Date();
    
    switch (option) {
      case 'This Week':
        targetDate.setDate(now.getDate() + 7);
        break;
      case 'Next Week':
        targetDate.setDate(now.getDate() + 14);
        break;
      case 'This Month':
        targetDate.setMonth(now.getMonth() + 1);
        break;
      case 'Next Month':
        targetDate.setMonth(now.getMonth() + 2);
        break;
      case 'This Year':
        targetDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    setShowQuickOptions(false);
  };

  const renderTaskItem = (task: any, category: string) => {
    const isSelected = selectedTasks.has(task.name);
    const isExpanded = expandedTasks.has(task.name);
    const existingTask = tasks.find(t => t.title === task.name);
    const taskForm = taskForms[task.name];
    const assignedVendor = taskForm?.assigned_vendor_id ? 
      vendors.find(v => v.id === taskForm.assigned_vendor_id) : 
      (existingTask?.assigned_vendor_id ? vendors.find(v => v.id === existingTask.assigned_vendor_id) : null);
    
    // Determine if task is active (either in selectedTasks or existingTask.is_active is true)
    const isTaskActive = isSelected || (existingTask?.is_active === true);
    
    return (
      <View key={task.name} style={styles.taskItem}>
        <TouchableOpacity
          style={[styles.taskCard, { backgroundColor: colors.surface }]}
          onPress={() => toggleTaskExpansion(task.name)}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskName, { color: colors.text }]}>{task.name}</Text>
              <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
                Suggested replace: {task.suggestedFrequency}
              </Text>
            </View>
            
            <View style={styles.taskActions}>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: isTaskActive ? colors.primary : colors.border }
                ]}
                onPress={() => toggleTask(task)}
              >
                <View style={[
                  styles.toggleKnob,
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: isTaskActive ? 22 : 2 }]
                  }
                ]} />
              </TouchableOpacity>
              
              {/* Small down arrow for dropdown indication */}
              <TouchableOpacity
                style={styles.dropdownArrow}
                onPress={() => toggleTaskExpansion(task.name)}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Task Details Dropdown - Matching the image format */}
        {isExpanded && taskForm && (
          <View style={[styles.taskDetailsContainer, { backgroundColor: colors.surface }]}>
            {/* Task Name and Suggested Replacement */}
            <View style={styles.taskDetailHeader}>
              <Text style={[styles.taskDetailTitle, { color: colors.text }]}>{task.name}</Text>
              <Text style={[styles.taskDetailSubtitle, { color: colors.textSecondary }]}>
                Suggested replace: {task.suggestedFrequency}
              </Text>
            </View>
            
            {/* Toggle Switch */}
            <View style={styles.taskDetailToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: taskForm.is_active ? colors.primary : colors.border }
                ]}
                onPress={() => updateTaskForm(task.name, 'is_active', !taskForm.is_active)}
              >
                <View style={[
                  styles.toggleKnob,
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: taskForm.is_active ? 22 : 2 }]
                  }
                ]} />
              </TouchableOpacity>
            </View>
            
            {/* Attach User and Vendor Dropdowns */}
            <View style={styles.assignmentDropdowns}>
              <TouchableOpacity
                style={[styles.assignmentDropdown, { backgroundColor: colors.background }]}
                onPress={() => {/* TODO: Show user selection modal */}}
              >
                <Text style={[styles.assignmentDropdownText, { color: colors.textSecondary }]}>
                  Attach user
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.assignmentDropdown, { backgroundColor: colors.background }]}
                onPress={() => openVendorModal(task)}
              >
                <Text style={[styles.assignmentDropdownText, { color: colors.textSecondary }]}>
                  {assignedVendor ? assignedVendor.name : 'Attach vendor'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Start Date Input */}
            <View style={styles.startDateSection}>
              <Text style={[styles.startDateLabel, { color: colors.text }]}>Start date</Text>
              <TextInput
                style={[styles.startDateInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textSecondary}
                value={taskForm.due_date}
                onChangeText={(text) => updateTaskForm(task.name, 'due_date', text)}
              />
            </View>
            
            {/* Recurrence Section */}
            <View style={styles.recurrenceSection}>
              <View style={styles.recurrenceHeader}>
                <Text style={[styles.recurrenceLabel, { color: colors.text }]}>Recurrence</Text>
                <TouchableOpacity
                  style={[
                    styles.recurrenceToggle,
                    { 
                      backgroundColor: taskForm.is_recurring ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => handleRecurrenceToggle(task.name)}
                >
                  <View style={[
                    styles.recurrenceKnob,
                    { 
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: taskForm.is_recurring ? 20 : 2 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>
              
              {taskForm.is_recurring && (
                <View style={styles.recurrenceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceDropdown,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setShowRecurrenceOptions(showRecurrenceOptions === task.name ? null : task.name)}
                  >
                    <Text style={[styles.recurrenceDropdownText, { color: colors.text }]}>
                      {taskForm.recurrence_pattern ? 
                        RECURRENCE_OPTIONS.find(opt => opt.value === taskForm.recurrence_pattern)?.label : 
                        'Select recurrence pattern'
                      }
                    </Text>
                    <Ionicons 
                      name={showRecurrenceOptions === task.name ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                  
                  {showRecurrenceOptions === task.name && (
                    <View style={[styles.recurrenceOptionsList, { backgroundColor: colors.background }]}>
                      {RECURRENCE_OPTIONS.filter(option => option.value !== null).map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.recurrenceOption,
                            taskForm.recurrence_pattern === option.value && { backgroundColor: colors.primaryLight }
                          ]}
                          onPress={() => handleRecurrenceSelect(option.value, task.name)}
                        >
                          <Text style={[
                            styles.recurrenceOptionText,
                            { color: taskForm.recurrence_pattern === option.value ? colors.primary : colors.text }
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => handleTaskDetailSave(task)}
            >
              <Text style={[styles.saveButtonText, { color: colors.background }]}>Save</Text>
            </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.quickOptionsButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowQuickOptions(true)}
        >
          <Ionicons name="time" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Cards with Inline Task Sections */}
        {TASK_CATEGORIES.map((category) => (
          <View key={category.name}>
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface },
                expandedCategory === category.name && { backgroundColor: colors.primary }
              ]}
              onPress={() => toggleCategory(category.name)}
            >
              <Text style={[
                styles.categoryCardTitle,
                { 
                  color: expandedCategory === category.name ? colors.background : colors.text 
                }
              ]}>
                {category.name}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={expandedCategory === category.name ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {/* Task Cards - Show directly under category when expanded */}
            {expandedCategory === category.name && (
              <View style={styles.taskCardsContainer}>
                {category.tasks.map((task) => renderTaskItem(task, category.name))}
              </View>
            )}
          </View>
        ))}

        {/* Custom Tasks Section */}
        {customTasks.length > 0 && (
          <View>
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface },
                expandedCategory === 'Custom Tasks' && { backgroundColor: colors.primary }
              ]}
              onPress={() => toggleCategory('Custom Tasks')}
            >
              <Text style={[
                styles.categoryCardTitle,
                { 
                  color: expandedCategory === 'Custom Tasks' ? colors.background : colors.text 
                }
              ]}>
                Custom Tasks ({customTasks.length})
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={expandedCategory === 'Custom Tasks' ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {/* Custom Task Cards - Show directly under category when expanded */}
            {expandedCategory === 'Custom Tasks' && (
              <View style={styles.taskCardsContainer}>
                {customTasks.map((task) => renderTaskItem({
                  name: task.title,
                  suggestedFrequency: task.recurrence_pattern ? `Every ${task.recurrence_pattern}` : 'One-time',
                  category: task.category || 'Custom',
                  subcategory: task.subcategory || null
                }, 'Custom Tasks'))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => toggleCategory('Projects')}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Projects
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.background,
              borderColor: colors.primary,
              borderWidth: 1
            }]}
            onPress={() => router.push('/(tabs)/(tasks)/add' as any)}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              + Make a List
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Quick Options Modal */}
      <Modal
        visible={showQuickOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQuickOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickOptions(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Quick Options</Text>
              <TouchableOpacity onPress={() => setShowQuickOptions(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.quickOptionsList}>
              {QUICK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.quickOptionItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleQuickOption(option)}
                >
                  <Text style={[styles.quickOptionText, { color: colors.text }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Vendor Selection Modal */}
      <Modal
        visible={showVendorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVendorModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVendorModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Vendor</Text>
              <TouchableOpacity onPress={() => setShowVendorModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.vendorList}>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[styles.vendorItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleVendorSelection(vendor.id)}
                  >
                    <Text style={[styles.vendorName, { color: colors.text }]}>
                      {vendor.name}
                    </Text>
                    {vendor.category && (
                      <Text style={[styles.vendorCategory, { color: colors.textSecondary }]}>
                        {vendor.category}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyVendors}>
                  <Text style={[styles.emptyVendorsText, { color: colors.textSecondary }]}>
                    No vendors available. Add vendors first.
                  </Text>
                </View>
              )}
            </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  quickOptionsButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandedSection: {
    marginTop: 16,
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
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  taskInfo: {
    marginRight: 16,
    flex: 1,
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
    gap: 12,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  editButton: {
    padding: 8,
  },
  taskDetailsContainer: {
    marginTop: 0,
    padding: 16,
    borderRadius: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  taskDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  taskDetailValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  dropdownContainer: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownSection: {
    marginBottom: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  dropdownActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  quickOptionsList: {
    padding: 20,
  },
  quickOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  quickOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  taskDetailHeader: {
    marginBottom: 12,
  },
  taskDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDetailSubtitle: {
    fontSize: 14,
  },
  taskDetailToggle: {
    marginTop: 12,
    marginBottom: 12,
  },
  assignmentDropdowns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  assignmentDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    flex: 1,
  },
  assignmentDropdownText: {
    flex: 1,
    fontSize: 16,
  },
  startDateSection: {
    marginBottom: 12,
  },
  startDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  startDateInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  recurrenceSection: {
    marginBottom: 12,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurrenceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  recurrenceToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  recurrenceKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  recurrenceOptions: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recurrenceOptionsList: {
    padding: 12,
  },
  recurrenceDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  recurrenceDropdownText: {
    flex: 1,
    fontSize: 16,
  },
  recurrenceOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recurrenceOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownArrow: {
    padding: 8,
    marginLeft: 8,
  },
  vendorList: {
    maxHeight: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  vendorItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
  },
  emptyVendors: {
    padding: 20,
    alignItems: 'center',
  },
  emptyVendorsText: {
    fontSize: 16,
  },
}); 