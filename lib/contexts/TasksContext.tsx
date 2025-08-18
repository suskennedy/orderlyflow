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
  photos?: string[];
  cost_actual?: number;
  time_spent_minutes?: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  completed_at?: string | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  home_id?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
  
  // New fields for the comprehensive task system
  is_active?: boolean;
  suggested_frequency?: string | null;
  custom_frequency?: string | null;
  last_completed?: string | null;
  next_due?: string | null;
  assigned_vendor_id?: string | null;
  assigned_user_id?: string | null;
  instructions?: string | null;
  estimated_cost?: number | null;
  image_url?: string | null;
  frequency_type?: string | null;
  task_type?: string | null;
  priority_level?: string | null;
  completion_notes?: string | null;
  vendor_notes?: string | null;
  room_location?: string | null;
  equipment_required?: string | null;
  safety_notes?: string | null;
  estimated_duration_minutes?: number | null;
  is_recurring_task?: boolean | null;
  recurrence_interval?: number | null;
  recurrence_unit?: string | null;
  last_modified_by?: string | null;
  created_by?: string | null;
  
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
  loading: boolean;
  refreshing: boolean;
  addTask: (task: Partial<TaskItem>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskActive: (taskId: string, isActive: boolean) => Promise<void>;
  completeTask: (taskId: string, completionData: any) => Promise<void>;
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
      // Use due_date if available, otherwise use created_at as fallback
      const eventDate = task.due_date || task.created_at?.split('T')[0];
      if (!eventDate) {
        console.log('Skipping calendar event creation - no due date or created date');
        return;
      }
      
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

      const eventColor = getEventColor(task?.priority  as string);
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
        const pattern = task.recurrence_pattern?.toLowerCase() || 'daily';
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
        await createCalendarEventFromTask(task as any);
        
        if (task.is_recurring && task.recurrence_pattern) {
          await createRecurringCalendarEvents(task as any);
        }
      }

      console.log('Calendar sync completed');
    } catch (error) {
      console.error('Error syncing tasks to calendar:', error);
    }
  }, [user?.id, createCalendarEventFromTask, createRecurringCalendarEvents]);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setTasks([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // Set tasks in state with empty history for each task
      const tasksWithHistory = (data || []).map(task => ({
        ...task,
        task_history: []
      })) as unknown as TaskItem[];
      
      setTasks(tasksWithHistory);
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Add a new task
  const addTask = async (taskData: Partial<TaskItem>) => {
    try {
      // Ensure required fields are present
      if (!taskData.title) {
        throw new Error('Task title is required');
      }

      const newTask = {
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || null,
        subcategory: taskData.subcategory || null,
        priority: taskData.priority || null,
        status: taskData.status || 'pending',
        due_date: taskData.due_date || null,
        is_recurring: taskData.is_recurring || false,
        recurrence_pattern: taskData.recurrence_pattern || null,
        recurrence_end_date: taskData.recurrence_end_date || null,
        home_id: taskData.home_id || null,
        notes: taskData.notes || null,
        is_active: taskData.is_active !== undefined ? taskData.is_active : true,
        suggested_frequency: taskData.suggested_frequency || null,
        custom_frequency: taskData.custom_frequency || null,
        assigned_vendor_id: taskData.assigned_vendor_id || null,
        assigned_user_id: taskData.assigned_user_id || null,
        instructions: taskData.instructions || null,
        estimated_cost: taskData.estimated_cost || null,
        image_url: taskData.image_url || null,
        frequency_type: taskData.frequency_type || null,
        task_type: taskData.task_type || null,
        priority_level: taskData.priority_level || null,
        completion_notes: taskData.completion_notes || null,
        vendor_notes: taskData.vendor_notes || null,
        room_location: taskData.room_location || null,
        equipment_required: taskData.equipment_required || null,
        safety_notes: taskData.safety_notes || null,
        estimated_duration_minutes: taskData.estimated_duration_minutes || null,
        is_recurring_task: taskData.is_recurring_task || false,
        recurrence_interval: taskData.recurrence_interval || null,
        recurrence_unit: taskData.recurrence_unit || null,
        last_modified_by: taskData.last_modified_by || null,
        created_by: taskData.created_by || null,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select('*')
        .single();

      if (error) throw error;

      // Add to local state with empty history
      const taskWithHistory = {
        ...data,
        task_history: []
      } as unknown as TaskItem;
      
      setTasks(current => [taskWithHistory, ...current]);
      
      // Create calendar event for new task - only if task is active
      if (taskWithHistory.is_active !== false) {
        if (taskWithHistory.is_recurring && taskWithHistory.recurrence_pattern) {
          // For recurring tasks, only create recurring calendar events
          createRecurringCalendarEvents(taskWithHistory);
        } else {
          // For non-recurring tasks, only create single calendar event
          createCalendarEventFromTask(taskWithHistory);
        }
      } else {
        console.log('Task created as inactive, skipping calendar event creation');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<TaskItem>) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      console.log('TasksContext: Updating task in database:', taskId, updateData);

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update locally for immediate UI update
      setTasks(current => 
        current.map(task => 
          task.id === taskId ? { ...task, ...updateData } : task
        )
      );

      // Handle task deactivation - remove calendar events when task is deactivated
      if (updates.is_active === false) {
        console.log('TasksContext: Task deactivated, removing calendar events for task:', taskId);
        await removeEventsByTaskId(taskId);
        // Refresh calendar events to ensure UI is updated
        setTimeout(() => refreshEvents(), 200);
      } else {
        // Also update calendar events directly in the database for other changes
        await updateCalendarEventsForTask(taskId, updateData);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  // Helper function to update calendar events for a task
  const updateCalendarEventsForTask = async (taskId: string, taskUpdates: any) => {
    if (!user?.id) {
      console.log('Skipping calendar event update - no user ID');
      return;
    }

    try {
      console.log('TasksContext: Updating calendar events for task:', taskId);

      // Get the updated task data
      const updatedTask = tasks.find(task => task.id === taskId);
      if (!updatedTask) {
        console.log('Task not found in local state, skipping calendar update');
        return;
      }

      // Check if we need to update calendar events
      const needsCalendarUpdate = taskUpdates.title || taskUpdates.due_date || taskUpdates.is_recurring || taskUpdates.recurrence_pattern;
      
      if (!needsCalendarUpdate) {
        console.log('No calendar-relevant changes, skipping calendar update');
        return;
      }

      // Delete existing calendar events for this task
      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting old calendar events:', deleteError);
        return;
      }

      console.log('Successfully deleted old calendar events for task:', taskId);

      // Create new calendar events based on updated task data
      const taskWithUpdates = { ...updatedTask, ...taskUpdates };
      
      // Only create calendar events if task is active
      if (taskWithUpdates.is_active !== false) {
        if (taskWithUpdates.is_recurring && taskWithUpdates.recurrence_pattern) {
          // For recurring tasks, create recurring calendar events
          await createRecurringCalendarEvents(taskWithUpdates);
        } else {
          // For non-recurring tasks, create single calendar event
          await createCalendarEventFromTask(taskWithUpdates);
        }
        console.log('Successfully updated calendar events for task:', taskId);
      } else {
        console.log('Task is inactive, skipping calendar event creation for task:', taskId);
      }
    } catch (error) {
      console.error('Error updating calendar events for task:', error);
    }
  };

  // Toggle task active status
  const toggleTaskActive = async (taskId: string, isActive: boolean) => {
    try {
      await updateTask(taskId, { is_active: isActive });
    } catch (error) {
      console.error('Error toggling task active status:', error);
      throw error;
    }
  };

  // Complete a task
  const completeTask = async (taskId: string, completionData: any) => {
    try {
      // Get the current task to check if it's recurring
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        throw new Error('Task not found');
      }

      console.log('Completing task:', currentTask.title, 'Recurring:', currentTask.is_recurring, 'Pattern:', currentTask.recurrence_pattern);

      // Determine if we're completing or uncompleting the task
      const isCompleting = completionData.status !== 'pending';
      
      let taskUpdates;
      let newTaskToAdd = null;
      
      if (isCompleting) {
        // Completing the task
        taskUpdates = {
          status: 'completed',
          completed_by_type: completionData.completed_by_type || 'user',
          completed_by_vendor_id: completionData.completed_by_vendor_id || null,
          completed_by_external_name: completionData.completed_by_external_name || null,
          completed_at: completionData.completed_at || new Date().toISOString(),
          completion_verification_status: completionData.completion_verification_status || 'verified',
          completion_notes: completionData.completion_notes || completionData.notes || null,
          last_completed: new Date().toISOString(),
          completion_date: new Date().toISOString()
        };

        // If this is a recurring task, create the next occurrence
        if (currentTask.is_recurring && currentTask.recurrence_pattern) {
          console.log('Creating next occurrence for recurring task:', currentTask.title);
          
          const nextDueDate = calculateNextDueDate(
            currentTask.due_date || currentTask.next_due,
            currentTask.recurrence_pattern
          );

          console.log('Next due date calculated:', nextDueDate);

          if (nextDueDate) {
            // Create the next occurrence directly in the database
            const nextTaskData = {
              title: currentTask.title,
              description: currentTask.description,
              category: currentTask.category,
              subcategory: currentTask.subcategory,
              priority: currentTask.priority,
              priority_level: currentTask.priority_level,
              due_date: nextDueDate,
              is_recurring: currentTask.is_recurring,
              recurrence_pattern: currentTask.recurrence_pattern,
              recurrence_end_date: currentTask.recurrence_end_date,
              home_id: currentTask.home_id,
              notes: currentTask.notes,
              assigned_vendor_id: currentTask.assigned_vendor_id,
              assigned_user_id: currentTask.assigned_user_id,
              instructions: currentTask.instructions,
              estimated_cost: currentTask.estimated_cost,
              room_location: currentTask.room_location,
              equipment_required: currentTask.equipment_required,
              safety_notes: currentTask.safety_notes,
              estimated_duration_minutes: currentTask.estimated_duration_minutes,
              task_type: currentTask.task_type,
              is_active: true,
              status: 'pending',
              next_due: nextDueDate,
              user_id: user?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            console.log('Creating next occurrence with data:', nextTaskData);

            // Insert the next occurrence directly
            const { data: newTask, error: insertError } = await supabase
              .from('tasks')
              .insert(nextTaskData)
              .select('*')
              .single();

            if (insertError) {
              console.error('Error creating next occurrence:', insertError);
              throw insertError;
            }

            console.log('Successfully created next occurrence:', newTask);

            // Prepare the new task for state update
            newTaskToAdd = {
              ...newTask,
              task_history: []
            } as unknown as TaskItem;

            // Create calendar event for the next occurrence
            if (newTaskToAdd.is_recurring && newTaskToAdd.recurrence_pattern) {
              createRecurringCalendarEvents(newTaskToAdd);
            } else {
              createCalendarEventFromTask(newTaskToAdd);
            }
          }
        }
      } else {
        // Uncompleting the task
        taskUpdates = {
          status: 'pending',
          completed_by_type: null,
          completed_by_vendor_id: null,
          completed_by_external_name: null,
          completed_at: null,
          completion_verification_status: null,
          completion_notes: null,
          completion_date: null
        };
      }

      await updateTask(taskId, taskUpdates);

      // Update local state for immediate UI update - combine both updates
      setTasks(current => {
        console.log('Updating tasks state. Current count:', current.length);
        
        // First, update the completed task
        const updatedTasks = current.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                ...taskUpdates
              }
            : task
        );
        
        // Then, add the new task if it exists
        if (newTaskToAdd) {
          console.log('Adding new task to state:', newTaskToAdd.title, 'New task ID:', newTaskToAdd.id);
          const finalTasks = [newTaskToAdd, ...updatedTasks];
          console.log('Final task count after adding new task:', finalTasks.length);
          return finalTasks;
        }
        
        console.log('No new task to add, final count:', updatedTasks.length);
        return updatedTasks;
      });

      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('State update completed. Current tasks count:', tasks.length);
      }, 100);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  };

  // Helper function to calculate the next due date for recurring tasks
  const calculateNextDueDate = (currentDueDate: string | null, recurrencePattern: string): string | null => {
    if (!currentDueDate) {
      console.log('No current due date provided for next due date calculation');
      return null;
    }

    console.log('Calculating next due date:', { currentDueDate, recurrencePattern });

    const currentDate = new Date(currentDueDate);
    const nextDate = new Date(currentDate);

    // Handle invalid date
    if (isNaN(currentDate.getTime())) {
      console.log('Invalid current due date:', currentDueDate);
      return null;
    }

    switch (recurrencePattern.toLowerCase()) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'bi-weekly':
      case 'biweekly':
        nextDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'semi-annually':
        nextDate.setMonth(currentDate.getMonth() + 6);
        break;
      case 'annually':
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        console.log('Unknown recurrence pattern:', recurrencePattern);
        return null;
    }

    const result = nextDate.toISOString().split('T')[0];
    console.log('Next due date calculated:', result);
    return result;
  };

  // Get task history
  
  // Set up real-time subscription for tasks table
  const handleTaskChange = useCallback((payload: any) => {
    console.log('TasksContext: Real-time update received:', {
      eventType: payload.eventType,
      taskId: payload.new?.id || payload.old?.id,
      oldTitle: payload.old?.title,
      newTitle: payload.new?.title,
      oldDueDate: payload.old?.due_date,
      newDueDate: payload.new?.due_date
    });
    
    const eventType = payload.eventType;

    if (eventType === 'INSERT') {
      console.log('TasksContext: Processing INSERT event for task:', payload.new?.title);
      // For new tasks, we need to fetch to get the homes relationship
      fetchTasks();
      
      // Create calendar event for new task - only if task is active
      if (payload.new.is_active !== false) {
        if (payload.new.is_recurring && payload.new.recurrence_pattern) {
          // For recurring tasks, only create recurring calendar events
          createRecurringCalendarEvents(payload.new);
        } else {
          // For non-recurring tasks, only create single calendar event
          createCalendarEventFromTask(payload.new);
        }
      } else {
        console.log('Task created as inactive via real-time update, skipping calendar event creation');
      }
    } 
    else if (eventType === 'UPDATE') {
      console.log('TasksContext: Processing UPDATE event for task:', payload.new?.title);
      // For updates, we need to fetch to get the homes relationship
      fetchTasks();
      
      // Handle task deactivation - remove calendar events when task is deactivated
      const taskDeactivated = payload.old.is_active !== false && payload.new.is_active === false;
      if (taskDeactivated) {
        console.log('TasksContext: Task deactivated via real-time update, removing calendar events for task:', payload.new.id);
        removeEventsByTaskId(payload.new.id);
        // Refresh calendar events to ensure UI is updated
        setTimeout(() => refreshEvents(), 200);
        return; // Skip other calendar updates for deactivated tasks
      }
      
      // Update calendar events if due date changed, task became recurring, recurrence pattern changed, or title changed
      const dueDateChanged = payload.new.due_date !== payload.old.due_date;
      const becameRecurring = !payload.old.is_recurring && payload.new.is_recurring;
      const recurrencePatternChanged = payload.old.recurrence_pattern !== payload.new.recurrence_pattern;
      const titleChanged = payload.old.title !== payload.new.title;
      
      if (dueDateChanged || becameRecurring || recurrencePatternChanged || titleChanged) {
        console.log('TasksContext: Updating calendar events due to changes:', {
          dueDateChanged,
          becameRecurring,
          recurrencePatternChanged,
          titleChanged,
          oldTitle: payload.old.title,
          newTitle: payload.new.title,
          oldDueDate: payload.old.due_date,
          newDueDate: payload.new.due_date
        });
        
        // Delete old calendar events for this task
        supabase
          .from('calendar_events')
          .delete()
          .eq('task_id', payload.new.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error deleting old calendar events:', error);
            } else {
              console.log('Successfully deleted old calendar events for task:', payload.new.id);
              // Create new calendar events - only create one type based on recurrence
              if (payload.new.is_recurring && payload.new.recurrence_pattern) {
                // For recurring tasks, only create recurring calendar events
                createRecurringCalendarEvents(payload.new);
              } else {
                // For non-recurring tasks, only create single calendar event
                createCalendarEventFromTask(payload.new);
              }
            }
          });
      } else {
        console.log('TasksContext: No calendar-relevant changes detected, skipping calendar update');
      }
    } 
    else if (eventType === 'DELETE') {
      console.log('TasksContext: Processing DELETE event for task:', payload.old?.title);
      setTasks(current => 
        current.filter(task => task.id !== payload.old.id)
      );
      
      // Delete associated calendar events immediately using CalendarContext method
      if (payload.old.id) {
        removeEventsByTaskId(payload.old.id);
        // Refresh calendar events to ensure UI is properly updated
        setTimeout(() => refreshEvents(), 100);
      }
    }
  }, [fetchTasks, createCalendarEventFromTask, createRecurringCalendarEvents, removeEventsByTaskId, refreshEvents]);

  // Set up the real-time subscription
  useRealTimeSubscription(
    { 
      table: 'tasks'
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
  }, [fetchTasks, user?.id]);

  // Delete a task
  const deleteTask = async (taskId: string) => {
    try {
      // First, remove all associated calendar events using the CalendarContext method
      await removeEventsByTaskId(taskId);
      
      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
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
    toggleTaskActive,
    completeTask,
    onRefresh,
    syncTasksToCalendar,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}; 