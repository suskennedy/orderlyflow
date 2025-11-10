import { useCallback, useEffect } from 'react';
import { CalendarEvent } from '../../types/database';
import { useCalendarStore } from '../stores/calendarStore';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useCalendar() {
  const { user } = useAuth();
  const {
    events,
    loading,
    refreshing,
    currentHomeId,
    setEvents,
    setCurrentHome,
    fetchEvents,
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
    cleanupOrphanedEvents,
  } = useCalendarStore();

  // Helper function to sort events by start time
  const sortEvents = useCallback((eventsList: CalendarEvent[]) => {
    return [...eventsList].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, []);

  // Handle real-time calendar event updates
  const handleEventChange = useCallback((payload: any) => {
    try {
      console.log('Calendar event change detected:', payload.eventType, payload.new?.title);
      
      if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
        const store = useCalendarStore.getState();
        const currentEvents = store.events;

        switch (payload.eventType) {
          case 'INSERT': {
            const newEvent = payload.new as CalendarEvent;
            if (!newEvent || !newEvent.id) {
              console.error('Invalid new event data received');
              return;
            }
            
            console.log('New calendar event received:', newEvent);
            if (!currentEvents.some(e => e.id === newEvent.id)) {
              console.log('Adding new event to calendar, total events:', currentEvents.length + 1);
              setEvents(sortEvents([...currentEvents, newEvent]));
            } else {
              console.log('Event already exists, skipping duplicate');
            }
            break;
          }
            
          case 'UPDATE': {
            const updatedEvent = payload.new as CalendarEvent;
            if (!updatedEvent || !updatedEvent.id) {
              console.error('Invalid updated event data received');
              return;
            }
            
            console.log('Calendar event updated:', updatedEvent);
            setEvents(sortEvents(currentEvents.map(event => 
              event.id === updatedEvent.id ? updatedEvent : event
            )));
            break;
          }
            
          case 'DELETE': {
            if (payload.old?.id) {
              console.log('Calendar event deleted:', payload.old.id);
              const filtered = currentEvents.filter(event => event.id !== payload.old.id);
              console.log(`Removed event ${payload.old.id}, remaining events:`, filtered.length);
              setEvents(filtered);
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
  }, [user?.id, setEvents, sortEvents]);

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
      fetchEvents(user.id);
    } else {
      setEvents([]);
      useCalendarStore.setState({ loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user?.id to avoid infinite loops

  return {
    events: Array.isArray(events) ? events : [],
    loading,
    refreshing,
    currentHomeId,
    addEvent,
    updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => updateEvent(eventId, updates),
    deleteEvent: (eventId: string) => deleteEvent(eventId),
    removeEventsByTaskId: (taskId: string) => user?.id ? removeEventsByTaskId(taskId, user.id) : Promise.resolve(),
    removeEventsByHomeTaskId: (homeTaskId: string) => user?.id ? removeEventsByHomeTaskId(homeTaskId, user.id) : Promise.resolve(),
    refreshEvents: () => user?.id ? refreshEvents(user.id) : Promise.resolve(),
    onRefresh: () => user?.id ? onRefresh(user.id) : Promise.resolve(),
    getAgendaEvents,
    getEventsForHome: (homeId: string) => user?.id ? getEventsForHome(homeId, user.id) : Promise.resolve([]),
    getFilteredEvents,
    setCurrentHome,
    cleanupOrphanedEvents: () => user?.id ? cleanupOrphanedEvents(user.id) : Promise.resolve(),
  };
}

