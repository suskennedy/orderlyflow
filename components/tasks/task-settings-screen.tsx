import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { useProjects } from '../../lib/hooks/useProjects';
import { useRepairs } from '../../lib/hooks/useRepairs';
import { useTasks } from '../../lib/hooks/useTasks';
import { useVendors } from '../../lib/hooks/useVendors';
import { supabase } from '../../lib/supabase';
import { getVendorDisplayText } from '../../lib/utils/vendorDisplayUtils';
import { Vendor } from '../../types/database';
import DatePicker from '../DatePicker';
import TimePicker from '../TimePicker';


// Define the three main categories from the database
const DATABASE_CATEGORIES = [
  'Deep Cleaning',
  'Health + Safety', 
  'Home Maintenance'
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
  const { templateTasks,fetchTemplateTasks, homeTasks, activateTemplateForHome, setCurrentHome } = useTasks();
  const { vendors } = useVendors();
  const { repairs, fetchRepairs } = useRepairs();
  const { projects, fetchProjects } = useProjects();
  const { showToast } = useToast();

  // Set current home when component mounts - use ref to prevent loops
  const lastHomeIdRef = React.useRef<string | undefined>(undefined);
  const hasInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (!homeId || homeId === lastHomeIdRef.current) return;
    
    lastHomeIdRef.current = homeId;
    
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchTemplateTasks();
      setCurrentHome(homeId);
      fetchRepairs(homeId);
      fetchProjects(homeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]); // Only depend on homeId - functions are stable
  
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
    due_time: string;
    frequency: string;
    notes: string;
    is_recurring: boolean;
    recurrence_pattern: string | null;
    is_active: boolean;
  }}>({});
  
  // Loading state for saving tasks
  const [savingTasks, setSavingTasks] = useState<Set<string>>(new Set());

  // Get tasks for this home (both active and inactive for proper toggle state)
  const homeTasksForHome = useMemo(() => {
    if (!homeId) return [];
    return homeTasks
      .filter(ht => ht.home_id === homeId)
      .map(ht => {
        const task = templateTasks.find(t => t.id === ht.task_id);
        return task ? { ...task, homeTaskId: ht.task_id, homeTask: ht } : null;
      })
      .filter((task): task is NonNullable<typeof task> => task !== null);
  }, [homeTasks, homeId, templateTasks]);

  // Get only active tasks for display purposes
  const activeTasksForHome = useMemo(() => {
    return homeTasksForHome.filter(task => task.homeTask.is_active === true);
  }, [homeTasksForHome]);

  // Get all available template tasks
  const allTemplateTasks = useMemo(() => templateTasks, [templateTasks]);

  // Filter tasks: active tasks first, then completed tasks
  const activeTasks = useMemo(() => activeTasksForHome
    .filter(task => 
      task.homeTask.is_active && task.homeTask.status !== 'completed'
    )
    .sort((a, b) => {
      const dateA = a.homeTask.next_due || a.homeTask.due_date;
      const dateB = b.homeTask.next_due || b.homeTask.due_date;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    }), [activeTasksForHome]);

  // Separate custom tasks from predefined tasks
  const customTasks = useMemo(() => activeTasksForHome.filter(task => 
    task.homeTask.task_id === null && task.homeTask.is_active
  ), [activeTasksForHome]);

  // Get tasks for each category from the template tasks
  const getTasksForCategory = useCallback((categoryName: string) => {
    return allTemplateTasks.filter(task => task.category === categoryName);
  }, [allTemplateTasks]);

  // Get only database tasks for each category (no preset tasks)r
  const getCombinedTasksForCategory = (categoryName: string) => {
    const databaseTasks = getTasksForCategory(categoryName);
    
    // Convert database tasks to the format expected by renderTaskItem
    const formattedDatabaseTasks = databaseTasks.map(task => ({
      name: task.title,
      description: task.description, // Include description from database
      suggestedFrequency: 'One-time', // Template tasks don't have recurrence pattern
      category: task.category || 'General',
      isPreset: false, // All template tasks are not preset
      databaseTask: task, // Keep reference to original task
      isActiveForHome: activeTasksForHome.some(ht => ht.homeTask.task_id === task.id)
    }));
    
    return formattedDatabaseTasks;
  };

  // Initialize selectedTasks based on existing active tasks
  useEffect(() => {
    if (!homeId) return;
    // Reset expansion and forms on home change to avoid leakage
    setExpandedTasks(new Set());
    setTaskForms({});
    const activeTaskNames = new Set(activeTasks.map(t => t.title).filter(Boolean));
    setSelectedTasks(activeTaskNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]); // Only depend on homeId to avoid re-renders when activeTasks changes
  // Note: We intentionally don't include activeTasks in dependencies to prevent
  // re-renders that would close open dialogs when task data updates

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
      const existingTask = activeTasksForHome.find(t => t?.title === taskName);
      if (existingTask) {
        setTaskForms(prev => ({
          ...prev,
          [taskName]: {
            assigned_vendor_id: existingTask.homeTask.assigned_vendor_id || '',
            assigned_user_id: existingTask.homeTask.assigned_user_id || '',
            due_date: existingTask.homeTask.due_date || '',
            due_time: '09:00', // Default time since home_tasks doesn't have due_time field yet
            frequency: existingTask.homeTask.recurrence_pattern || '',
            notes: existingTask.homeTask.notes || '',
            is_recurring: existingTask.homeTask.is_recurring || false,
            recurrence_pattern: existingTask.homeTask.recurrence_pattern || null,
            is_active: existingTask.homeTask.is_active !== false
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
            due_time: '09:00',
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

    const toggleTask = (task: any) => {
    const taskName = task.name;
    const existingTask = homeTasksForHome.find(t => t?.title === taskName);
    const isCurrentlySelected = selectedTasks.has(taskName);
    
    if (existingTask && existingTask.homeTask.is_active) {
      // Task is active - toggle it off (visual only, no database)
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskName);
        return newSet;
      });
      
      // Close dropdown if open
      setExpandedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskName);
        return newSet;
      });
    } else {
      // Task is not active or doesn't exist - toggle dropdown
      if (isCurrentlySelected && expandedTasks.has(taskName)) {
        // Task is selected and dropdown is open - close dropdown and deselect
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskName);
          return newSet;
        });
        
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
      } else {
        // Task is not selected or dropdown not open - select and show dropdown
        setSelectedTasks(prev => new Set([...prev, taskName]));
        toggleTaskExpansion(taskName);
      }
    }
  };

    const handleTaskDetailSave = async (task: any) => {
    const taskName = task.name;
    const taskForm = taskForms[taskName];
    const existingTask = homeTasksForHome.find(t => t?.title === taskName);
    
    if (!taskForm) {
      showToast('Task form not found', 'error');
      return;
    }
    
    // Validate homeId is required for new tasks
    if (!existingTask && !homeId) {
      showToast('Please select a home before adding tasks', 'error');
      return;
    }

    // Set loading state
    setSavingTasks(prev => new Set([...prev, taskName]));

    try {
      if (existingTask && !existingTask.homeTask.is_active) {
        // Reactivate existing inactive task
        try {
          const { error } = await supabase
            .from('home_tasks')
            .update({ 
              is_active: true, 
              status: 'pending',
              due_date: taskForm.due_date || null,
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              assigned_vendor_id: taskForm.assigned_vendor_id || null,
              assigned_user_id: taskForm.assigned_user_id || null,
              notes: taskForm.notes,
              next_due: taskForm.due_date || null,
            })
            .eq('id', existingTask.homeTask.id);

          if (error) throw error;

          // Close dropdown
          setExpandedTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskName);
            return newSet;
          });
          
          showToast(`Task "${taskName}" reactivated successfully!`, 'success');
        } catch (error) {
          console.error('Error reactivating task:', error);
          showToast('Failed to reactivate task. Please try again.', 'error');
        }
      } else if (existingTask && existingTask.homeTask.is_active) {
        // Update existing active task
        try {
          const { error } = await supabase
            .from('home_tasks')
            .update({ 
              due_date: taskForm.due_date || null,
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              assigned_vendor_id: taskForm.assigned_vendor_id || null,
              assigned_user_id: taskForm.assigned_user_id || null,
              notes: taskForm.notes,
              next_due: taskForm.due_date || null,
            })
            .eq('id', existingTask.homeTask.id);

          if (error) throw error;

          // Close dropdown
          setExpandedTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(taskName);
            return newSet;
          });
          
          showToast(`Task "${taskName}" updated successfully!`, 'success');
        } catch (error) {
          console.error('Error updating task:', error);
          showToast('Failed to update task. Please try again.', 'error');
        }
      } else {
        // Create new task
        if (task.databaseTask) {
          // This is a template task - activate it for this home with custom settings
          try {
            if (!homeId) {
              showToast('Please select a home before activating tasks', 'error');
              return;
            }
            
            const customSettings = {
              due_date: taskForm.due_date || null,
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              assigned_vendor_id: taskForm.assigned_vendor_id || null,
              assigned_user_id: taskForm.assigned_user_id || null,
              notes: taskForm.notes,
              recurrence_interval: taskForm.recurrence_pattern === 'monthly' ? 1 : undefined,
              recurrence_unit: taskForm.recurrence_pattern === 'monthly' ? 'months' : 
                              taskForm.recurrence_pattern === 'weekly' ? 'weeks' :
                              taskForm.recurrence_pattern === 'daily' ? 'days' :
                              taskForm.recurrence_pattern === 'quarterly' ? 'months' :
                              taskForm.recurrence_pattern === 'annually' ? 'years' : undefined,
            };

            // Close dropdown immediately for better UX
            setExpandedTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskName);
              return newSet;
            });
            
            // Create calendar options if task is recurring
            const calendarOptions = taskForm.is_recurring ? {
              create_calendar_event: true,
              start_time: taskForm.due_date ? `${taskForm.due_date}T09:00:00` : new Date().toISOString(),
              end_time: taskForm.due_date ? `${taskForm.due_date}T10:00:00` : new Date().toISOString(),
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              recurrence_end_date: taskForm.recurrence_pattern ? 
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
            } : undefined;

            await activateTemplateForHome(task.databaseTask.id, homeId, {
              name: taskName,
              category: task.category,
              suggestedFrequency: task.suggestedFrequency,
              customSettings,
              calendarOptions
            });
            
            showToast(`Task "${taskName}" activated successfully!`, 'success');
          } catch (error) {
            console.error('Error activating template task:', error);
            showToast('Failed to activate task. Please try again.', 'error');
          }
        } else if (task.isPreset) {
          // This is a preset task - create it as a new template first, then activate
          try {
            if (!homeId) {
              showToast('Please select a home before activating tasks', 'error');
              return;
            }

            // Create the preset task as a template in the tasks table
            const { data: newTask, error: taskError } = await supabase
              .from('tasks')
              .insert([{
                title: taskName,
                category: task.category,
                task_type: 'preset',
                is_active: true,
                status: 'pending',
              }])
              .select()
              .single();

            if (taskError) throw taskError;

            // Now activate it for this home
            const customSettings = {
              due_date: taskForm.due_date || null,
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              assigned_vendor_id: taskForm.assigned_vendor_id || null,
              assigned_user_id: taskForm.assigned_user_id || null,
              notes: taskForm.notes,
            };

            // Create calendar options if task is recurring
            const calendarOptions = taskForm.is_recurring ? {
              create_calendar_event: true,
              start_time: taskForm.due_date ? `${taskForm.due_date}T09:00:00` : new Date().toISOString(),
              end_time: taskForm.due_date ? `${taskForm.due_date}T10:00:00` : new Date().toISOString(),
              is_recurring: taskForm.is_recurring,
              recurrence_pattern: taskForm.recurrence_pattern,
              recurrence_end_date: taskForm.recurrence_pattern ? 
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
            } : undefined;

            await activateTemplateForHome(newTask.id, homeId, {
              name: taskName,
              category: task.category,
              suggestedFrequency: task.suggestedFrequency,
              customSettings,
              calendarOptions
            });

            // Close dropdown
            setExpandedTasks(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskName);
              return newSet;
            });
            
            showToast(`Preset task "${taskName}" created and activated!`, 'success');
          } catch (error) {
            console.error('Error creating preset task:', error);
            showToast('Failed to create preset task. Please try again.', 'error');
          }
        }
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
    } finally {
      // Remove loading state
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskName);
        return newSet;
      });
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
    const existingTask = activeTasksForHome.find(t => t?.title === task.name);
    const taskForm = taskForms[task.name];
    const assignedVendor = taskForm?.assigned_vendor_id ? 
      vendors.find(v => v.id === taskForm.assigned_vendor_id) : 
      (existingTask?.homeTask.assigned_vendor_id ? vendors.find(v => v.id === existingTask.homeTask.assigned_vendor_id) : null);
    
    // Determine if task is active (either in selectedTasks or existingTask.is_active is true)
    const isTaskActive = isSelected || (existingTask?.homeTask.is_active === true);
    
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
              {/* {task.description && (
                <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
                  {task.description}
                </Text>
              )} */}
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
            {/* Task Name and Description */}
            <View style={styles.taskDetailHeader}>
              {/* <Text style={[styles.taskDetailTitle, { color: colors.text }]}>{task.name}</Text> */}
              {task.description && (
                <Text style={[styles.taskDetailSubtitle, { color: colors.textSecondary }]}>
                  {task.description}
                </Text>
              )}
              {task.databaseTask?.suggested_use && (
                <Text style={styles.suggestedUseText}>
                  Suggested Use: {task.databaseTask.suggested_use}
                </Text>
              )}
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
            
            {/* Start Date and Time */}
            <View style={styles.dateTimeSection}>
              <DatePicker
                label="Start date"
                value={taskForm.due_date}
                placeholder="Select start date"
                onChange={(dateString) => updateTaskForm(task.name, 'due_date', dateString)}
                isOptional={true}
              />
              
              <TimePicker
                label="Start time"
                value={taskForm.due_time}
                placeholder="Select start time"
                onChange={(timeString) => updateTaskForm(task.name, 'due_time', timeString)}
                isOptional={true}
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
              style={[
                styles.saveButton, 
                { 
                  backgroundColor: savingTasks.has(task.name) ? colors.textSecondary : colors.primary,
                  opacity: savingTasks.has(task.name) ? 0.7 : 1
                }
              ]}
              onPress={() => handleTaskDetailSave(task)}
              disabled={savingTasks.has(task.name)}
            >
              <Text style={[styles.saveButtonText, { color: colors.background }]}>
                {savingTasks.has(task.name) ? 'Saving...' : 'Save'}
              </Text>
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
                  description: task.description,
                  suggestedFrequency: task.suggestedFrequency,
                  category: task.category || 'General',
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
                  name: task.homeTask.title,
                  suggestedFrequency: task.homeTask.recurrence_pattern ? `Every ${task.homeTask.recurrence_pattern}` : 'One-time',
                  category: task.homeTask.category || 'Custom',
                  isPreset: false,
                  databaseTask: task.homeTask
                }, 'Custom Tasks', index))}
              </View>
            )}
          </View>
        )}

        {/* Repairs Section */}
        <View>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              { backgroundColor: colors.surface },
              expandedCategory === 'Repairs' && { backgroundColor: colors.primary }
            ]}
            onPress={() => toggleCategory('Repairs')}
          >
            <Text style={[
              styles.categoryCardTitle,
              { 
                color: expandedCategory === 'Repairs' ? colors.background : colors.text 
              }
            ]}>
              🔧 Repairs ({repairs.length})
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={expandedCategory === 'Repairs' ? colors.background : colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {expandedCategory === 'Repairs' && (
            <View style={styles.taskCardsContainer}>
              {repairs.map((repair) => (
                <TouchableOpacity
                  key={repair.id}
                  style={[styles.repairProjectItem, { backgroundColor: colors.background }]}
                  onPress={() => router.push(`/(tabs)/(tasks)/repair/${repair.id}` as any)}
                >
                  <View style={styles.repairProjectInfo}>
                    <Text style={[styles.repairProjectTitle, { color: colors.text }]}>
                      {repair.title}
                    </Text>
                    <Text style={[styles.repairProjectStatus, { color: colors.textSecondary }]}>
                      Status: {repair.status}
                    </Text>
                    {repair.vendor_id && (
                      <Text style={[styles.repairProjectVendor, { color: colors.textSecondary }]}>
                        Vendor: {getVendorDisplayText(repair, vendors as Vendor[])}
                      </Text>
                    )}
                    {repair.reminder_date && (
                      <Text style={[styles.repairProjectDue, { color: colors.textSecondary }]}>
                        Due: {new Date(repair.reminder_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.addRepairProjectButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(tabs)/(tasks)/add-repair?homeId=${homeId}` as any)}
              >
                <Ionicons name="add" size={20} color={colors.background} />
                <Text style={[styles.addRepairProjectText, { color: colors.background }]}>
                  Add Repair
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Projects Section */}
        <View>
          <TouchableOpacity
            style={[
              styles.categoryCard,
              { backgroundColor: colors.surface },
              expandedCategory === 'Projects' && { backgroundColor: colors.primary }
            ]}
            onPress={() => toggleCategory('Projects')}
          >
            <Text style={[
              styles.categoryCardTitle,
              { 
                color: expandedCategory === 'Projects' ? colors.background : colors.text 
              }
            ]}>
              🏗️ Projects ({projects.length})
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={expandedCategory === 'Projects' ? colors.background : colors.textSecondary} 
            />
          </TouchableOpacity>
          {expandedCategory === 'Projects' && (
            <View style={styles.taskCardsContainer}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.repairProjectItem, { backgroundColor: colors.background }]}
                  onPress={() => router.push(`/(tabs)/(tasks)/project/${project.id}` as any)}
                >
                  <View style={styles.repairProjectInfo}>
                    <Text style={[styles.repairProjectTitle, { color: colors.text }]}>
                      {project.title}
                    </Text>
                    <Text style={[styles.repairProjectStatus, { color: colors.textSecondary }]}>
                      Status: {project.status}
                    </Text>
                    {(project.vendor_ids && project.vendor_ids.length > 0) && (
                      <Text style={[styles.repairProjectVendor, { color: colors.textSecondary }]}>
                        Vendor: {getVendorDisplayText(project, vendors as Vendor[])}
                      </Text>
                    )}
                    {project.estimated_budget && (
                      <Text style={[styles.repairProjectBudget, { color: colors.textSecondary }]}>
                        Budget: ${project.estimated_budget.toLocaleString()}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.addRepairProjectButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push(`/(tabs)/(tasks)/add-project?homeId=${homeId}` as any)}
              >
                <Ionicons name="add" size={20} color={colors.background} />
                <Text style={[styles.addRepairProjectText, { color: colors.background }]}>
                  Add Project
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
       
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
              <TouchableOpacity
                style={[styles.vendorItem, { borderBottomColor: colors.border }]}
                onPress={() => handleVendorSelection('')}
              >
                <Text style={[styles.vendorName, { color: colors.text }]}>
                  None
                </Text>
              </TouchableOpacity>
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
    borderRadius: 15,
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
    fontSize: 16,
  },
  suggestedUseText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
    color: "teal",
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
  dateTimeSection: {
    marginBottom: 16,
    gap: 12,
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
  repairProjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  repairProjectInfo: {
    flex: 1,
    marginRight: 12,
  },
  repairProjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  repairProjectStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectVendor: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectDue: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectBudget: {
    fontSize: 14,
    marginBottom: 2,
  },
  addRepairProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addRepairProjectText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 