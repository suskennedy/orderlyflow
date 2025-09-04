import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Database } from '../../supabase-types';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Use database types for consistency
type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type HomeTask = Database['public']['Tables']['home_tasks']['Row'];
type HomeTaskInsert = Database['public']['Tables']['home_tasks']['Insert'];
type HomeTaskUpdate = Database['public']['Tables']['home_tasks']['Update'];
// REMOVED: Calendar event types are no longer needed here
// type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert'];
// type HomeCalendarEventInsert = Database['public']['Tables']['home_calendar_events']['Insert'];

// Extended interface for home tasks that can be either template-based or preset
interface ExtendedHomeTask extends HomeTask {
  // For template tasks, this will contain the full task data
  templateTask?: Task;
  // For preset tasks, this will contain the preset configuration
  presetConfig?: {
    name: string;
    suggestedFrequency: string;
    category: string;
  };
}

interface TasksContextType {
  // Template tasks (available to all homes)
  templateTasks: Task[];
  // Home-specific active tasks
  homeTasks: ExtendedHomeTask[];
  loading: boolean;
  refreshing: boolean;
  currentHomeId: string | null;
  
  // Core task operations
  addTask: (taskData: TaskInsert) => Promise<Task>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, completionData: any) => Promise<void>;
  
  // Home-specific operations
  setCurrentHome: (homeId: string | null) => void;
  fetchTasksForHome: (homeId: string) => Promise<void>;
  fetchCompletedTasksForHome: (homeId: string) => Promise<void>;
  getTaskCountsForHome: (homeId: string) => Promise<{ active: number; completed: number; total: number }>;
  activateTaskForHome: (taskId: string, homeId: string, presetTaskData?: {
    name: string;
    category: string;
    suggestedFrequency: string;
    customSettings?: any;
  }) => Promise<void>;
  deactivateTaskForHome: (taskId: string, homeId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  // REMOVED: createCalendarEventForTask is no longer needed here
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider = ({ children }: TasksProviderProps) => {
  const { user } = useAuth();
  const [templateTasks, setTemplateTasks] = useState<Task[]>([]);
  const [homeTasks, setHomeTasks] = useState<ExtendedHomeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);

  // Helper function to create calendar events for a task and link to home
  // REMOVED: Calendar events should only be fetched in calendar view, not here
  // This prevents unnecessary database operations and improves performance

  // Fetch all template tasks (available to all homes)
  const fetchTemplateTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setTemplateTasks(data || []);
    } catch (error) {
      console.error('Failed to fetch template tasks:', error);
    }
  }, []);

  // Fetch all home tasks for display purposes (used in home selector)
  const fetchAllHomeTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all home tasks - no need to join with tasks table anymore
      // since home_tasks now contains all the necessary data
      const { data, error } = await supabase
        .from('home_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all home tasks:', error);
        throw error;
      }
      
      // Transform the data to include template task info if available
      const extendedHomeTasks: ExtendedHomeTask[] = (data || []).map(homeTask => {
        if (homeTask.task_id) {
          // This is a template-based task, find the template
          const templateTask = templateTasks.find(t => t.id === homeTask.task_id);
          return {
            ...homeTask,
            templateTask
          };
        } else {
          // This is a preset task - for now, use basic properties
          // Once the database is updated, these will be available
          return {
            ...homeTask,
            presetConfig: {
              name: 'Preset Task',
              suggestedFrequency: 'Custom',
              category: 'General'
            }
          };
        }
      });
      
      setHomeTasks(extendedHomeTasks);
      
    } catch (error) {
      console.error('Failed to fetch all home tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [templateTasks]);

  // Fetch completed tasks for a specific home (separate query for better performance)
  const fetchCompletedTasksForHome = useCallback(async (homeId: string) => {
    if (!homeId) return;

    try {
      // Fetch completed tasks with proper sorting at database level
      const { data, error } = await supabase
        .from('home_tasks')
        .select('*')
        .eq('home_id', homeId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false, nullsFirst: false }); // Most recent first

      if (error) {
        console.error('Error fetching completed tasks for home:', error);
        return;
      }

      // Update homeTasks with completed tasks - prevent unnecessary updates
      setHomeTasks(current => {
        const existingCompletedTasks = current.filter(ht => ht.home_id === homeId && ht.status === 'completed');
        const newCompletedTasks = data || [];
        
        // Only update if the data actually changed
        if (existingCompletedTasks.length === newCompletedTasks.length &&
            existingCompletedTasks.every((existing, index) => existing.id === newCompletedTasks[index]?.id)) {
          return current; // No change needed
        }
        
        const activeTasks = current.filter(ht => ht.home_id === homeId && ht.status !== 'completed');
        return [...activeTasks, ...newCompletedTasks];
      });
      
    } catch (error) {
      console.error('Failed to fetch completed tasks for home:', error);
    }
  }, []);

  // Fast fetch tasks for a specific home (from home_tasks table)
  const fetchTasksForHome = useCallback(async (homeId: string) => {
    if (!homeId) return;

    try {
      setLoading(true);
      
      // Fetch ALL home-specific tasks in one query - much faster
      const { data, error } = await supabase
        .from('home_tasks')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false }); // Simple sorting

      if (error) {
        console.error('Error fetching tasks for home:', error);
        throw error;
      }
      
      // Direct state update - no complex comparisons
      setHomeTasks(current => {
        const otherHomeTasks = current.filter(ht => ht.home_id !== homeId);
        return [...otherHomeTasks, ...(data || [])];
      });
      
      setCurrentHomeId(homeId);
      
    } catch (error) {
      console.error('Failed to fetch tasks for home:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get task counts for a specific home
  const getTaskCountsForHome = useCallback(async (homeId: string) => {
    if (!homeId) return { active: 0, completed: 0, total: 0 };

    try {
      // Get all tasks linked to this home by joining home_tasks with tasks
      const { data: homeTaskData, error } = await supabase
        .from('home_tasks')
        .select(`
          *,
          tasks (*)
        `)
        .eq('home_id', homeId);

      if (error) throw error;

      const total = homeTaskData?.length || 0;
      const active = homeTaskData?.filter(ht => ht.tasks?.is_active !== false && ht.tasks?.status !== 'completed').length || 0;
      const completed = homeTaskData?.filter(ht => ht.tasks?.status === 'completed').length || 0;

      return { active, completed, total };
    } catch (error) {
      console.error('Error getting task counts for home:', error);
      return { active: 0, completed: 0, total: 0 };
    }
  }, []);

  // Add a new task (creates template task)
  const addTask = useCallback(async (taskData: TaskInsert): Promise<Task> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const payload: TaskInsert = {
        ...taskData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTemplateTasks(current => [data, ...current]);

      // If this task is for a specific home, activate it for that home
      if (taskData.family_account_id) {
        // This would be a custom task for a specific family
        // You might want to handle this differently
      }

      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [user]);

  // Update a task
  const updateTask = useCallback(async (taskId: string, updates: TaskUpdate) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTemplateTasks(current => 
        current.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      // Delete from home_tasks first
      await supabase
        .from('home_tasks')
        .delete()
        .eq('task_id', taskId);

      // REMOVED: Calendar event deletion is now handled in CalendarView
      // This prevents unnecessary database operations and improves performance

      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      // Update local state
      setTemplateTasks(current => current.filter(task => task.id !== taskId));
      setHomeTasks(current => current.filter(ht => ht.task_id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, []);

  // Complete a task
  const completeTask = useCallback(async (taskId: string, completionData: any) => {
    try {
      const updates: TaskUpdate = {
          status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionData.notes,
        completed_by_type: completionData.completed_by_type,
        completed_by_vendor_id: completionData.completed_by_vendor_id,
        completed_by_user_id: completionData.completed_by_user_id,
        completed_by_external_name: completionData.completed_by_external_name,
        is_active: false, // Deactivate when completed
      };

      await updateTask(taskId, updates);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }, [updateTask]);

  // Fast activate a template task for a specific home
  const activateTaskForHome = useCallback(async (taskId: string, homeId: string, presetTaskData?: {
    name: string;
    category: string;
    suggestedFrequency: string;
    customSettings?: any;
  }) => {
    try {
      // Get the template task details
      const templateTask = templateTasks.find(t => t.id === taskId);
      if (!templateTask) {
        throw new Error('Template task not found');
      }

      // Create minimal home task entry - only essential fields for speed
      const homeTaskData: HomeTaskInsert = {
        home_id: homeId,
        task_id: taskId,
        title: templateTask.title,
        description: templateTask.description,
        category: templateTask.category,
        priority: templateTask.priority,
        status: 'pending',
        due_date: presetTaskData?.customSettings?.due_date || templateTask.due_date,
        is_recurring: presetTaskData?.customSettings?.is_recurring || templateTask.is_recurring,
        recurrence_pattern: presetTaskData?.customSettings?.recurrence_pattern || templateTask.recurrence_pattern,
        notes: presetTaskData?.customSettings?.notes || templateTask.notes,
        next_due: presetTaskData?.customSettings?.due_date || templateTask.next_due,
        is_active: true,
        assigned_vendor_id: presetTaskData?.customSettings?.assigned_vendor_id || null,
        assigned_user_id: presetTaskData?.customSettings?.assigned_user_id || null,
        task_type: templateTask.task_type,
        recurrence_interval: presetTaskData?.customSettings?.recurrence_interval || templateTask.recurrence_interval,
        recurrence_unit: presetTaskData?.customSettings?.recurrence_unit || templateTask.recurrence_unit,
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert([homeTaskData])
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setHomeTasks(current => [...current, data]);
      
    } catch (error) {
      console.error('Error activating task for home:', error);
      throw error;
    }
  }, [templateTasks]);

  // Deactivate a task for a specific home (don't remove, just set inactive)
  const deactivateTaskForHome = useCallback(async (taskId: string, homeId: string) => {
    try {
      // Update task to be inactive instead of deleting it
      const { error } = await supabase
        .from('home_tasks')
        .update({ is_active: false, status: 'inactive' })
        .eq('task_id', taskId)
        .eq('home_id', homeId);

      if (error) throw error;
      
      // Update local state immediately for instant UI feedback
      setHomeTasks(current => 
        current.map(ht => 
          (ht.task_id === taskId && ht.home_id === homeId) 
            ? { ...ht, is_active: false, status: 'inactive' }
            : ht
        )
      );
      
    } catch (error) {
      console.error('Error deactivating task for home:', error);
      throw error;
    }
  }, []);

  // Set current home
  const setCurrentHome = useCallback((homeId: string | null) => {
    setCurrentHomeId(homeId);
    if (homeId) {
      fetchTasksForHome(homeId);
    } else {
      setHomeTasks([]);
    }
  }, [fetchTasksForHome]);

  // Refresh tasks for current home
  const onRefresh = useCallback(async () => {
    if (!currentHomeId) return;
    
    setRefreshing(true);
    try {
      await fetchTasksForHome(currentHomeId);
    } finally {
      setRefreshing(false);
    }
  }, [currentHomeId, fetchTasksForHome]);

  // Load template tasks on mount
  React.useEffect(() => {
    fetchTemplateTasks();
  }, [fetchTemplateTasks]);

  // Load all home tasks on mount
  React.useEffect(() => {
    fetchAllHomeTasks();
  }, [fetchAllHomeTasks]);

  // Real-time subscription for home_tasks
  useRealTimeSubscription(
    { 
      table: 'home_tasks',
      filter: currentHomeId ? `home_id=eq.${currentHomeId}` : undefined
    }, 
    () => {
      if (currentHomeId) {
        fetchTasksForHome(currentHomeId);
      }
    }
  );

  const value = {
    // State
    templateTasks,
    homeTasks,
    currentHomeId,
    loading,
    refreshing,
    
    // Functions
    fetchTemplateTasks,
    fetchTasksForHome,
    fetchCompletedTasksForHome,
    fetchAllHomeTasks,
    getTaskCountsForHome,
    addTask,
    updateTask,
    deleteTask,
    completeTask: async (taskId: string, completionData: any) => {
      // Implementation for completing a task
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completion_notes: completionData.notes,
            completed_by_type: completionData.completed_by_type,
            completed_by_user_id: completionData.completed_by_user_id,
            completed_by_vendor_id: completionData.completed_by_vendor_id,
            completed_by_external_name: completionData.completed_by_external_name,
            is_active: false,
          })
          .eq('id', taskId);

        if (error) throw error;
        
        // Update local state
        setTemplateTasks(current => 
          current.map(task => 
            task.id === taskId 
              ? { ...task, status: 'completed', completed_at: new Date().toISOString(), is_active: false }
              : task
          )
        );
      } catch (error) {
        console.error('Error completing task:', error);
        throw error;
      }
    },
    activateTaskForHome,
    deactivateTaskForHome,
    // REMOVED: createCalendarEventForTask is no longer needed here
    setCurrentHome,
    onRefresh: async () => {
      setRefreshing(true);
      try {
        await Promise.all([
          fetchTemplateTasks(),
          fetchAllHomeTasks()
        ]);
      } finally {
        setRefreshing(false);
      }
    },
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}; 
