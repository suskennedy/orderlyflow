import { useCallback, useEffect, useRef } from 'react';
import { useTasksStore } from '../stores/tasksStore';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useTasks() {
  const { user } = useAuth();
  const {
    templateTasks,
    homeTasksByHome,
    allHomeTasks,
    currentHomeId,
    loading,
    setTemplateTasks,
    setHomeTasks,
    setAllHomeTasks,
    setCurrentHomeId,
    setLoading,
    fetchTemplateTasks,
    fetchHomeTasks,
    fetchAllHomeTasks,
    activateTemplateForHome,
    createCustomTask,
    updateHomeTask,
    completeHomeTask,
    createHomeTaskWithCalendar,
    updateHomeTaskWithCalendar,
  } = useTasksStore();

  // Get home tasks for current home
  const homeTasks = currentHomeId ? (homeTasksByHome[currentHomeId] || []) : [];

  // Debounce timer for task updates
  const taskUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle real-time changes for home_tasks, repairs, and projects
  const handleHomeTaskChange = useCallback(async (payload: any) => {
    const homeId = payload.new?.home_id || payload.old?.home_id;
    
    if (!homeId || !user?.id) return;
    
    // Clear existing timer
    if (taskUpdateTimerRef.current) {
      clearTimeout(taskUpdateTimerRef.current);
    }
    
    // Set new debounced timer
    const timer = setTimeout(async () => {
      const store = useTasksStore.getState();
      
      // Only fetch if not already loading to prevent loops
      if (store.loading) {
        console.log('useTasks: Skipping real-time update - already loading');
        return;
      }
      
      try {
        // Always refresh all home tasks for dashboard
        await store.fetchAllHomeTasks(user.id);
        
        // Also refresh current home tasks if this change affects the current home
        if (homeId === store.currentHomeId) {
          await store.fetchHomeTasks(homeId);
        }
      } catch (error) {
        console.error('Error handling real-time task change:', error);
      }
    }, 500); // Increased debounce to 500ms to reduce frequency
    
    taskUpdateTimerRef.current = timer;
  }, [user?.id]);

  // Set up real-time subscription for home_tasks
  useRealTimeSubscription(
    { 
      table: 'home_tasks',
    },
    handleHomeTaskChange
  );

  // Set up real-time subscription for repairs (affects home_tasks display)
  useRealTimeSubscription(
    { 
      table: 'repairs',
    },
    handleHomeTaskChange
  );

  // Set up real-time subscription for projects (affects home_tasks display)
  useRealTimeSubscription(
    { 
      table: 'projects',
    },
    handleHomeTaskChange
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (taskUpdateTimerRef.current) {
        clearTimeout(taskUpdateTimerRef.current);
      }
    };
  }, []);

  // Initial data fetch - use ref to prevent multiple calls
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!user?.id || hasFetchedRef.current) return;
    
    console.log('useTasks: useEffect called, user:', user?.id);
    hasFetchedRef.current = true;
    
    const initialize = async () => {
      await fetchTemplateTasks();
      await fetchAllHomeTasks(user.id);
    };
    
    initialize().catch(console.error);
    
    // Reset on user change
    return () => {
      hasFetchedRef.current = false;
    };
  }, [user?.id, fetchTemplateTasks, fetchAllHomeTasks]);

  // Fetch home tasks when currentHomeId changes - use ref to prevent loops
  const lastHomeIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    // Skip if same homeId or already fetching
    if (currentHomeId === lastHomeIdRef.current || isFetchingRef.current) return;
    
    lastHomeIdRef.current = currentHomeId;
    
    if (currentHomeId) {
      isFetchingRef.current = true;
      fetchHomeTasks(currentHomeId)
        .finally(() => {
          isFetchingRef.current = false;
        });
    } else {
      setHomeTasks('', []);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHomeId]); // Only depend on currentHomeId - Zustand actions are stable

  // Memoize fetchAllHomeTasks to prevent infinite loops
  const memoizedFetchAllHomeTasks = useCallback(() => {
    if (!user?.id) return Promise.resolve();
    return fetchAllHomeTasks(user.id);
  }, [user?.id, fetchAllHomeTasks]);

  return {
    // Data
    templateTasks: Array.isArray(templateTasks) ? templateTasks : [],
    homeTasks: Array.isArray(homeTasks) ? homeTasks : [],
    allHomeTasks: Array.isArray(allHomeTasks) ? allHomeTasks : [],
    currentHomeId,
    loading,
    
    // Functions
    fetchTemplateTasks,
    fetchHomeTasks,
    fetchAllHomeTasks: memoizedFetchAllHomeTasks,
    activateTemplateForHome: (templateId: string, homeId: string, details: any) => 
      user?.id ? activateTemplateForHome(templateId, homeId, user.id, details) : Promise.reject(new Error('User not authenticated')),
    createCustomTask,
    updateHomeTask,
    completeHomeTask: (homeTaskId: string, completionData: any) => 
      completeHomeTask(homeTaskId, currentHomeId, completionData),
    setCurrentHome: (homeId: string | null) => {
      // Just set the homeId - the useEffect will handle fetching
      setCurrentHomeId(homeId);
      if (!homeId) {
        setHomeTasks('', []);
        setLoading(false);
      }
    },
    
    // Calendar integration functions
    createHomeTaskWithCalendar: (homeId: string, taskData: any, calendarOptions?: any) => 
      user?.id ? createHomeTaskWithCalendar(homeId, user.id, taskData, calendarOptions) : Promise.reject(new Error('User not authenticated')),
    updateHomeTaskWithCalendar: (homeTaskId: string, updates: any, calendarOptions?: any) => 
      user?.id ? updateHomeTaskWithCalendar(homeTaskId, user.id, updates, calendarOptions) : Promise.reject(new Error('User not authenticated')),
  };
}

