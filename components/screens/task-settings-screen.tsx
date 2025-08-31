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


// Define the four main categories from the database
const DATABASE_CATEGORIES = [
  'Deep Cleaning',
  'Home + Safety', 
  'Home Maintenance',
  'Repairs'
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

interface TaskSettingsScreenProps {
  homeId?: string;
}

export default function TaskSettingsScreen({ homeId }: TaskSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { tasks, addTask, updateTask, getTasksForHome, activateTaskForHome, deactivateTaskForHome } = useTasks();
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
  const homeSpecificTasks = homeId ? getTasksForHome(homeId) : [];
  
  const activeTasks = homeSpecificTasks
    .filter(task => 
      task.is_active && task.status !== 'completed' && task.status !== 'template'
    )
    .sort((a, b) => {
      const dateA = a.next_due || a.due_date;
      const dateB = b.next_due || b.due_date;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  const completedTasks = homeSpecificTasks
    .filter(task => 
      task.status === 'completed'
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

  // Get tasks for each category from the database
  const getTasksForCategory = (categoryName: string) => {
    return tasks.filter(task => 
      task.category === categoryName && task.is_active
    );
  };

  // Get predefined tasks that should be shown for all users
  const getPresetTasksForCategory = (categoryName: string) => {
    const presetTasks: { [key: string]: { name: string; suggestedFrequency: string }[] } = {
      'Deep Cleaning': [
        { name: 'Deep clean carpets', suggestedFrequency: 'Yearly' },
        { name: 'Window cleaning', suggestedFrequency: '6 months' },
        { name: 'Clean pantry', suggestedFrequency: '3 months' },
        { name: 'Bathtub caulking', suggestedFrequency: 'As needed' },
        { name: 'Clean refrigerator coils', suggestedFrequency: 'Yearly' },
        { name: 'Deep clean oven', suggestedFrequency: '6 months' }
      ],
      'Home + Safety': [
        { name: 'Test smoke detectors', suggestedFrequency: 'Monthly' },
        { name: 'Check carbon monoxide detectors', suggestedFrequency: 'Monthly' },
        { name: 'Test fire extinguishers', suggestedFrequency: '6 months' },
        { name: 'Check emergency lights', suggestedFrequency: '3 months' },
        { name: 'Inspect electrical outlets', suggestedFrequency: '6 months' }
      ],
      'Home Maintenance': [
        { name: 'Fridge filter', suggestedFrequency: '6 months' },
        { name: 'Change air filter', suggestedFrequency: '3 months' },
        { name: 'Clean dishwasher', suggestedFrequency: 'Monthly' },
        { name: 'Clean garbage disposal', suggestedFrequency: 'Monthly' },
        { name: 'Flush water heater', suggestedFrequency: 'Yearly' },
        { name: 'Clean dryer vent', suggestedFrequency: '6 months' },
        { name: 'Inspect roof gutters', suggestedFrequency: '6 months' }
      ],
      'Repairs': [
        { name: 'General repairs', suggestedFrequency: 'As needed' },
        { name: 'Fix leaky faucets', suggestedFrequency: 'As needed' },
        { name: 'Repair broken tiles', suggestedFrequency: 'As needed' },
        { name: 'Fix squeaky doors', suggestedFrequency: 'As needed' },
        { name: 'Repair window screens', suggestedFrequency: 'As needed' }
      ]
    };

    return presetTasks[categoryName] || [];
  };

  // Helper function to remove duplicate tasks from database
  const removeDuplicateTasks = async () => {
    try {
      // Group tasks by title to find duplicates
      const tasksByTitle = tasks.reduce((acc, task) => {
        if (!acc[task.title]) {
          acc[task.title] = [];
        }
        acc[task.title].push(task);
        return acc;
      }, {} as {[key: string]: any[]});

      // Find titles that have more than one task
      const duplicateTitles = Object.keys(tasksByTitle).filter(title => tasksByTitle[title].length > 1);
      
      if (duplicateTitles.length > 0) {
        console.log('Found duplicate task titles:', duplicateTitles);
        
        for (const title of duplicateTitles) {
          const duplicateTasks = tasksByTitle[title];
          // Keep the most recently created one, remove the rest
          const sortedTasks = duplicateTasks.sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
          const tasksToRemove = sortedTasks.slice(1); // Remove all but the first (most recent)
          
          console.log(`Removing ${tasksToRemove.length} duplicate(s) of "${title}"`);
          
          for (const task of tasksToRemove) {
            await updateTask(task.id, { is_active: false });
          }
        }
        
        showToast(`Cleaned up ${duplicateTitles.length} duplicate task(s)`, 'success');
      }
    } catch (error) {
      console.error('Error removing duplicate tasks:', error);
      showToast('Failed to clean up duplicate tasks', 'error');
    }
  };

  // Combine preset tasks with database tasks for each category
  const getCombinedTasksForCategory = (categoryName: string) => {
    const databaseTasks = getTasksForCategory(categoryName);
    const presetTasks = getPresetTasksForCategory(categoryName);
    
    // Create a map of existing database tasks by title to avoid duplicates
    const existingTaskTitles = new Set(databaseTasks.map(task => task.title));
    
    // Filter out preset tasks that already exist in database
    const uniquePresetTasks = presetTasks.filter((presetTask: { name: string; suggestedFrequency: string }) => 
      !existingTaskTitles.has(presetTask.name)
    );
    
    // Convert database tasks to the format expected by renderTaskItem
    const formattedDatabaseTasks = databaseTasks.map(task => ({
      name: task.title,
      suggestedFrequency: task.recurrence_pattern ? `Every ${task.recurrence_pattern}` : 'One-time',
      category: task.category || 'General',
      subcategory: task.subcategory || null,
      isPreset: task.task_type === 'preset',
      databaseTask: task // Keep reference to original task
    }));
    
    // Convert preset tasks to the same format
    const formattedPresetTasks = uniquePresetTasks.map((presetTask: { name: string; suggestedFrequency: string }) => ({
      name: presetTask.name,
      suggestedFrequency: presetTask.suggestedFrequency,
      category: categoryName,
      subcategory: null,
      isPreset: true,
      databaseTask: null // No database task for preset
    }));
    
    return [...formattedDatabaseTasks, ...formattedPresetTasks];
  };

  // Initialize selectedTasks based on existing active tasks
  useEffect(() => {
    const activeTaskNames = new Set(activeTasks.map(t => t.title));
    
    // Also include preset tasks that have been activated (exist in database)
    const activePresetTasks = tasks.filter(t => 
      t.task_type === 'preset' && t.is_active
    ).map(t => t.title);
    
    const allActiveTaskNames = new Set([...activeTaskNames, ...activePresetTasks]);
    setSelectedTasks(allActiveTaskNames);
    console.log('Initialized selectedTasks with active tasks:', Array.from(allActiveTaskNames));
  }, [tasks, activeTasks]);

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
    const existingHomeTask = homeSpecificTasks.find(t => t.title === taskName);
    const isCurrentlySelected = selectedTasks.has(taskName);
    
    // Validate homeId is required
    if (!homeId) {
      showToast('Please select a home before managing tasks', 'error');
      return;
    }
    
    if (existingHomeTask) {
      // Home task exists - toggle its active status
      try {
        if (existingHomeTask.is_active) {
          // Deactivate the home task
          console.log(`Deactivating home task ${taskName}`);
          await deactivateTaskForHome(homeId, existingHomeTask.id);
          
          setSelectedTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskName);
            return newSet;
          });
          showToast(`Task "${taskName}" deactivated successfully!`, 'success');
        } else {
          // Reactivate the home task
          console.log(`Reactivating home task ${taskName}`);
          await activateTaskForHome(homeId, existingHomeTask.id);
          
          setSelectedTasks(prev => new Set([...prev, taskName]));
          showToast(`Task "${taskName}" activated successfully!`, 'success');
        }
        
        console.log('Task status updated successfully');
      } catch (error) {
        console.error('Error updating task status:', error);
        showToast('Failed to update task status. Please try again.', 'error');
      }
    } else {
      // Task doesn't exist in database - handle visual toggle and dropdown
      if (isCurrentlySelected) {
        // Task is currently selected but not saved - deactivate it
        console.log('Deactivating unsaved task:', taskName);
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskName);
          return newSet;
        });
        
        // Close the dropdown if open
        setExpandedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskName);
          return newSet;
        });
        
        // Clear form data
        setTaskForms(prev => {
          const newForms = { ...prev };
          delete newForms[taskName];
          return newForms;
        });
        
        showToast(`"${taskName}" deactivated`, 'info');
      } else {
        // Task is not selected - show dropdown for configuration before creating
        console.log('Showing configuration dropdown for new task:', taskName);
        
        // Toggle the task to be selected (visually active)
        setSelectedTasks(prev => new Set([...prev, taskName]));
        
        // Open the dropdown for configuration
        toggleTaskExpansion(taskName);
        
        // Show a helpful message
        showToast(`Configure "${taskName}" settings and click Save to activate`, 'info');
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
    
    // Validate homeId is required for new tasks
    if (!existingTask && !homeId) {
      showToast('Please select a home before adding tasks', 'error');
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
          home_id: homeId, // Ensure home_id is set for the task
          is_recurring: taskForm.is_recurring,
          recurrence_pattern: taskForm.recurrence_pattern,
          is_active: taskForm.is_active,
          task_type: task.isPreset ? 'preset' : 'custom',
          suggested_frequency: task.suggestedFrequency,
          assigned_vendor_id: taskForm.assigned_vendor_id || null,
          assigned_user_id: taskForm.assigned_user_id || null,
          notes: taskForm.notes || null
        };

        await addTask(taskData);
        showToast('Task created successfully!', 'success');
        
        // Close the dropdown after successful creation
        setExpandedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskName);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Failed to save task. Please try again.', 'error');
      
      // If task creation failed, remove from selected tasks
      if (!existingTask) {
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskName);
          return newSet;
        });
      }
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

  const renderTaskItem = (task: any, category: string, index: number) => {
    const isSelected = selectedTasks.has(task.name);
    const isExpanded = expandedTasks.has(task.name);
    const existingTask = tasks.find(t => t.title === task.name);
    const taskForm = taskForms[task.name];
    const assignedVendor = taskForm?.assigned_vendor_id ? 
      vendors.find(v => v.id === taskForm.assigned_vendor_id) : 
      (existingTask?.assigned_vendor_id ? vendors.find(v => v.id === existingTask.assigned_vendor_id) : null);
    
    // Determine if task is active (either in selectedTasks or existingTask.is_active is true)
    const isTaskActive = isSelected || (existingTask?.is_active === true);
    
    // Create unique key using category, task name, and index to avoid duplicates
    const uniqueKey = existingTask?.id || `${category}-${task.name}-${index}`;
    
    return (
      <View key={uniqueKey} style={styles.taskItem}>
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
          onPress={() => router.push(homeId ? `/(tabs)/(home)/${homeId}/tasks/add` : '/(tabs)/(tasks)' as any)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Cards with Inline Task Sections */}
        {DATABASE_CATEGORIES.map((category) => (
          <View key={category}>
            <TouchableOpacity
              style={[
                styles.categoryCard,
                { backgroundColor: colors.surface },
                expandedCategory === category && { backgroundColor: colors.primary }
              ]}
              onPress={() => toggleCategory(category)}
            >
              <Text style={[
                styles.categoryCardTitle,
                { 
                  color: expandedCategory === category ? colors.background : colors.text 
                }
              ]}>
                {category} ({getCombinedTasksForCategory(category).length})
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={expandedCategory === category ? colors.background : colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {/* Task Cards - Show directly under category when expanded */}
            {expandedCategory === category && (
              <View style={styles.taskCardsContainer}>
                {getCombinedTasksForCategory(category).map((task, index) => renderTaskItem({
                  name: task.name,
                  suggestedFrequency: task.suggestedFrequency,
                  category: task.category || 'General',
                  subcategory: task.subcategory || null,
                  isPreset: task.isPreset,
                  databaseTask: task.databaseTask
                }, category, index))}
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
                {customTasks.map((task, index) => renderTaskItem({
                  name: task.title,
                  suggestedFrequency: task.recurrence_pattern ? `Every ${task.recurrence_pattern}` : 'One-time',
                  category: task.category || 'Custom',
                  subcategory: task.subcategory || null,
                  isPreset: false,
                  databaseTask: task
                }, 'Custom Tasks', index))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/(tasks)/add' as any)}
          >
            <Ionicons name="add" size={16} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
               Project
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