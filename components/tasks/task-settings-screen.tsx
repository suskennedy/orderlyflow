import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { useProjectsStore } from '../../lib/stores/projectsStore';
import { useRepairsStore } from '../../lib/stores/repairsStore';
import { useTasksStore } from '../../lib/stores/tasksStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { supabase } from '../../lib/supabase';
import { getVendorDisplayText } from '../../lib/utils/vendorDisplayUtils';
import { Vendor } from '../../types/database';



import CategorySection from './settings/CategorySection';
import { EMPTY_ARRAY, QUICK_OPTIONS } from './settings/constants';
import { styles as settingsStyles } from './settings/styles';
import TaskDetailForm from './settings/TaskDetailForm';
import TaskItem from './settings/TaskItem';

interface TaskSettingsScreenProps {
  homeId?: string;
}

export default function TaskSettingsScreen({ homeId }: TaskSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const templateTasks = useTasksStore(state => state.templateTasks);
  const fetchTemplateTasks = useTasksStore(state => state.fetchTemplateTasks);
  const homeTasksByHome = useTasksStore(state => state.homeTasksByHome);
  const currentHomeId = useTasksStore(state => state.currentHomeId);
  const setCurrentHomeId = useTasksStore(state => state.setCurrentHomeId);
  const fetchHomeTasks = useTasksStore(state => state.fetchHomeTasks);
  const activateTemplateForHome = useTasksStore(state => state.activateTemplateForHome);
  const homeTasks = currentHomeId ? (homeTasksByHome[currentHomeId] || EMPTY_ARRAY) : [];
  const vendors = useVendorsStore(state => state.vendors);
  const repairsByHome = useRepairsStore(state => state.repairsByHome);
  const fetchRepairs = useRepairsStore(state => state.fetchRepairs);
  const setRepairs = useRepairsStore(state => state.setRepairs);
  const projectsByHome = useProjectsStore(state => state.projectsByHome);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const setProjects = useProjectsStore(state => state.setProjects);
  const updateProject = useProjectsStore(state => state.updateProject);
  const updateRepair = useRepairsStore(state => state.updateRepair);
  const repairs = currentHomeId ? (repairsByHome[currentHomeId] || EMPTY_ARRAY) : [];
  const projects = currentHomeId ? (projectsByHome[currentHomeId] || EMPTY_ARRAY) : [];
  const { showToast } = useToast();
  const { user } = useAuth();

  // Set current home when component mounts - use ref to prevent loops
  const lastHomeIdRef = React.useRef<string | undefined>(undefined);
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (!homeId || homeId === lastHomeIdRef.current) return;

    lastHomeIdRef.current = homeId;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Fetch templates and current home regardless of user ID availability
      fetchTemplateTasks();
      setCurrentHomeId(homeId);
      fetchHomeTasks(homeId);

      if (user?.id) {
        fetchRepairs(homeId, user.id);
        fetchProjects(homeId, user.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId, user?.id]); // Only depend on homeId and user?.id - functions are stable

  // Real-time subscriptions for repairs
  const handleRepairChange = useCallback((payload: any) => {
    const repairHomeId = payload.new?.home_id || payload.old?.home_id;
    if (repairHomeId === currentHomeId && user?.id) {
      fetchRepairs(repairHomeId, user.id);
    }
  }, [currentHomeId, user?.id, fetchRepairs]);

  useRealTimeSubscription(
    { table: 'repairs', event: '*' },
    handleRepairChange
  );

  // Real-time subscriptions for projects
  const handleProjectChange = useCallback((payload: any) => {
    const projectHomeId = payload.new?.home_id || payload.old?.home_id;
    if (projectHomeId === currentHomeId && user?.id) {
      fetchProjects(projectHomeId, user.id);
    }
  }, [currentHomeId, user?.id, fetchProjects]);

  useRealTimeSubscription(
    { table: 'projects', event: '*' },
    handleProjectChange
  );

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [currentTaskForVendor, setCurrentTaskForVendor] = useState<any>(null);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState<string | null>(null);

  // Task detail form state - one form per task
  const [taskForms, setTaskForms] = useState<{
    [key: string]: {
      assigned_vendor_id: string;
      assigned_user_id: string;
      due_date: string;
      due_time: string;
      frequency: string;
      notes: string;
      is_recurring: boolean;
      recurrence_pattern: string | null;
      recurrence_end_date: string | null;
      is_active: boolean;
    }
  }>({});

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

  // Dynamically derive categories from template tasks and existing items
  const dynamicCategories = useMemo(() => {
    const fixedCategories = ['Deep Cleaning', 'Health + Safety', 'Home Maintenance', 'Repairs', 'Projects'];
    const categories = new Set<string>(fixedCategories);

    allTemplateTasks.forEach(task => {
      if (task.category && !fixedCategories.includes(task.category)) {
        categories.add(task.category);
      }
    });

    return Array.from(categories);
  }, [allTemplateTasks]);

  // Get only database tasks for each category (no preset tasks)
  const getCombinedTasksForCategory = (categoryName: string) => {
    const databaseTasks = getTasksForCategory(categoryName);

    // Convert database tasks to the format expected by TaskItem
    const formattedDatabaseTasks = databaseTasks.map(task => {
      const existingTask = activeTasksForHome.find(ht => ht.homeTask.task_id === task.id);

      const assignedVendor = existingTask?.homeTask.assigned_vendor_id ?
        vendors.find(v => v.id === existingTask.homeTask.assigned_vendor_id) : null;

      return {
        name: task.title,
        description: task.description, // Include description from database
        suggestedFrequency: task.frequency || 'One-time',
        category: task.category || 'General',
        isPreset: false,
        databaseTask: task,
        isActiveForHome: existingTask?.homeTask.is_active === true,
        dueDate: existingTask?.homeTask.due_date,
        assignedVendor: assignedVendor,
      };
    });

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
            recurrence_end_date: (existingTask.homeTask as any).recurrence_end_date || '',
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
            recurrence_end_date: '',
            is_active: true
          }
        }));
      }
    }
    setExpandedTasks(newExpandedTasks);
  };

  const toggleTask = async (task: any) => {
    const taskName = task.name;
    const existingTask = homeTasksForHome.find(t => t?.title === taskName);
    const isCurrentlySelected = selectedTasks.has(taskName);

    if (existingTask && existingTask.homeTask.is_active) {
      // Task is active - toggle it off in database
      try {
        const { error } = await supabase
          .from('home_tasks')
          .update({ is_active: false })
          .eq('id', existingTask.homeTask.id);

        if (error) throw error;

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

        if (homeId) await fetchHomeTasks(homeId);
        showToast(`Task "${taskName}" deactivated`, 'success');
      } catch (error) {
        console.error('Error deactivating task:', error);
        showToast('Failed to deactivate task', 'error');
      }
    } else if (existingTask && !existingTask.homeTask.is_active) {
      // Task exists but is inactive - reactivate it
      try {
        const { error } = await supabase
          .from('home_tasks')
          .update({ is_active: true, status: 'pending' })
          .eq('id', existingTask.homeTask.id);

        if (error) throw error;

        setSelectedTasks(prev => new Set([...prev, taskName]));
        if (homeId) await fetchHomeTasks(homeId);
        showToast(`Task "${taskName}" reactivated`, 'success');
      } catch (error) {
        console.error('Error reactivating task:', error);
        showToast('Failed to reactivate task', 'error');
      }
    } else {
      // Task doesn't exist - open dropdown to allow configuration before first save
      if (isCurrentlySelected && expandedTasks.has(taskName)) {
        // Deselect if already expanded
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
      } else {
        setSelectedTasks(prev => new Set([...prev, taskName]));
        toggleTaskExpansion(taskName);
        showToast('Configure task details and save to activate', 'info');
      }
    }
  };

  const toggleRepair = async (repair: any) => {
    const isCurrentlyActive = repair.is_active !== false;
    try {
      await updateRepair(currentHomeId || '', repair.id, { is_active: !isCurrentlyActive });
      showToast(`Repair "${repair.title}" ${!isCurrentlyActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling repair:', error);
      showToast('Failed to update repair status', 'error');
    }
  };

  const toggleProject = async (project: any) => {
    const isCurrentlyActive = project.is_active !== false;
    try {
      await updateProject(currentHomeId || '', project.id, { is_active: !isCurrentlyActive });
      showToast(`Project "${project.title}" ${!isCurrentlyActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      console.error('Error toggling project:', error);
      showToast('Failed to update project status', 'error');
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
              recurrence_end_date: taskForm.recurrence_end_date || null,
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

          if (homeId) {
            await fetchHomeTasks(homeId);
          }
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
              recurrence_end_date: taskForm.recurrence_end_date || null,
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

          if (homeId) {
            await fetchHomeTasks(homeId);
          }
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

            await activateTemplateForHome(task.databaseTask.id, homeId, user?.id || '', {
              customSettings: customSettings,
              calendarOptions: calendarOptions
            });

            if (homeId) {
              await fetchHomeTasks(homeId);
            }
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

            await activateTemplateForHome(newTask.id, homeId, user?.id || '', {
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

            if (homeId) {
              await fetchHomeTasks(homeId);
            }
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


  return (
    <View style={[settingsStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[settingsStyles.header, {
        backgroundColor: colors.background,
        paddingTop: insets.top + 20
      }]}>
        <TouchableOpacity
          style={settingsStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[settingsStyles.headerTitle, { color: colors.text }]}>Reminders</Text>
        <TouchableOpacity
          style={[settingsStyles.quickOptionsButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(homeId ? `/(tabs)/(home)/${homeId}/tasks/add` : '/(tabs)/(tasks)' as any)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={settingsStyles.scrollView}
        contentContainerStyle={[settingsStyles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Cards with Inline Task Sections */}
        {dynamicCategories.map((category) => {
          const templateTasksForCat = getCombinedTasksForCategory(category);
          const extraItems = category === 'Repairs' ? repairs.length : category === 'Projects' ? projects.length : 0;
          const totalItems = templateTasksForCat.length + extraItems;
          const activeTemplateCount = templateTasksForCat.filter(t => t.isActiveForHome).length;
          const activeExtraCount = category === 'Repairs'
            ? repairs.filter((r: any) => r.is_active !== false).length
            : category === 'Projects'
              ? projects.filter((p: any) => p.is_active !== false).length
              : 0;
          const totalActive = activeTemplateCount + activeExtraCount;

          let addLabel = `Add ${category.slice(0, -1) || 'Task'}`;
          if (category === 'Repairs') addLabel = 'Add Repair';
          else if (category === 'Projects') addLabel = 'Add Project';

          return (
            <CategorySection
              key={category}
              category={category}
              taskCount={totalItems}
              activeCount={totalActive}
              isExpanded={expandedCategory === category}
              onToggle={() => toggleCategory(category)}
              onAdd={() => {
                const targetHomeId = homeId || currentHomeId;
                if (category === 'Repairs') {
                  router.push(`/(tabs)/(tasks)/add-repair?homeId=${targetHomeId}` as any);
                } else if (category === 'Projects') {
                  router.push(`/(tabs)/(tasks)/add-project?homeId=${targetHomeId}` as any);
                } else {
                  router.push(targetHomeId ? `/(tabs)/(home)/${targetHomeId}/tasks/add?category=${category}` : '/(tabs)/(tasks)' as any);
                }
              }}
              addLabel={addLabel}
              colors={colors}
            >
              {templateTasksForCat.map((task, index) => (
                <TaskItem
                  key={`${task.name}-${index}`}
                  task={task}
                  isExpanded={expandedTasks.has(task.name)}
                  isSelected={selectedTasks.has(task.name)}
                  onToggle={() => toggleTask(task)}
                  onExpand={() => toggleTaskExpansion(task.name)}
                  renderDetailForm={() => {
                    const assignedVendor = vendors.find(v => v.id === taskForms[task.name]?.assigned_vendor_id);
                    return (
                      <TaskDetailForm
                        task={task}
                        taskForm={taskForms[task.name]}
                        colors={colors}
                        assignedVendor={assignedVendor}
                        showRecurrenceOptions={showRecurrenceOptions === task.name}
                        onOpenVendorModal={() => openVendorModal(task)}
                        onUpdateForm={(field: string, value: any) => {
                          setTaskForms(prev => ({
                            ...prev,
                            [task.name]: { ...prev[task.name], [field]: value }
                          }));
                        }}
                        onToggleRecurrence={() => handleRecurrenceToggle(task.name)}
                        onToggleRecurrenceDropdown={() => setShowRecurrenceOptions(showRecurrenceOptions === task.name ? null : task.name)}
                        onSelectRecurrence={(value: string | null) => {
                          setTaskForms(prev => ({
                            ...prev,
                            [task.name]: { ...prev[task.name], recurrence_pattern: value }
                          }));
                          setShowRecurrenceOptions(null);
                        }}
                        onSave={() => handleTaskDetailSave(task)}
                      />
                    );
                  }}
                  colors={colors}
                />
              ))}

              {/* Render Custom Repairs inline */}
              {category === 'Repairs' && repairs.map((repair: any) => (
                <TaskItem
                  key={`repair-${repair.id}`}
                  task={{
                    name: repair.title,
                    suggestedFrequency: 'Repair',
                    category: 'Repairs',
                    isPreset: false,
                    databaseTask: repair,
                    dueDate: repair.reminder_date,
                    assignedVendor: vendors.find(v => v.id === repair.vendor_id)
                  }}
                  isExpanded={expandedTasks.has(`repair-${repair.id}`)}
                  isSelected={repair.is_active !== false}
                  onToggle={() => toggleRepair(repair)}
                  onExpand={() => {
                    const newExpanded = new Set(expandedTasks);
                    if (newExpanded.has(`repair-${repair.id}`)) {
                      newExpanded.delete(`repair-${repair.id}`);
                    } else {
                      newExpanded.add(`repair-${repair.id}`);
                    }
                    setExpandedTasks(newExpanded);
                  }}
                  renderDetailForm={() => (
                    <TouchableOpacity
                      style={[settingsStyles.repairProjectItem, { backgroundColor: colors.background, marginTop: 8 }]}
                      onPress={() => router.push(`/(tabs)/(tasks)/repair/${repair.id}` as any)}
                    >
                      <View style={settingsStyles.repairProjectInfo}>
                        <Text style={[settingsStyles.repairProjectStatus, { color: colors.textSecondary }]}>
                          Status: {repair.status}
                        </Text>
                        {repair.vendor_id && (
                          <Text style={[settingsStyles.repairProjectVendor, { color: colors.textSecondary }]}>
                            Vendor: {getVendorDisplayText(repair, vendors as Vendor[])}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Edit Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  )}
                  colors={colors}
                />
              ))}

              {/* Render Custom Projects inline */}
              {category === 'Projects' && projects.map((project: any) => (
                <TaskItem
                  key={`project-${project.id}`}
                  task={{
                    name: project.title,
                    suggestedFrequency: 'Project',
                    category: 'Projects',
                    isPreset: false,
                    databaseTask: project,
                    dueDate: project.start_date,
                    assignedVendor: project.vendor_ids && project.vendor_ids.length > 0 ?
                      vendors.find(v => project.vendor_ids.includes(v.id)) : null
                  }}
                  isExpanded={expandedTasks.has(`project-${project.id}`)}
                  isSelected={project.is_active !== false}
                  onToggle={() => toggleProject(project)}
                  onExpand={() => {
                    const newExpanded = new Set(expandedTasks);
                    if (newExpanded.has(`project-${project.id}`)) {
                      newExpanded.delete(`project-${project.id}`);
                    } else {
                      newExpanded.add(`project-${project.id}`);
                    }
                    setExpandedTasks(newExpanded);
                  }}
                  renderDetailForm={() => (
                    <TouchableOpacity
                      style={[settingsStyles.repairProjectItem, { backgroundColor: colors.background, marginTop: 8 }]}
                      onPress={() => router.push(`/(tabs)/(tasks)/project/${project.id}` as any)}
                    >
                      <View style={settingsStyles.repairProjectInfo}>
                        <Text style={[settingsStyles.repairProjectStatus, { color: colors.textSecondary }]}>
                          Status: {project.status}
                        </Text>
                        {(project.vendor_ids && project.vendor_ids.length > 0) && (
                          <Text style={[settingsStyles.repairProjectVendor, { color: colors.textSecondary }]}>
                            Vendor: {getVendorDisplayText(project, vendors as Vendor[])}
                          </Text>
                        )}
                        {project.estimated_budget && (
                          <Text style={[settingsStyles.repairProjectBudget, { color: colors.textSecondary }]}>
                            Budget: ${project.estimated_budget.toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Edit Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  )}
                  colors={colors}
                />
              ))}
            </CategorySection>
          );
        })}

        {/* Custom Reminders Section */}
        {customTasks.length > 0 && (
          <CategorySection
            category={`Custom Reminders (${customTasks.length})`}
            isExpanded={expandedCategory === 'Custom Reminders'}
            onToggle={() => toggleCategory('Custom Reminders')}
            colors={colors}
          >
            {customTasks.map((task, index) => {
              const assignedVendor = task.homeTask.assigned_vendor_id ?
                vendors.find(v => v.id === task.homeTask.assigned_vendor_id) : null;

              return (
                <TaskItem
                  key={`custom-${task.homeTask.id}`}
                  task={{
                    name: task.homeTask.title,
                    suggestedFrequency: task.homeTask.recurrence_pattern ? `Every ${task.homeTask.recurrence_pattern}` : 'One-time',
                    category: task.homeTask.category || 'Custom',
                    isPreset: false,
                    databaseTask: task.homeTask,
                    dueDate: task.homeTask.due_date,
                    assignedVendor: assignedVendor
                  }}
                  isExpanded={expandedTasks.has(task.homeTask.title)}
                  isSelected={selectedTasks.has(task.homeTask.title)}
                  onToggle={() => toggleTask({ name: task.homeTask.title, databaseTask: task.homeTask })}
                  onExpand={() => toggleTaskExpansion(task.homeTask.title)}
                  renderDetailForm={() => {
                    const assignedVendorForm = vendors.find(v => v.id === taskForms[task.homeTask.title]?.assigned_vendor_id);
                    return (
                      <TaskDetailForm
                        task={{ name: task.homeTask.title, databaseTask: task.homeTask }}
                        taskForm={taskForms[task.homeTask.title]}
                        colors={colors}
                        assignedVendor={assignedVendorForm}
                        showRecurrenceOptions={showRecurrenceOptions === task.homeTask.title}
                        onOpenVendorModal={() => openVendorModal({ name: task.homeTask.title, databaseTask: task.homeTask })}
                        onUpdateForm={(field: string, value: any) => {
                          setTaskForms(prev => ({
                            ...prev,
                            [task.homeTask.title]: { ...prev[task.homeTask.title], [field]: value }
                          }));
                        }}
                        onToggleRecurrence={() => handleRecurrenceToggle(task.homeTask.title)}
                        onToggleRecurrenceDropdown={() => setShowRecurrenceOptions(showRecurrenceOptions === task.homeTask.title ? null : task.homeTask.title)}
                        onSelectRecurrence={(value: string | null) => {
                          setTaskForms(prev => ({
                            ...prev,
                            [task.homeTask.title]: { ...prev[task.homeTask.title], recurrence_pattern: value }
                          }));
                          setShowRecurrenceOptions(null);
                        }}
                        onSave={() => handleTaskDetailSave({ name: task.homeTask.title, databaseTask: task.homeTask })}
                      />
                    );
                  }}
                  colors={colors}
                />
              );
            })}
          </CategorySection>
        )}

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
          style={settingsStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickOptions(false)}
        >
          <View style={[settingsStyles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={settingsStyles.modalHeader}>
              <Text style={[settingsStyles.modalTitle, { color: colors.text }]}>Quick Options</Text>
              <TouchableOpacity onPress={() => setShowQuickOptions(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={settingsStyles.quickOptionsList}>
              {QUICK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[settingsStyles.quickOptionItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleQuickOption(option)}
                >
                  <Text style={[settingsStyles.quickOptionText, { color: colors.text }]}>
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
          style={settingsStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVendorModal(false)}
        >
          <View style={[settingsStyles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={settingsStyles.modalHeader}>
              <Text style={[settingsStyles.modalTitle, { color: colors.text }]}>Select Vendor</Text>
              <TouchableOpacity onPress={() => setShowVendorModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={settingsStyles.vendorList}>

              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[settingsStyles.vendorItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleVendorSelection(vendor.id)}
                  >
                    <Text style={[settingsStyles.vendorName, { color: colors.text }]}>
                      {vendor.name}
                    </Text>
                    {vendor.category && (
                      <Text style={[settingsStyles.vendorCategory, { color: colors.textSecondary }]}>
                        {vendor.category}
                      </Text>
                    )}
                  </TouchableOpacity>

                ))


              ) : (
                <View style={settingsStyles.emptyVendors}>
                  <Text style={[settingsStyles.emptyVendorsText, { color: colors.textSecondary }]}>
                    No vendors available. Add vendors first.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[settingsStyles.vendorItem, { borderBottomColor: colors.border }]}
                onPress={() => handleVendorSelection('')}
              >
                <Text style={[settingsStyles.vendorName, { color: colors.text }]}>
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

