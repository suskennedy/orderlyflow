import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';
import { useCalendar } from './CalendarContext';

export interface TaskHistory {
  id: string;
  task_id: string;
  completed_at: string;
  completed_by: string;
  notes?: string;
  completion_rating?: number;
  cost_actual?: number;
  time_spent_minutes?: number;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priority?: string | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
  
  // Template-specific fields
  status: 'template'; // Templates are always 'template' status
  suggested_frequency?: string | null;
  instructions?: string | null;
  estimated_cost?: number | null;
  task_type?: string | null;
  priority_level?: string | null;
  room_location?: string | null;
  equipment_required?: string | null;
  safety_notes?: string | null;
  estimated_duration_minutes?: number | null;
  is_recurring_task?: boolean | null;
  recurrence_interval?: number | null;
  recurrence_unit?: string | null;
  created_by?: string | null;
}

export interface HomeTask {
  id: string;
  home_id: string;
  task_id: string;
  is_active: boolean;
  assigned_vendor_id?: string | null;
  assigned_user_id?: string | null;
  due_date?: string | null;
  next_due?: string | null;
  notes?: string | null;
  status?: string | null;
  completed_at?: string | null;
  completion_notes?: string | null;
  completed_by_type?: 'vendor' | 'user' | 'external' | null;
  completed_by_vendor_id?: string | null;
  completed_by_user_id?: string | null;
  completed_by_external_name?: string | null;
  completion_verification_status?: 'pending' | 'verified' | 'disputed' | null;
  last_completed?: string | null;
  created_at: string;
  updated_at?: string | null;
}

// Combined type for UI that includes template data with home-specific data
export interface TaskItem extends TaskTemplate {
  // Home-specific task data from junction table
  home_task_id?: string;
  home_id?: string;
  is_active?: boolean;
  assigned_vendor_id?: string | null;
  assigned_user_id?: string | null;
  due_date?: string | null;
  next_due?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  completed_by_type?: 'vendor' | 'user' | 'external' | null;
  completed_by_vendor_id?: string | null;
  completed_by_user_id?: string | null;
  completed_by_external_name?: string | null;
  completion_verification_status?: 'pending' | 'verified' | 'disputed' | null;
  last_completed?: string | null;
  
  // Relationships
  homes?: {
    name: string;
  } | null;
  assigned_vendor?: {
    name: string;
  } | null;
  assigned_user?: {
    display_name: string;
  } | null;
  task_history?: TaskHistory[];
}

interface TasksContextType {
  tasks: TaskItem[];
  templates: TaskTemplate[];
  loading: boolean;
  refreshing: boolean;
  addTask: (task: Partial<TaskItem>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskActive: (taskId: string, isActive: boolean) => Promise<void>;
  completeTask: (taskId: string, completionData: any) => Promise<void>;
  onRefresh: () => Promise<void>;
  syncTasksToCalendar: () => Promise<void>;
  
  // Home-specific task management
  getTasksForHome: (homeId: string) => TaskItem[];
  activateTaskForHome: (homeId: string, taskId: string, homeTaskData?: Partial<HomeTask>) => Promise<void>;
  deactivateTaskForHome: (homeId: string, taskId: string) => Promise<void>;
  updateHomeTask: (homeTaskId: string, updates: Partial<HomeTask>) => Promise<void>;
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
  const { removeEventsByTaskId, refreshEvents } = useCalendar();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [homeTasks, setHomeTasks] = useState<HomeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to create calendar events from tasks
  const createCalendarEventFromTask = useCallback(async (task: TaskItem, homeTaskId?: string) => {
    if (!user?.id) {
      console.log('Skipping calendar event creation - no user ID');
      return;
    }

    try {
      // Use due_date if available, otherwise use created_at as fallback
      const eventDate = task.due_date || task.created_at?.split('T')[0];
      if (!eventDate) {
        console.log('Skipping calendar event creation - no due date or created date');
        return;
      }
      
      console.log('Creating calendar event for task:', task.title, 'on date:', eventDate);
      
      // Check if calendar event already exists for this home task
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('home_task_id', homeTaskId)
        .eq('user_id', user.id);

      if (existingEvents && existingEvents.length > 0) {
        console.log('Calendar event already exists for home task:', homeTaskId);
        return;
      }
      
      // Determine event color based on priority
      const getEventColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
          case 'urgent': return 'red';
          case 'high': return 'orange';
          case 'medium': return 'blue';
          case 'low': return 'green';
          default: return 'gray';
        }
      };

      const eventColor = getEventColor(task.priority as string);

      // Create the base calendar event
      const calendarEvent = {
        title: `Task: ${task.title}`,
        description: task.description || `Task: ${task.title}${task.notes ? `\n\nNotes: ${task.notes}` : ''}`,
        start_time: `${eventDate}T09:00:00`, // Default to 9 AM
        end_time: `${eventDate}T10:00:00`,   // Default to 10 AM
        location: null,
        color: eventColor,
        all_day: false,
        task_id: task.id,
        home_task_id: homeTaskId,
        user_id: user.id,
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || null,
        recurrence_end_date: task.recurrence_end_date || null,
      };

      // Insert the calendar event
      const { error } = await supabase
        .from('calendar_events')
        .insert([calendarEvent]);

      if (error) {
        console.error('Error creating calendar event for task:', error);
      }

      // If it's a recurring task, create recurring events
      if (task.is_recurring && task.recurrence_pattern) {
        await createRecurringCalendarEvents(task, eventColor, homeTaskId);
      }
    } catch (error) {
      console.error('Error creating calendar events for task:', error);
    }
  }, [user]);

  // Helper function to create recurring calendar events  
  const createRecurringCalendarEvents = useCallback(async (task: TaskItem, eventColor: string, homeTaskId?: string) => {
    if (!task.is_recurring || !task.recurrence_pattern || !user?.id) {
      return;
    }

    try {
      console.log('Creating recurring calendar events for task:', task.title, 'pattern:', task.recurrence_pattern);
      
      // Use today's date if no due date is provided
      const startDate = new Date(task.due_date || new Date().toISOString().split('T')[0]);
      const endDate = task.recurrence_end_date ? new Date(task.recurrence_end_date) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
      
      const events = [];
      let currentDate = new Date(startDate);
      let eventCount = 0;
      
      while (currentDate <= endDate && eventCount < 100) { // Limit to 100 events
        const eventDate = currentDate.toISOString().split('T')[0];
        
        const calendarEvent = {
          title: `Task: ${task.title}`,
          description: task.description || `Recurring Task: ${task.title}${task.notes ? `\n\nNotes: ${task.notes}` : ''}`,
          start_time: `${eventDate}T09:00:00`,
          end_time: `${eventDate}T10:00:00`,
          location: null,
          color: eventColor,
          all_day: false,
          task_id: task.id,
          home_task_id: homeTaskId,
          user_id: user.id,
          is_recurring: task.is_recurring || false,
          recurrence_pattern: task.recurrence_pattern || null,
          recurrence_end_date: task.recurrence_end_date || null,
        };

        events.push(calendarEvent);
        eventCount++;

        // Calculate next occurrence based on pattern
        const pattern = task.recurrence_pattern.toLowerCase();
        switch (pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'bi-weekly':
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'semi-annually':
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case 'annually':
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      if (events.length > 0) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(events);

        if (error) {
          console.error('Error creating recurring calendar events:', error);
        }
      }
    } catch (error) {
      console.error('Error creating recurring calendar events:', error);
    }
  }, [user]);

  // Fetch tasks with home-specific data
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Fetch home tasks with template data joined
      const { data: homeTasksData, error } = await supabase
        .from('home_tasks')
        .select(`
          *,
          tasks!inner (
            *,
            homes (
              name
            ),
            vendors (
              name
            ),
            user_profiles!tasks_assigned_user_id_fkey (
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      // Combine template and home task data
      const combinedTasks: TaskItem[] = (homeTasksData || []).map(homeTask => ({
        ...homeTask.tasks,
        home_task_id: homeTask.id,
        home_id: homeTask.home_id,
        is_active: homeTask.is_active,
        assigned_vendor_id: homeTask.assigned_vendor_id,
        assigned_user_id: homeTask.assigned_user_id,
        due_date: homeTask.due_date,
        next_due: homeTask.next_due,
        notes: homeTask.notes,
        status: homeTask.status,
        completed_at: homeTask.completed_at,
        completion_notes: homeTask.completion_notes,
        completed_by_type: homeTask.completed_by_type,
        completed_by_vendor_id: homeTask.completed_by_vendor_id,
        completed_by_user_id: homeTask.completed_by_user_id,
        completed_by_external_name: homeTask.completed_by_external_name,
        completion_verification_status: homeTask.completion_verification_status,
        last_completed: homeTask.last_completed,
        task_history: []
      }));
      
      setTasks(combinedTasks);
      
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Memoized getter for home-specific tasks
  const getTasksForHome = useCallback((homeId: string) => {
    return tasks.filter(task => task.home_id === homeId);
  }, [tasks]);

  // Activate a task template for a specific home
  const activateTaskForHome = useCallback(async (homeId: string, taskId: string, homeTaskData?: Partial<HomeTask>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const homeTaskPayload = {
        home_id: homeId,
        task_id: taskId,
        is_active: true,
        assigned_vendor_id: homeTaskData?.assigned_vendor_id || null,
        assigned_user_id: homeTaskData?.assigned_user_id || null,
        due_date: homeTaskData?.due_date || null,
        next_due: homeTaskData?.next_due || null,
        notes: homeTaskData?.notes || null,
        status: homeTaskData?.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert([homeTaskPayload])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setHomeTasks(current => [...current, data]);
      
      // Update tasks array with home-specific data
      await fetchTasks();

      // Create calendar event for the activated task
      const template = templates.find(t => t.id === taskId);
      if (template) {
        await createCalendarEventFromTask({
          ...template,
          ...homeTaskData,
          home_task_id: data.id,
          home_id: homeId
        }, data.id);
      }
    } catch (error) {
      console.error('Error activating task for home:', error);
      throw error;
    }
  }, [user, templates, createCalendarEventFromTask, fetchTasks]);

  // Deactivate a task for a specific home
  const deactivateTaskForHome = useCallback(async (homeId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('home_tasks')
        .delete()
        .eq('home_id', homeId)
        .eq('task_id', taskId);

      if (error) throw error;

      // Remove from local state
      setHomeTasks(current => 
        current.filter(ht => !(ht.home_id === homeId && ht.task_id === taskId))
      );
      
      // Update tasks array
      await fetchTasks();
    } catch (error) {
      console.error('Error deactivating task for home:', error);
      throw error;
    }
  }, [fetchTasks]);

  // Update home task
  const updateHomeTask = useCallback(async (homeTaskId: string, updates: Partial<HomeTask>) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('home_tasks')
        .update(updateData)
        .eq('id', homeTaskId);

      if (error) throw error;

      // Update local state
      setHomeTasks(current =>
        current.map(ht => ht.id === homeTaskId ? { ...ht, ...updates } : ht)
      );
      
      // Update tasks array
      await fetchTasks();
    } catch (error) {
      console.error('Error updating home task:', error);
      throw error;
    }
  }, [fetchTasks]);

  // Fetch task templates
  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'template') // Only fetch templates
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, [user?.id]);

  // Add task (create template)
  const addTask = useCallback(async (taskData: Partial<TaskItem>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const payload = {
        ...taskData,
        user_id: user.id,
        status: 'template', // New tasks are templates
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Add to templates
      setTemplates(current => [data, ...current]);
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }, [user]);

  // Update task template
  const updateTask = useCallback(async (taskId: string, updates: Partial<TaskItem>) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update templates
      setTemplates(current =>
        current.map(template => template.id === taskId ? { ...template, ...updates } : template)
      );
      
      // Update tasks array
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [fetchTasks]);

  // Delete task template
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTemplates(current => current.filter(template => template.id !== taskId));
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [fetchTasks]);

  // Toggle task active (for home tasks)
  const toggleTaskActive = useCallback(async (homeTaskId: string, isActive: boolean) => {
    try {
      await updateHomeTask(homeTaskId, { is_active: isActive });
    } catch (error) {
      console.error('Error toggling task active:', error);
      throw error;
    }
  }, [updateHomeTask]);

  // Complete a home task
  const completeTask = useCallback(async (homeTaskId: string, completionData: any) => {
    try {
      const updates: Partial<HomeTask> = {
        status: completionData.status || 'completed',
        completed_at: completionData.completed_at || new Date().toISOString(),
        completion_notes: completionData.completion_notes || completionData.notes,
        completed_by_type: completionData.completed_by_type,
        completed_by_vendor_id: completionData.completed_by_vendor_id || null,
        completed_by_user_id: completionData.completed_by_user_id || null,
        completed_by_external_name: completionData.completed_by_external_name || null,
        completion_verification_status: completionData.completion_verification_status || 'verified',
        last_completed: completionData.completed_at || new Date().toISOString(),
        is_active: completionData.is_active !== undefined ? completionData.is_active : false,
      };

      await updateHomeTask(homeTaskId, updates);

      // Handle recurring tasks
      const task = tasks.find(t => t.home_task_id === homeTaskId);
      if (task && task.is_recurring && task.recurrence_pattern && updates.status === 'completed') {
        // Create next occurrence
        const nextDueDate = calculateNextDueDate(task.due_date, task.recurrence_pattern);
        if (nextDueDate) {
          await activateTaskForHome(task.home_id!, task.id, {
            due_date: nextDueDate,
            next_due: nextDueDate,
            assigned_vendor_id: task.assigned_vendor_id,
            assigned_user_id: task.assigned_user_id,
            notes: task.notes,
          });
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }, [tasks, updateHomeTask, activateTaskForHome]);

  // Helper function to calculate next due date
  const calculateNextDueDate = (currentDueDate: string | null, pattern: string): string | null => {
    if (!currentDueDate || !pattern) return null;

    const current = new Date(currentDueDate);
    const next = new Date(current);

    switch (pattern.toLowerCase()) {
      case 'daily':
        next.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(current.getDate() + 7);
        break;
      case 'bi-weekly':
      case 'biweekly':
        next.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(current.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(current.getMonth() + 3);
        break;
      case 'semi-annually':
        next.setMonth(current.getMonth() + 6);
        break;
      case 'annually':
      case 'yearly':
        next.setFullYear(current.getFullYear() + 1);
        break;
      default:
        return null;
    }

    return next.toISOString().split('T')[0];
  };

  // Sync tasks to calendar (placeholder)
  const syncTasksToCalendar = useCallback(async () => {
    // Implementation for syncing to external calendars
    console.log('Syncing tasks to calendar...');
  }, []);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchTemplates()]);
    setRefreshing(false);
  }, [fetchTasks, fetchTemplates]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.id) {
      Promise.all([fetchTasks(), fetchTemplates()]);
    }
  }, [user?.id, fetchTasks, fetchTemplates]);

  // Set up real-time subscriptions
  useRealTimeSubscription('home_tasks', fetchTasks);
  useRealTimeSubscription('tasks', fetchTemplates);

  const value = {
    tasks,
    templates,
    loading,
    refreshing,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskActive,
    completeTask,
    onRefresh,
    syncTasksToCalendar,
    getTasksForHome,
    activateTaskForHome,
    deactivateTaskForHome,
    updateHomeTask,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
