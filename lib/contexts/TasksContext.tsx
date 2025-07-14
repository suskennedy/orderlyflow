import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';
import { useCalendar } from './CalendarContext';

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
  const { removeEventsByTaskId, refreshEvents } = useCalendar();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to create calendar events from tasks
  const createCalendarEventFromTask = useCallback(async (task: TaskItem) => {
    if (!user?.id) {
      console.log('Skipping calendar event creation - no user ID');
      return;
    }

    try {
      // Use today's date if no due date is provided
      const eventDate = task.due_date || new Date().toISOString().split('T')[0];
      console.log('Creating calendar event for task:', task.title, 'on date:', eventDate);
      
      // Check if calendar event already exists for this task
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', task.id)
        .eq('user_id', user.id);

      if (existingEvents && existingEvents.length > 0) {
        console.log('Calendar event already exists for task:', task.id);
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

      const eventColor = getEventColor(task.priority);

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
        user_id: user.id,
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || null,
        recurrence_end_date: task.recurrence_end_date || null,
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
        // Refresh calendar events to ensure UI is updated
        setTimeout(() => refreshEvents(), 100);
      }
    } catch (error) {
      console.error('Error creating calendar event from task:', error);
    }
  }, [user?.id, refreshEvents]);

  // Helper function to create recurring calendar events
  const createRecurringCalendarEvents = useCallback(async (task: TaskItem) => {
    if (!task.is_recurring || !task.recurrence_pattern || !user?.id) {
      console.log('Skipping recurring calendar events - missing required fields:', {
        is_recurring: task.is_recurring,
        recurrence_pattern: task.recurrence_pattern,
        user_id: user?.id
      });
      return;
    }

    try {
      console.log('Creating recurring calendar events for task:', task.title, 'pattern:', task.recurrence_pattern);
      
      // Use today's date if no due date is provided
      const startDate = new Date(task.due_date || new Date().toISOString().split('T')[0]);
      const endDate = task.recurrence_end_date ? new Date(task.recurrence_end_date) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
      
      console.log('Recurring task date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pattern: task.recurrence_pattern
      });
      
      // Check if recurring events already exist for this task
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', task.id)
        .eq('user_id', user.id);

      if (existingEvents && existingEvents.length > 0) {
        console.log('Recurring calendar events already exist for task:', task.id, 'count:', existingEvents.length);
        return;
      }
      
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
      let eventCount = 0;
      
      while (currentDate <= endDate && eventCount < 100) { // Limit to 100 events to prevent infinite loops
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
          is_recurring: true,
          recurrence_pattern: task.recurrence_pattern,
          recurrence_end_date: task.recurrence_end_date,
        };

        events.push(calendarEvent);
        eventCount++;

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

      console.log(`Creating ${events.length} recurring calendar events for task: ${task.title}`);

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
          // Refresh calendar events to ensure UI is updated
          setTimeout(() => refreshEvents(), 200);
        }
      } else {
        console.log('No recurring events to create for task:', task.title);
      }
    } catch (error) {
      console.error('Error creating recurring calendar events:', error);
    }
  }, [user?.id, refreshEvents]);

  // Utility function to sync all tasks to calendar
  const syncTasksToCalendar = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Syncing all tasks to calendar...');
      
      // Get all tasks (including those without due dates)
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching tasks for calendar sync:', error);
        return;
      }

      console.log(`Found ${allTasks?.length || 0} tasks to sync`);

      // Delete existing calendar events for tasks
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .not('task_id', 'is', null);

      // Create calendar events for each task
      for (const task of allTasks || []) {
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
        
        // Create calendar event for new task (with or without due date)
        createCalendarEventFromTask(payload.new);
        
        // If it's a recurring task, create recurring events
        if (payload.new.is_recurring && payload.new.recurrence_pattern) {
          createRecurringCalendarEvents(payload.new);
        }
      } 
      else if (eventType === 'UPDATE') {
        console.log('Task updated:', payload.new);
        // For updates, we need to fetch to get the homes relationship
        fetchTasks();
        
        // Update calendar events if due date changed or task became recurring
        const dueDateChanged = payload.new.due_date !== payload.old.due_date;
        const becameRecurring = !payload.old.is_recurring && payload.new.is_recurring;
        const recurrencePatternChanged = payload.old.recurrence_pattern !== payload.new.recurrence_pattern;
        
        if (dueDateChanged || becameRecurring || recurrencePatternChanged) {
          console.log('Task details changed, updating calendar events');
          // Delete old calendar events for this task
          supabase
            .from('calendar_events')
            .delete()
            .eq('task_id', payload.new.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error deleting old calendar events:', error);
              } else {
                console.log('Successfully deleted old calendar events');
                // Create new calendar events
                createCalendarEventFromTask(payload.new);
                
                if (payload.new.is_recurring && payload.new.recurrence_pattern) {
                  createRecurringCalendarEvents(payload.new);
                }
              }
            });
        }
      } 
      else if (eventType === 'DELETE') {
        console.log('Task deleted via real-time subscription:', payload.old);
        setTasks(current => 
          current.filter(task => task.id !== payload.old.id)
        );
        
        // Delete associated calendar events immediately using CalendarContext method
        if (payload.old.id) {
          console.log('Deleting calendar events for deleted task:', payload.old.id);
          removeEventsByTaskId(payload.old.id);
          // Refresh calendar events to ensure UI is properly updated
          setTimeout(() => refreshEvents(), 100);
        }
      }
    }
  }, [user?.id, fetchTasks, createCalendarEventFromTask, createRecurringCalendarEvents, removeEventsByTaskId, refreshEvents]);

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
      console.log('Deleting task:', taskId);
      
      // First, remove all associated calendar events using the CalendarContext method
      await removeEventsByTaskId(taskId);
      
      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      console.log('Successfully deleted task:', taskId);
      
      // Remove from local state for immediate UI update
      setTasks(current => current.filter(task => task.id !== taskId));
      
      // Refresh calendar events to ensure UI is properly updated
      await refreshEvents();
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