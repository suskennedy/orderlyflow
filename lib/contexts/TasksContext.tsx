import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Database } from '../../supabase-types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

// Use database types for consistency
type TaskTemplate = Database['public']['Tables']['tasks']['Row'];
// type TaskTemplateInsert = Database['public']['Tables']['tasks']['Insert'];
type HomeTask = Database['public']['Tables']['home_tasks']['Row'];
type HomeTaskInsert = Database['public']['Tables']['home_tasks']['Insert'];
type HomeTaskUpdate = Database['public']['Tables']['home_tasks']['Update'];

interface TasksContextType {
  // Data
  templateTasks: TaskTemplate[];
  homeTasks: HomeTask[];
  currentHomeId: string | null;
  loading: boolean;
  
  // Essential functions only
  fetchTemplateTasks: () => Promise<void>;
  fetchHomeTasks: (homeId: string) => Promise<void>;
  activateTemplateForHome: (templateId: string, homeId: string, details: any) => Promise<void>;
  createCustomTask: (homeId: string, taskData: any) => Promise<HomeTask>;
  updateHomeTask: (homeTaskId: string, updates: any) => Promise<void>;
  completeHomeTask: (homeTaskId: string, completionData: any) => Promise<void>;
  setCurrentHome: (homeId: string | null) => void;
  
  // Calendar integration functions
  createHomeTaskWithCalendar: (homeId: string, taskData: any, calendarOptions?: any) => Promise<HomeTask>;
  updateHomeTaskWithCalendar: (homeTaskId: string, updates: any, calendarOptions?: any) => Promise<void>;
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
  const [templateTasks, setTemplateTasks] = useState<TaskTemplate[]>([]);
  const [homeTasks, setHomeTasks] = useState<HomeTask[]>([]);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Call 1: Fetch template tasks
  const fetchTemplateTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setTemplateTasks(data || []);
    } catch (error) {
      console.error('Error fetching template tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call 2: Fetch home tasks for specific home
  const fetchHomeTasks = useCallback(async (homeId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('home_tasks')
        .select(`
          *,
          homes!inner(name)
        `)
        .eq('home_id', homeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomeTasks(data || []);
    } catch (error) {
      console.error('Error fetching home tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call 3: Activate template for home
  const activateTemplateForHome = useCallback(async (templateId: string, homeId: string, details: any) => {
    try {
      const template = templateTasks.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const homeTaskData: HomeTaskInsert = {
        task_id: templateId,
        home_id: homeId,
        title: template.title,
        description: template.description,
        category: template.category,
        subcategory: template.subcategory,
        due_date: details.customSettings?.due_date || null,
        priority: details.customSettings?.priority || null,
        assigned_user_id: details.customSettings?.assigned_user_id || null,
        assigned_vendor_id: details.customSettings?.assigned_vendor_id || null,
        notes: details.customSettings?.notes || null,
        room_location: details.customSettings?.room_location || null,
        is_active: true,
        status: 'pending',
        is_recurring: details.customSettings?.is_recurring || false,
        recurrence_pattern: details.customSettings?.recurrence_pattern || null,
        recurrence_end_date: details.customSettings?.recurrence_end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, create calendar event
      if (details.calendarOptions && details.calendarOptions.create_calendar_event) {
        const calendarEventData = {
          title: template.title,
          description: template.description,
          start_time: details.calendarOptions.start_time,
          end_time: details.calendarOptions.end_time,
          home_id: homeId,
          task_id: templateId,
          home_task_id: data.id,
          task_type: 'task',
          is_recurring: details.calendarOptions.is_recurring || false,
          recurrence_pattern: details.calendarOptions.recurrence_pattern || null,
          recurrence_end_date: details.calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't throw error - task was created successfully
        }
      }
      
      // Update local state
      setHomeTasks(current => [data, ...current]);
    } catch (error) {
      console.error('Error activating template for home:', error);
      throw error;
    }
  }, [templateTasks, user?.id]);

  // Call 4: Create custom task
  const createCustomTask = useCallback(async (homeId: string, taskData: any) => {
    try {
      const homeTaskData: HomeTaskInsert = {
        ...taskData,
        home_id: homeId,
        task_id: null, // Custom task
        is_active: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setHomeTasks(current => [data, ...current]);
      return data;
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }, []);

  // Update home task
  const updateHomeTask = useCallback(async (homeTaskId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('home_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', homeTaskId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setHomeTasks(current => 
        current.map(task => task.id === homeTaskId ? data : task)
      );
    } catch (error) {
      console.error('Error updating home task:', error);
      throw error;
    }
  }, []);

  // Complete home task
  const completeHomeTask = useCallback(async (homeTaskId: string, completionData: any) => {
    try {
      const updates: HomeTaskUpdate = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionData.notes,
        completed_by_type: completionData.completed_by_type,
        completed_by_user_id: completionData.completed_by_user_id,
        completed_by_vendor_id: completionData.completed_by_vendor_id,
        completed_by_external_name: completionData.completed_by_external_name,
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      await updateHomeTask(homeTaskId, updates);

      // Remove calendar events associated with this completed task
      try {
        const { error: calendarError } = await supabase
          .from('calendar_events')
          .delete()
          .eq('home_task_id', homeTaskId);

        if (calendarError) {
          console.error('Error removing calendar events for completed task:', calendarError);
        } else {
          console.log('Successfully removed calendar events for completed task:', homeTaskId);
        }
      } catch (calendarError) {
        console.error('Error removing calendar events for completed task:', calendarError);
      }
    } catch (error) {
      console.error('Error completing home task:', error);
      throw error;
    }
  }, [updateHomeTask]);

  // Set current home
  const setCurrentHome = useCallback((homeId: string | null) => {
    setCurrentHomeId(homeId);
    if (homeId) {
      fetchHomeTasks(homeId);
    } else {
      setHomeTasks([]);
    }
  }, [fetchHomeTasks]);

  // Calendar integration functions
  const createHomeTaskWithCalendar = useCallback(async (homeId: string, taskData: any, calendarOptions?: any) => {
    try {
      // Create the home task first
      const homeTaskData: HomeTaskInsert = {
        ...taskData,
        home_id: homeId,
        task_id: null, // Custom task
        is_active: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, create calendar event
      if (calendarOptions && calendarOptions.create_calendar_event) {
        const calendarEventData = {
          title: taskData.title,
          description: taskData.description,
          start_time: calendarOptions.start_time || new Date().toISOString(),
          end_time: calendarOptions.end_time || new Date().toISOString(),
          home_id: homeId,
          home_task_id: data.id,
          task_type: 'custom',
          is_recurring: calendarOptions.is_recurring || false,
          recurrence_pattern: calendarOptions.recurrence_pattern || null,
          recurrence_end_date: calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't throw error - task was created successfully
        }
      }

      // Update local state
      setHomeTasks(current => [data, ...current]);
      return data;
    } catch (error) {
      console.error('Error creating home task with calendar:', error);
      throw error;
    }
  }, [user?.id]);

  const updateHomeTaskWithCalendar = useCallback(async (homeTaskId: string, updates: any, calendarOptions?: any) => {
    try {
      // Update the home task
      const { data, error } = await supabase
        .from('home_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', homeTaskId)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, update or create calendar event
      if (calendarOptions) {
        // Check if calendar event exists for this home task
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('home_task_id', homeTaskId)
          .single();

        const calendarEventData = {
          title: updates.title || data.title,
          description: updates.description || data.description,
          start_time: calendarOptions.start_time || new Date().toISOString(),
          end_time: calendarOptions.end_time || new Date().toISOString(),
          home_id: data.home_id,
          home_task_id: homeTaskId,
          task_type: 'custom',
          is_recurring: calendarOptions.is_recurring || false,
          recurrence_pattern: calendarOptions.recurrence_pattern || null,
          recurrence_end_date: calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          updated_at: new Date().toISOString(),
        };

        if (existingEvent) {
          // Update existing calendar event
          const { error: calendarError } = await supabase
            .from('calendar_events')
            .update(calendarEventData)
            .eq('id', existingEvent.id);

          if (calendarError) {
            console.error('Error updating calendar event:', calendarError);
          }
        } else if (calendarOptions.create_calendar_event) {
          // Create new calendar event
          const { error: calendarError } = await supabase
            .from('calendar_events')
            .insert({
              ...calendarEventData,
              created_at: new Date().toISOString(),
            });

          if (calendarError) {
            console.error('Error creating calendar event:', calendarError);
          }
        }
      }

      // Update local state
      setHomeTasks(current => 
        current.map(task => task.id === homeTaskId ? data : task)
      );
    } catch (error) {
      console.error('Error updating home task with calendar:', error);
      throw error;
    }
  }, [user?.id]);

  // Performance optimizations with memoization
  // const activeTasks = useMemo(() => 
  //   homeTasks.filter(task => task.is_active && task.status !== 'completed'), 
  //   [homeTasks]
  // );

  // const completedTasks = useMemo(() => 
  //   homeTasks.filter(task => task.status === 'completed'), 
  //   [homeTasks]
  // );

  // const templatesWithStatus = useMemo(() => 
  //   templateTasks.map(template => ({
  //     ...template,
  //     isActive: homeTasks.some(task => task.task_id === template.id)
  //   })), 
  //   [templateTasks, homeTasks]
  // );

  // Load template tasks on mount
  useEffect(() => {
    fetchTemplateTasks();
  }, [fetchTemplateTasks]);

  const value = {
    // Data
    templateTasks,
    homeTasks,
    currentHomeId,
    loading,
    
    // Functions
    fetchTemplateTasks,
    fetchHomeTasks,
    activateTemplateForHome,
    createCustomTask,
    updateHomeTask,
    completeHomeTask,
    setCurrentHome,
    
    // Calendar integration functions
    createHomeTaskWithCalendar,
    updateHomeTaskWithCalendar,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
