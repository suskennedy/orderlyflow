import { useCallback, useEffect } from 'react';
import { CalendarEvent } from '../../components/calendar/CalendarMonthView';
import { supabase } from '../supabase';

type SubscriptionCallback = {
  onInsert?: (newEvent: CalendarEvent) => void;
  onUpdate?: (updatedEvent: CalendarEvent) => void;
  onDelete?: (deletedEventId: string) => void;
};

export function useCalendarRealTime(userId: string | undefined, callbacks: SubscriptionCallback) {
  const setupSubscription = useCallback(() => {
    if (!userId) return null;

    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Calendar event change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              if (callbacks.onInsert) {
                callbacks.onInsert(payload.new as CalendarEvent);
              }
              break;
              
            case 'UPDATE':
              if (callbacks.onUpdate) {
                callbacks.onUpdate(payload.new as CalendarEvent);
              }
              break;
              
            case 'DELETE':
              if (callbacks.onDelete && payload.old.id) {
                callbacks.onDelete(payload.old.id);
              }
              break;
          }
        }
      )
      .subscribe();
      
    return channel;
  }, [userId, callbacks]);
  
  useEffect(() => {
    const channel = setupSubscription();
    
    // Clean up subscription when component unmounts
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [setupSubscription]);
}