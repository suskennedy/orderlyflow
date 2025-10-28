import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CalendarEvent } from '../../types/database';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  refreshing: boolean;
  currentHomeId: string | null;
  addEvent: (event: Partial<CalendarEvent>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  removeEventsByTaskId: (taskId: string) => void;
  removeEventsByHomeTaskId: (homeTaskId: string) => void;
  refreshEvents: () => Promise<void>;
  onRefresh: () => Promise<void>;
  getAgendaEvents: () => CalendarEvent[];
  getEventsForHome: (homeId: string) => Promise<CalendarEvent[]>;
  getFilteredEvents: () => CalendarEvent[];
  setCurrentHome: (homeId: string | null) => void;
  cleanupOrphanedEvents: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider = ({ children }: CalendarProviderProps) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);

  // Helper function to sort events by start time
  const sortEvents = useCallback((eventsList: CalendarEvent[]) => {
    return [...eventsList].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, []);

  // Get filtered events based on current home selection
  const getFilteredEvents = useCallback(() => {
    // Events are already filtered by home in fetchEvents, so just return them
    return events;
  }, [events]);

  // Helper function to get agenda events (grouped recurring tasks)
  const getAgendaEvents = useCallback(() => {
    const now = new Date();
    const filteredEvents = getFilteredEvents();
    const futureEvents = filteredEvents.filter(event => new Date(event.start_time) >= now);
    
    console.log('Processing agenda events:', {
      totalEvents: events.length,
      filteredEvents: filteredEvents.length,
      futureEvents: futureEvents.length
    });
    
    // Group events by task_id, home_task_id, repair_id, or project_id to handle recurring tasks
    const taskGroups = new Map<string, CalendarEvent[]>();
    const nonTaskEvents: CalendarEvent[] = [];
    
    futureEvents.forEach(event => {
      const groupKey = event.task_id || event.home_task_id || event.repair_id || event.project_id;
      if (groupKey) {
        // This is a task/repair/project event
        if (!taskGroups.has(groupKey)) {
          taskGroups.set(groupKey, []);
        }
        taskGroups.get(groupKey)!.push(event);
      } else {
        // This is a regular calendar event
        nonTaskEvents.push(event);
      }
    });
    
    console.log('Task groups in agenda:', taskGroups.size);
    
    // For each task group, take only the next occurrence
    const nextTaskEvents: CalendarEvent[] = [];
    taskGroups.forEach((taskEvents, groupKey) => {
      if (taskEvents.length > 1 || taskEvents[0]?.is_recurring) {
        // This is a recurring task - take the next occurrence
        const nextEvent = taskEvents.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )[0];
        
        // Modify the title to indicate it's recurring if not already marked
        if (!nextEvent.title.includes('(Recurring)')) {
          nextEvent.title = `${nextEvent.title} (Recurring)`;
        }
        nextTaskEvents.push(nextEvent);
        console.log(`Recurring task in agenda: ${nextEvent.title} on ${nextEvent.start_time}`);
      } else {
        // Single occurrence task
        nextTaskEvents.push(taskEvents[0]);
      }
    });
    
    const result = sortEvents([...nextTaskEvents, ...nonTaskEvents]);
    console.log('Final agenda events:', result.length);
    return result;
  }, [events, sortEvents, getFilteredEvents]);

  // Get events for a specific home using the new schema
  const getEventsForHome = useCallback(async (homeId: string) => {
    if (!user?.id || !homeId) return [];

    try {
      // Fetch events that belong to this specific home using the new home_id column
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('home_id', homeId)
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events for home:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching events for home:', error);
      return [];
    }
  }, [user?.id]);

  // Set current home for filtering
  const setCurrentHome = useCallback((homeId: string | null) => {
    setCurrentHomeId(homeId);
  }, []);

  // Helper function to clean up orphaned events in fetched data
  const cleanupOrphanedEventsInData = useCallback(async (data: CalendarEvent[]) => {
    if (!user?.id || !data || data.length === 0) return;

    try {
      const taskEvents = data.filter(event => event.task_id);
      if (taskEvents.length === 0) return;

      const taskIds = taskEvents.map(event => event.task_id).filter(Boolean);
      
      // Check which tasks still exist
      const { data: existingTasks, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .in('id', taskIds as string[]);
        
      if (taskError) {
        console.error('Error checking existing tasks:', taskError);
        return;
      }
        
      const existingTaskIds = new Set(existingTasks?.map(task => task.id) || []);
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
    } catch (error) {
      console.error('Error during orphaned events cleanup:', error);
    }
  }, [user?.id]);

  // Fetch calendar events from Supabase
  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('=== FETCHING CALENDAR EVENTS ===');
      console.log('Fetching calendar events for user:', user.id);
      console.log('Current home ID for filtering:', currentHomeId);
      
      let query;
      
      // Simplified approach: always use calendar_events table directly
      // The home filtering should be handled at the application level
      query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
      
      const { data, error } = await query.order('start_time', { ascending: true });
      
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
        
        // Clean up orphaned calendar events (events that reference non-existent tasks)
        await cleanupOrphanedEventsInData(data);
      }
      
      setEvents(sortEvents(data as CalendarEvent[]));
      console.log('=== END FETCHING CALENDAR EVENTS ===');
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      // Set empty array on error to prevent UI issues
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, sortEvents, currentHomeId, cleanupOrphanedEventsInData]);

  // Handle real-time calendar event updates
  const handleEventChange = useCallback((payload: any) => {
    try {
      console.log('Calendar event change detected:', payload.eventType, payload.new?.title);
      
      if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
        switch (payload.eventType) {
          case 'INSERT': {
            const newEvent = payload.new as CalendarEvent;
            if (!newEvent || !newEvent.id) {
              console.error('Invalid new event data received');
              return;
            }
            
            console.log('New calendar event received:', newEvent);
            setEvents(current => {
              // Check if event already exists (prevent duplicates)
              if (current.some(e => e.id === newEvent.id)) {
                console.log('Event already exists, skipping duplicate');
                return current;
              }
              console.log('Adding new event to calendar, total events:', current.length + 1);
              return sortEvents([...current, newEvent]);
            });
            break;
          }
            
          case 'UPDATE': {
            const updatedEvent = payload.new as CalendarEvent;
            if (!updatedEvent || !updatedEvent.id) {
              console.error('Invalid updated event data received');
              return;
            }
            
            console.log('Calendar event updated:', updatedEvent);
            setEvents(current => 
              sortEvents(current.map(event => 
                event.id === updatedEvent.id ? updatedEvent : event
              ))
            );
            break;
          }
            
          case 'DELETE': {
            if (payload.old?.id) {
              console.log('Calendar event deleted:', payload.old.id);
              setEvents(current => {
                const filtered = current.filter(event => event.id !== payload.old.id);
                console.log(`Removed event ${payload.old.id}, remaining events:`, filtered.length);
                return filtered;
              });
            }
            break;
          }
          
          default:
            console.log('Unknown event type:', payload.eventType);
        }
      }
    } catch (error) {
      console.error('Error handling calendar event change:', error);
    }
  }, [user?.id, sortEvents]);

  // Set up real-time subscription
  useRealTimeSubscription(
    { 
      table: 'calendar_events',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleEventChange
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [user?.id, fetchEvents]);

  // Add a new calendar event (for immediate UI update)
  const addEvent = (newEvent: Partial<CalendarEvent>) => {
    const tempId = `temp_${Date.now()}`;
    const eventWithTempId = {
      ...newEvent,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CalendarEvent;
    
    console.log('Adding event to local state for immediate UI update:', eventWithTempId);
    setEvents(current => sortEvents([...current, eventWithTempId]));
  };

  // Update an existing calendar event
  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    if (!eventId || !updates) {
      console.error('Invalid parameters for updateEvent');
      throw new Error('Invalid parameters');
    }

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId);
        
      if (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }
      
      // Update locally for immediate UI update
      setEvents(current => 
        sortEvents(current.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        ))
      );
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  };

  // Delete a calendar event
  const deleteEvent = async (eventId: string) => {
    if (!eventId) {
      console.error('Invalid eventId for deleteEvent');
      throw new Error('Invalid eventId');
    }

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
      
      // Update locally for immediate UI update
      setEvents(current => current.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  };

  // Refresh calendar events
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  // Refresh events (same as fetchEvents but can be called externally)
  const refreshEvents = async () => {
    await fetchEvents();
  };

  // Manual cleanup for orphaned calendar events
  const cleanupOrphanedEvents = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Attempting to clean up orphaned calendar events for user:', user.id);

      const { data: orphanedEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .is('task_id', null); // Find events that have no task_id

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
          // Re-fetch events after cleanup
          const { data: cleanedData, error: refetchError } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', user.id)
            .order('start_time', { ascending: true });

          if (refetchError) throw refetchError;
          setEvents(sortEvents(cleanedData as CalendarEvent[]));
        }
      } else {
        console.log('No orphaned calendar events found to clean up.');
      }
    } catch (error) {
      console.error('Error during orphaned event cleanup:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, sortEvents]);

  // Remove calendar events by task_id
  const removeEventsByTaskId = useCallback(async (taskId: string) => {
    if (!user?.id) return;

    try {
      console.log(`Removing calendar events for task_id: ${taskId}`);
      
      // First, remove events from local state immediately for better UX
      setEvents(current => {
        const filtered = current.filter(event => event.task_id !== taskId);
        console.log(`Removed events for task ${taskId} from local state, remaining:`, filtered.length);
        return filtered;
      });

      // Then delete from database
      const { data: eventsToDelete, error: selectError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', user.id);

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
          // If deletion failed, refresh events to restore correct state
          await fetchEvents();
        } else {
          console.log('Successfully deleted calendar events by task_id');
        }
      } else {
        console.log(`No calendar events found for task_id: ${taskId} to delete.`);
      }
    } catch (error) {
      console.error('Error during calendar events by task_id removal:', error);
      // If there's an error, refresh events to ensure correct state
      await fetchEvents();
    }
  }, [user?.id, fetchEvents]);

  // Remove calendar events by home_task_id
  const removeEventsByHomeTaskId = useCallback(async (homeTaskId: string) => {
    if (!user?.id) return;

    try {
      console.log(`Removing calendar events for home_task_id: ${homeTaskId}`);
      
      // First, remove events from local state immediately for better UX
      setEvents(current => {
        const filtered = current.filter(event => event.home_task_id !== homeTaskId);
        console.log(`Removed events for home_task ${homeTaskId} from local state, remaining:`, filtered.length);
        return filtered;
      });

      // Then delete from database
      const { data: eventsToDelete, error: selectError } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('home_task_id', homeTaskId)
        .eq('user_id', user.id);

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
          // If deletion failed, refresh events to restore correct state
          await fetchEvents();
        } else {
          console.log('Successfully deleted calendar events by home_task_id');
        }
      } else {
        console.log(`No calendar events found for home_task_id: ${homeTaskId} to delete.`);
      }
    } catch (error) {
      console.error('Error during calendar events by home_task_id removal:', error);
      // If there's an error, refresh events to ensure correct state
      await fetchEvents();
    }
  }, [user?.id, fetchEvents]);

  const value = {
    events,
    loading,
    refreshing,
    currentHomeId,
    addEvent,
    updateEvent,
    deleteEvent,
    removeEventsByTaskId,
    removeEventsByHomeTaskId,
    refreshEvents,
    onRefresh,
    getAgendaEvents,
    getEventsForHome,
    getFilteredEvents,
    setCurrentHome,
    cleanupOrphanedEvents,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};