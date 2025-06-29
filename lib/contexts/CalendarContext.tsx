import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  color?: string | null;
  all_day?: boolean | null;
  apple_event_id?: string | null;
  google_event_id?: string | null;
  home_id?: string | null;
  task_id?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
}

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  refreshing: boolean;
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{ ...eventData, user_id: user.id }])
        .select('*')
        .single();

      if (error) throw error;
      
      setEvents(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
      Alert.alert('Success', 'Event added successfully');
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      setEvents(prev => prev.map(event => event.id === id ? data : event)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
      Alert.alert('Success', 'Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      Alert.alert('Success', 'Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchEvents(); // Refetch to get updated data
          } else if (payload.eventType === 'UPDATE') {
            fetchEvents(); // Refetch to get updated data
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(event => event.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: CalendarContextType = {
    events,
    loading,
    refreshing,
    fetchEvents,
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
} 