import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { fetchTaskCountsForHomes, useHomesStore } from '../stores/homesStore';

/**
 * Centralized subscription manager for homes
 * This should be used once at the app level to set up real-time subscriptions
 */
export function useHomesSubscriptionManager() {
  const { user } = useAuth();
  const taskCountUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for homes table
  const handleHomeChange = useCallback(async (payload: any) => {
    // Only process changes relevant to the current user
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;
      const store = useHomesStore.getState();

      if (eventType === 'INSERT') {
        const newHome = payload.new;
        const currentHomes = store.homes;
        
        // Check if home already exists to prevent duplicates
        if (currentHomes.some(home => home.id === newHome.id)) {
          console.log('Home already exists in state, skipping duplicate');
          return;
        }
        
        console.log('Adding new home to state:', newHome.id);
        useHomesStore.setState({ homes: [...currentHomes, newHome] });
        
        // Fetch task counts for the new home
        const taskCounts = await fetchTaskCountsForHomes([newHome.id]);
        const counts = taskCounts[newHome.id] || { total: 0, active: 0, completed: 0 };
        const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
        
        const currentHomesWithCounts = store.homesWithTaskCounts;
        useHomesStore.setState({
          homesWithTaskCounts: [
            ...currentHomesWithCounts,
            {
              ...newHome,
              taskCounts: {
                ...counts,
                completionRate
              }
            }
          ]
        });
      } 
      else if (eventType === 'UPDATE') {
        const currentHomes = store.homes;
        useHomesStore.setState({
          homes: currentHomes.map(home => 
            home.id === payload.new.id ? payload.new : home
          )
        });
        
        // Only update task counts if the home data actually changed
        const existingHome = store.homes.find(h => h.id === payload.new.id);
        if (existingHome && (
          existingHome.name !== payload.new.name ||
          existingHome.address !== payload.new.address
        )) {
          // Update task counts for the updated home
          const taskCounts = await fetchTaskCountsForHomes([payload.new.id]);
          const counts = taskCounts[payload.new.id] || { total: 0, active: 0, completed: 0 };
          const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
          
          const currentHomesWithCounts = store.homesWithTaskCounts;
          useHomesStore.setState({
            homesWithTaskCounts: currentHomesWithCounts.map(home => 
              home.id === payload.new.id 
                ? { ...payload.new, taskCounts: { ...counts, completionRate } }
                : home
            )
          });
        }
      } 
      else if (eventType === 'DELETE') {
        const currentHomes = store.homes;
        const currentHomesWithCounts = store.homesWithTaskCounts;
        useHomesStore.setState({
          homes: currentHomes.filter(home => home.id !== payload.old.id),
          homesWithTaskCounts: currentHomesWithCounts.filter(home => home.id !== payload.old.id)
        });
      }
    }
  }, [user?.id]);

  // Set up real-time subscription for home_tasks to update counts
  const handleHomeTaskChange = useCallback(async (payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      const store = useHomesStore.getState();
      
      // Check if this home belongs to the current user
      const home = store.homes.find(h => h.id === homeId);
      if (home && home.user_id === user?.id) {
        // Clear existing timer
        if (taskCountUpdateTimerRef.current) {
          clearTimeout(taskCountUpdateTimerRef.current);
        }
        
        // Set new debounced timer
        taskCountUpdateTimerRef.current = setTimeout(async () => {
          await store.refreshTaskCounts(homeId);
        }, 300); // 300ms debounce
      }
    }
  }, [user?.id]);

  // Set up the real-time subscriptions
  useRealTimeSubscription(
    { 
      table: 'homes',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleHomeChange
  );

  useRealTimeSubscription(
    { 
      table: 'home_tasks',
    },
    handleHomeTaskChange
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      useHomesStore.getState().fetchHomes();
    } else {
      useHomesStore.setState({ homes: [], homesWithTaskCounts: [], loading: false });
    }
     
  }, [user?.id]); // Only depend on user?.id to avoid infinite loops

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (taskCountUpdateTimerRef.current) {
        clearTimeout(taskCountUpdateTimerRef.current);
      }
    };
  }, []);
}

