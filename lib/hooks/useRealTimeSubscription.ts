import { useEffect } from 'react';
import { supabase } from '../supabase';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions {
  schema?: string;
  table: string;
  event?: PostgresEvent;
  filter?: string;
}

export function useRealTimeSubscription(
  options: SubscriptionOptions,
  callback: (payload: any) => void
) {
  useEffect(() => {
    // Create a unique channel name
    const channelName = `${options.table}-${Date.now()}`;
    
    // Set up the subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter,
        } as any,
        (payload:any) => {
          console.log(`Real-time update from ${options.table}:`, payload);
          callback(payload);
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      channel.unsubscribe();
    };
  }, [options.table, options.event, options.filter, callback]);
}