import { create } from 'zustand';
import { CalendarEvent } from '../../types/database';
import { supabase } from '../supabase';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  refreshing: boolean;
  currentHomeId: string | null;

  // Actions
  setEvents: (events: CalendarEvent[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setCurrentHome: (homeId: string | null) => void;
  
  fetchEvents: (userId: string) => Promise<void>;
  addEvent: (event: Partial<CalendarEvent>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  removeEventsByTaskId: (taskId: string, userId: string) => Promise<void>;
  removeEventsByHomeTaskId: (homeTaskId: string, userId: string) => Promise<void>;
  refreshEvents: (userId: string) => Promise<void>;
  onRefresh: (userId: string) => Promise<void>;
  getAgendaEvents: () => CalendarEvent[];
  getEventsForHome: (homeId: string, userId: string) => Promise<CalendarEvent[]>;
  getFilteredEvents: () => CalendarEvent[];
  cleanupOrphanedEvents: (userId: string) => Promise<void>;
}

// Helper function to sort events by start time
const sortEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: true,
  refreshing: false,
  currentHomeId: null,

  setEvents: (events) => set({ events: sortEvents(events) }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setCurrentHome: (homeId) => set({ currentHomeId: homeId }),

  fetchEvents: async (userId: string) => {
    if (!userId) return;
    
    try {
      set({ loading: true });
      console.log('=== FETCHING CALENDAR EVENTS ===');
      console.log('Fetching calendar events for user:', userId);
      console.log('Current home ID for filtering:', get().currentHomeId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }
      
      console.log('Raw calendar events from database:', data?.length || 0);
      
      if (data && data.length > 0) {
        const recurringEvents = data.filter((event: CalendarEvent) => event.is_recurring);
        const regularEvents = data.filter((event: CalendarEvent) => !event.is_recurring);
        
        console.log('Regular events:', regularEvents.length);
        console.log('Recurring events:', recurringEvents.length);
        
        // Log recurring events for debugging
        recurringEvents.forEach((event, index) => {
          console.log(`Recurring Event ${index + 1}:`, {
            id: event.id,
            title: event.title,
            is_recurring: event.is_recurring,
            recurrence_pattern: event.recurrence_pattern,
            recurrence_end_date: event.recurrence_end_date,
            start_time: event.start_time,
            task_id: event.task_id
          });
        });
        
        // Clean up orphaned calendar events
        const taskEvents = data.filter((event: CalendarEvent) => event.task_id);
        if (taskEvents.length > 0) {
          const taskIds = taskEvents.map((event: CalendarEvent) => event.task_id).filter(Boolean);
          
          const { data: existingTasks, error: taskError } = await supabase
            .from('tasks')
            .select('id')
            .in('id', taskIds as string[]);
            
          if (!taskError && existingTasks) {
            const existingTaskIds = new Set(existingTasks.map(task => task.id));
            const orphanedEvents = taskEvents.filter(event => 
              event.task_id && !existingTaskIds.has(event.task_id)
            );
            
            if (orphanedEvents.length > 0) {
              console.log(`Found ${orphanedEvents.length} orphaned calendar events, cleaning up...`);
              const orphanedEventIds = orphanedEvents.map(event => event.id);
              
              const { error: cleanupError } = await supabase
                .from('calendar_events')
                .delete()
                .in('id', orphanedEventIds);
                
              if (cleanupError) {
                console.error('Error cleaning up orphaned events:', cleanupError);
              } else {
                console.log('Successfully cleaned up orphaned events');
              }
            }
          }
        }
      }
      
      set({ events: sortEvents((data || []) as CalendarEvent[]) });
      console.log('=== END FETCHING CALENDAR EVENTS ===');
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      set({ events: [] });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  addEvent: (newEvent: Partial<CalendarEvent>) => {
    const tempId = `temp_${Date.now()}`;
    const eventWithTempId = {
      ...newEvent,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CalendarEvent;
    
    console.log('Adding event to local state for immediate UI update:', eventWithTempId);
    set((state) => ({ events: sortEvents([...state.events, eventWithTempId]) }));
  },

  updateEvent: async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!eventId || !updates) {
      console.error('Invalid parameters for updateEvent');
      throw new Error('Invalid parameters');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId);
        
      if (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }
      
      // Update locally for immediate UI update
      set((state) => ({
        events: sortEvents(state.events.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        ))
      }));
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  },

  deleteEvent: async (eventId: string) => {
    if (!eventId) {
      console.error('Invalid eventId for deleteEvent');
      throw new Error('Invalid eventId');
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
      
      set((state) => ({ events: state.events.filter(event => event.id !== eventId) }));
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  },

  removeEventsByTaskId: async (taskId: string, userId: string) => {
    if (!userId) return;

    try {
      console.log(`Removing calendar events for task_id: ${taskId}`);
      
      // First, remove events from local state immediately for better UX
      set((state) => {
        const filtered = state.events.filter(event => event.task_id !== taskId);
        console.log(`Removed events for task ${taskId} from local state, remaining:`, filtered.length);
        return { events: filtered };
      });

      // Then delete from database
      const { data: eventsToDelete, error: selectError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (selectError) {
        console.error('Error selecting events to delete by task_id:', selectError);
        return;
      }

      if (eventsToDelete && eventsToDelete.length > 0) {
        const eventIds = eventsToDelete.map(event => event.id);
        console.log(`Found ${eventIds.length} calendar events to delete for task_id: ${taskId}`);

        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .in('id', eventIds);

        if (deleteError) {
          console.error('Error deleting calendar events by task_id:', deleteError);
          await get().fetchEvents(userId);
        } else {
          console.log('Successfully deleted calendar events by task_id');
        }
      } else {
        console.log(`No calendar events found for task_id: ${taskId} to delete.`);
      }
    } catch (error) {
      console.error('Error during calendar events by task_id removal:', error);
      await get().fetchEvents(userId);
    }
  },

  removeEventsByHomeTaskId: async (homeTaskId: string, userId: string) => {
    if (!userId) return;

    try {
      console.log(`Removing calendar events for home_task_id: ${homeTaskId}`);
      
      // First, remove events from local state immediately for better UX
      set((state) => {
        const filtered = state.events.filter(event => event.home_task_id !== homeTaskId);
        console.log(`Removed events for home_task ${homeTaskId} from local state, remaining:`, filtered.length);
        return { events: filtered };
      });

      // Then delete from database
      const { data: eventsToDelete, error: selectError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('home_task_id', homeTaskId)
        .eq('user_id', userId);

      if (selectError) {
        console.error('Error selecting events to delete by home_task_id:', selectError);
        return;
      }

      if (eventsToDelete && eventsToDelete.length > 0) {
        const eventIds = eventsToDelete.map(event => event.id);
        console.log(`Found ${eventIds.length} calendar events to delete for home_task_id: ${homeTaskId}`);

        const { error: deleteError } = await supabase
          .from('calendar_events')
          .delete()
          .in('id', eventIds);

        if (deleteError) {
          console.error('Error deleting calendar events by home_task_id:', deleteError);
          await get().fetchEvents(userId);
        } else {
          console.log('Successfully deleted calendar events by home_task_id');
        }
      } else {
        console.log(`No calendar events found for home_task_id: ${homeTaskId} to delete.`);
      }
    } catch (error) {
      console.error('Error during calendar events by home_task_id removal:', error);
      await get().fetchEvents(userId);
    }
  },

  refreshEvents: async (userId: string) => {
    await get().fetchEvents(userId);
  },

  onRefresh: async (userId: string) => {
    set({ refreshing: true });
    await get().fetchEvents(userId);
  },

  getAgendaEvents: () => {
    const now = new Date();
    const filteredEvents = get().getFilteredEvents();
    const futureEvents = filteredEvents.filter(event => new Date(event.start_time) >= now);
    
    console.log('Processing agenda events:', {
      totalEvents: get().events.length,
      filteredEvents: filteredEvents.length,
      futureEvents: futureEvents.length
    });
    
    // Group events by task_id, home_task_id, repair_id, or project_id to handle recurring tasks
    const taskGroups = new Map<string, CalendarEvent[]>();
    const nonTaskEvents: CalendarEvent[] = [];
    
    futureEvents.forEach(event => {
      const groupKey = event.task_id || event.home_task_id || event.repair_id || event.project_id;
      if (groupKey) {
        if (!taskGroups.has(groupKey)) {
          taskGroups.set(groupKey, []);
        }
        taskGroups.get(groupKey)!.push(event);
      } else {
        nonTaskEvents.push(event);
      }
    });
    
    console.log('Task groups in agenda:', taskGroups.size);
    
    // For each task group, take only the next occurrence
    const nextTaskEvents: CalendarEvent[] = [];
    taskGroups.forEach((taskEvents, groupKey) => {
      if (taskEvents.length > 1 || taskEvents[0]?.is_recurring) {
        const nextEvent = taskEvents.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )[0];
        
        if (!nextEvent.title.includes('(Recurring)')) {
          nextEvent.title = `${nextEvent.title} (Recurring)`;
        }
        nextTaskEvents.push(nextEvent);
        console.log(`Recurring task in agenda: ${nextEvent.title} on ${nextEvent.start_time}`);
      } else {
        nextTaskEvents.push(taskEvents[0]);
      }
    });
    
    const result = sortEvents([...nextTaskEvents, ...nonTaskEvents]);
    console.log('Final agenda events:', result.length);
    return result;
  },

  getEventsForHome: async (homeId: string, userId: string) => {
    if (!userId || !homeId) return [];

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('home_id', homeId)
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events for home:', error);
        return [];
      }

      return (data || []) as CalendarEvent[];
    } catch (error) {
      console.error('Error fetching events for home:', error);
      return [];
    }
  },

  getFilteredEvents: () => {
    return get().events;
  },

  cleanupOrphanedEvents: async (userId: string) => {
    if (!userId) return;

    try {
      set({ loading: true });
      console.log('Attempting to clean up orphaned calendar events for user:', userId);

      const { data: orphanedEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .is('task_id', null);

      if (orphanedEvents && orphanedEvents.length > 0) {
        const orphanedEventIds = orphanedEvents.map(event => event.id);
        console.log(`Found ${orphanedEventIds.length} orphaned calendar events, cleaning up...`);

        const { error: cleanupError } = await supabase
          .from('calendar_events')
          .delete()
          .in('id', orphanedEventIds);

        if (cleanupError) {
          console.error('Error cleaning up orphaned events:', cleanupError);
        } else {
          console.log('Successfully cleaned up orphaned events');
          const { data: cleanedData, error: refetchError } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: true });

          if (refetchError) throw refetchError;
          set({ events: sortEvents((cleanedData || []) as CalendarEvent[]) });
        }
      } else {
        console.log('No orphaned calendar events found to clean up.');
      }
    } catch (error) {
      console.error('Error during orphaned event cleanup:', error);
    } finally {
      set({ loading: false });
    }
  },

}));

