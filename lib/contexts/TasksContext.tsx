import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  home_id?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
  homes?: {
    name: string;
  } | null;
}

interface TasksContextType {
  tasks: TaskItem[];
  loading: boolean;
  refreshing: boolean;
  addTask: (task: TaskItem) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  syncTasksToCalendar: () => Promise<void>;
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
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to create calendar events from tasks
  const createCalendarEventFromTask = useCallback(async (task: TaskItem) => {
    if (!task.due_date || !user?.id) {
      console.log('Skipping calendar event creation - no due date or user ID');
      return;
    }

    try {
      console.log('Creating calendar event for task:', task.title, 'on date:', task.due_date);
      
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

      const eventColor = getEventColor(task.priority);

      // Create the base calendar event
      const calendarEvent = {
        title: `Task: ${task.title}`,
        description: task.description || `Task: ${task.title}${task.notes ? `\n\nNotes: ${task.notes}` : ''}`,
        start_time: `${task.due_date}T09:00:00`, // Default to 9 AM
        end_time: `${task.due_date}T10:00:00`,   // Default to 10 AM
        location: null,
        color: eventColor,
        all_day: false,
        task_id: task.id,
        user_id: user.id,
      };

      console.log('Inserting calendar event:', calendarEvent);

      // Insert the calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([calendarEvent])
        .select();

      if (error) {
        console.error('Error creating calendar event for task:', error);
      } else {
        console.log('Successfully created calendar event:', data);
      }
    } catch (error) {
      console.error('Error creating calendar event from task:', error);
    }
  }, [user?.id]);

  // Helper function to create recurring calendar events
  const createRecurringCalendarEvents = useCallback(async (task: TaskItem) => {
    if (!task.due_date || !task.is_recurring || !task.recurrence_pattern || !user?.id) {
      console.log('Skipping recurring calendar events - missing required fields');
      return;
    }

    try {
      console.log('Creating recurring calendar events for task:', task.title);
      
      const startDate = new Date(task.due_date);
      const endDate = task.recurrence_end_date ? new Date(task.recurrence_end_date) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
      
      const getEventColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
          case 'urgent': return 'red';
          case 'high': return 'orange';
          case 'medium': return 'blue';
          case 'low': return 'green';
          default: return 'gray';
        }
      };

      const eventColor = getEventColor(task.priority);
      const events = [];

      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
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
          user_id: user.id,
        };

        events.push(calendarEvent);

        // Calculate next occurrence based on pattern (case-insensitive)
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

      console.log(`Creating ${events.length} recurring calendar events`);

      // Insert all recurring events
      if (events.length > 0) {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert(events)
          .select();

        if (error) {
          console.error('Error creating recurring calendar events:', error);
        } else {
          console.log('Successfully created recurring calendar events:', data?.length);
        }
      }
    } catch (error) {
      console.error('Error creating recurring calendar events:', error);
    }
  }, [user?.id]);

  // Utility function to sync all tasks to calendar
  const syncTasksToCalendar = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Syncing all tasks to calendar...');
      
      // Get all tasks with due dates
      const { data: tasksWithDueDates, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('due_date', 'is', null);

      if (error) {
        console.error('Error fetching tasks for calendar sync:', error);
        return;
      }

      console.log(`Found ${tasksWithDueDates?.length || 0} tasks with due dates`);

      // Delete existing calendar events for tasks
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .not('task_id', 'is', null);

      // Create calendar events for each task
      for (const task of tasksWithDueDates || []) {
        await createCalendarEventFromTask(task);
        
        if (task.is_recurring && task.recurrence_pattern) {
          await createRecurringCalendarEvents(task);
        }
      }

      console.log('Calendar sync completed');
    } catch (error) {
      console.error('Error syncing tasks to calendar:', error);
    }
  }, [user?.id, createCalendarEventFromTask, createRecurringCalendarEvents]);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          homes (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Set up real-time subscription for tasks table
  const handleTaskChange = useCallback((payload: any) => {
    console.log('Task change detected:', payload.eventType, payload.new?.title);
    
    // Only process changes relevant to the current user
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;

      if (eventType === 'INSERT') {
        console.log('New task inserted:', payload.new);
        // For new tasks, we need to fetch to get the homes relationship
        fetchTasks();
        
        // Create calendar event for new task with due date
        if (payload.new.due_date) {
          createCalendarEventFromTask(payload.new);
          
          // If it's a recurring task, create recurring events
          if (payload.new.is_recurring && payload.new.recurrence_pattern) {
            createRecurringCalendarEvents(payload.new);
          }
        }
      } 
      else if (eventType === 'UPDATE') {
        console.log('Task updated:', payload.new);
        // For updates, we need to fetch to get the homes relationship
        fetchTasks();
        
        // Update calendar events if due date changed
        if (payload.new.due_date !== payload.old.due_date) {
          console.log('Due date changed, updating calendar events');
          // Delete old calendar events for this task
          supabase
            .from('calendar_events')
            .delete()
            .eq('task_id', payload.new.id)
            .then(() => {
              // Create new calendar events
              if (payload.new.due_date) {
                createCalendarEventFromTask(payload.new);
                
                if (payload.new.is_recurring && payload.new.recurrence_pattern) {
                  createRecurringCalendarEvents(payload.new);
                }
              }
            });
        }
      } 
      else if (eventType === 'DELETE') {
        console.log('Task deleted:', payload.old);
        setTasks(current => 
          current.filter(task => task.id !== payload.old.id)
        );
        
        // Delete associated calendar events
        if (payload.old.id) {
          supabase
            .from('calendar_events')
            .delete()
            .eq('task_id', payload.old.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error deleting calendar events for task:', error);
              } else {
                console.log('Successfully deleted calendar events for task');
              }
            });
        }
      }
    }
  }, [user?.id, fetchTasks, createCalendarEventFromTask, createRecurringCalendarEvents]);

  // Set up the real-time subscription
  useRealTimeSubscription(
    { 
      table: 'tasks',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleTaskChange
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user, fetchTasks]);

  // Add a new task
  const addTask = (task: TaskItem) => {
    // Add locally for immediate UI update (the subscription will sync with server)
    setTasks(current => [task, ...current]);
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<TaskItem>) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update locally for immediate UI update
      setTasks(current => 
        current.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Remove from local state for immediate UI update
      setTasks(current => current.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
  };

  const value = {
    tasks,
    loading,
    refreshing,
    addTask,
    updateTask,
    deleteTask,
    onRefresh,
    syncTasksToCalendar,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}; 