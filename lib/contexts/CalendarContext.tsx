import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CalendarEvent } from '../../components/calendar/CalendarMonthView';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  refreshing: boolean;
  addEvent: (event: Partial<CalendarEvent>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
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

  // Fetch calendar events from Supabase
  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setEvents(data as CalendarEvent[]);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Handle real-time calendar event updates
  const handleEventChange = useCallback((payload: any) => {
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      console.log('Calendar event change detected:', payload.eventType);
      
      switch (payload.eventType) {
        case 'INSERT': {
          const newEvent = payload.new as CalendarEvent;
          setEvents(current => {
            // Check if event already exists (prevent duplicates)
            if (current.some(e => e.id === newEvent.id)) {
              return current;
            }
            return [...current, newEvent];
          });
          break;
        }
          
        case 'UPDATE': {
          const updatedEvent = payload.new as CalendarEvent;
          setEvents(current => 
            current.map(event => 
              event.id === updatedEvent.id ? updatedEvent : event
            )
          );
          break;
        }
          
        case 'DELETE': {
          if (payload.old?.id) {
            setEvents(current => 
              current.filter(event => event.id !== payload.old.id)
            );
          }
          break;
        }
      }
    }
  }, [user?.id]);

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
  }, [user, fetchEvents]);

  // Add a new calendar event (for immediate UI update)
  const addEvent = (newEvent: Partial<CalendarEvent>) => {
    const tempId = `temp_${Date.now()}`;
    const eventWithTempId = {
      ...newEvent,
      id: tempId,
    } as CalendarEvent;
    
    setEvents(current => [...current, eventWithTempId]);
  };

  // Update an existing calendar event
  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId);
        
      if (error) throw error;
      
      // Update locally for immediate UI update
      setEvents(current => 
        current.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        )
      );
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  };

  // Delete a calendar event
  const deleteEvent = async (eventId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);
        
      if (error) throw error;
      
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

  const value = {
    events,
    loading,
    refreshing,
    addEvent,
    updateEvent,
    deleteEvent,
    onRefresh,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};