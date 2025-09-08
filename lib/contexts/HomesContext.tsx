import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Home interface based on the current schema
export interface Home {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_footage?: number | null;
  year_built?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
  user_id?: string | null;
  image_url?: string | null;
  foundation_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  warranty_info?: string | null;
}

// Enhanced home interface with task counts
export interface HomeWithTaskCounts extends Home {
  taskCounts: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
}

interface HomesContextType {
  homes: Home[];
  homesWithTaskCounts: HomeWithTaskCounts[];
  loading: boolean;
  refreshing: boolean;
  createHome: (homeData: Omit<Home, 'id' | 'user_id'>) => Promise<void>;
  updateHome: (homeId: string, updates: Partial<Home>) => Promise<void>;
  deleteHome: (homeId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  getHomeById: (homeId?: string) => Home | undefined;
  getHomeWithTaskCounts: (homeId?: string) => HomeWithTaskCounts | undefined;
  refreshTaskCounts: (homeId?: string) => Promise<void>;
}

const HomesContext = createContext<HomesContextType | undefined>(undefined);

export const useHomes = () => {
  const context = useContext(HomesContext);
  if (!context) {
    throw new Error('useHomes must be used within a HomesProvider');
  }
  return context;
};

interface HomesProviderProps {
  children: ReactNode;
}

export const HomesProvider = ({ children }: HomesProviderProps) => {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [homesWithTaskCounts, setHomesWithTaskCounts] = useState<HomeWithTaskCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch task counts for all homes in a single query
  const fetchTaskCountsForHomes = useCallback(async (homeIds: string[]) => {
    if (homeIds.length === 0) return {};
    
    try {
      const { data, error } = await supabase
        .from('home_tasks')
        .select('home_id, status, is_active')
        .in('home_id', homeIds);
        
      if (error) throw error;
      
      // Calculate counts for each home
      const counts: Record<string, { total: number; active: number; completed: number }> = {};
      
      homeIds.forEach(homeId => {
        counts[homeId] = { total: 0, active: 0, completed: 0 };
      });
      
      data?.forEach(task => {
        if (counts[task.home_id]) {
          counts[task.home_id].total++;
          if (task.status === 'completed') {
            counts[task.home_id].completed++;
          } else if (task.is_active !== false) {
            counts[task.home_id].active++;
          }
        }
      });
      
      return counts;
    } catch (error) {
      console.error('Error fetching task counts:', error);
      return {};
    }
  }, []);

  // Fetch homes from Supabase using user_id
  const fetchHomes = useCallback(async () => {
    if (!user?.id) {
      console.log('fetchHomes: No user ID');
      return;
    }
    
    try {
      setLoading(true);
      console.log('fetchHomes: Starting fetch for user:', user.id);
      
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      console.log('fetchHomes: Homes data:', data);
      setHomes(data || []);
      
      // Fetch task counts for all homes
      if (data && data.length > 0) {
        const homeIds = data.map(home => home.id);
        const taskCounts = await fetchTaskCountsForHomes(homeIds);
        
        // Create enhanced homes with task counts
        const enhancedHomes: HomeWithTaskCounts[] = data.map(home => {
          const counts = taskCounts[home.id] || { total: 0, active: 0, completed: 0 };
          const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
          
          return {
            ...home,
            taskCounts: {
              ...counts,
              completionRate
            }
          };
        });
        
        setHomesWithTaskCounts(enhancedHomes);
      } else {
        setHomesWithTaskCounts([]);
      }
    } catch (error) {
      console.error('Error fetching homes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, fetchTaskCountsForHomes]);

  // Set up real-time subscription for homes table
  const handleHomeChange = useCallback(async (payload: any) => {
    // Only process changes relevant to the current user
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;

      if (eventType === 'INSERT') {
        const newHome = payload.new;
        setHomes(current => {
          // Check if home already exists to prevent duplicates
          if (current.some(home => home.id === newHome.id)) {
            console.log('Home already exists in state, skipping duplicate');
            return current;
          }
          console.log('Adding new home to state:', newHome.id);
          return [...current, newHome];
        });
        
        // Fetch task counts for the new home
        const taskCounts = await fetchTaskCountsForHomes([newHome.id]);
        const counts = taskCounts[newHome.id] || { total: 0, active: 0, completed: 0 };
        const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
        
        setHomesWithTaskCounts(current => [
          ...current,
          {
            ...newHome,
            taskCounts: {
              ...counts,
              completionRate
            }
          }
        ]);
      } 
      else if (eventType === 'UPDATE') {
        setHomes(current => 
          current.map(home => 
            home.id === payload.new.id ? payload.new : home
          )
        );
        
        // Only update task counts if the home data actually changed
        const existingHome = homes.find(h => h.id === payload.new.id);
        if (existingHome && (
          existingHome.name !== payload.new.name ||
          existingHome.address !== payload.new.address
        )) {
          // Update task counts for the updated home
          const taskCounts = await fetchTaskCountsForHomes([payload.new.id]);
          const counts = taskCounts[payload.new.id] || { total: 0, active: 0, completed: 0 };
          const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
          
          setHomesWithTaskCounts(current => 
            current.map(home => 
              home.id === payload.new.id 
                ? { ...payload.new, taskCounts: { ...counts, completionRate } }
                : home
            )
          );
        }
      } 
      else if (eventType === 'DELETE') {
        setHomes(current => 
          current.filter(home => home.id !== payload.old.id)
        );
        
        setHomesWithTaskCounts(current => 
          current.filter(home => home.id !== payload.old.id)
        );
      }
    }
  }, [user?.id, fetchTaskCountsForHomes, homes]);

  // Set up the real-time subscription
  useRealTimeSubscription(
    { 
      table: 'homes',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleHomeChange
  );

  // Debounce timer for task count updates
  const [taskCountUpdateTimer, setTaskCountUpdateTimer] = useState<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for home_tasks to update counts
  const handleHomeTaskChange = useCallback(async (payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      
      // Check if this home belongs to the current user
      const home = homes.find(h => h.id === homeId);
      if (home && home.user_id === user?.id) {
        // Clear existing timer
        if (taskCountUpdateTimer) {
          clearTimeout(taskCountUpdateTimer);
        }
        
        // Set new debounced timer
        const timer = setTimeout(async () => {
          const taskCounts = await fetchTaskCountsForHomes([homeId]);
          const counts = taskCounts[homeId] || { total: 0, active: 0, completed: 0 };
          const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
          
          setHomesWithTaskCounts(current => 
            current.map(h => 
              h.id === homeId 
                ? { ...h, taskCounts: { ...counts, completionRate } }
                : h
            )
          );
        }, 300); // 300ms debounce
        
        setTaskCountUpdateTimer(timer);
      }
    }
  }, [homes, user?.id, fetchTaskCountsForHomes, taskCountUpdateTimer]);

  // Set up the home_tasks real-time subscription with a more flexible filter
  useRealTimeSubscription(
    { 
      table: 'home_tasks',
      // Remove the filter to get all home_tasks changes, then filter in the handler
      // This ensures we don't miss updates when homes array is empty or not yet loaded
    },
    handleHomeTaskChange
  );

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;
    
    if (user?.id) {
      fetchHomes().then(() => {
        if (!isMounted) return;
      });
    } else {
      if (isMounted) {
        setHomes([]);
        setHomesWithTaskCounts([]);
      }
    }
    
    return () => {
      isMounted = false;
      // Cleanup timer on unmount
      if (taskCountUpdateTimer) {
        clearTimeout(taskCountUpdateTimer);
      }
    };
  }, [user, fetchHomes, taskCountUpdateTimer]);

  const getHomeById = (homeId?: string) => {
    if (!homeId) return undefined;
    return homes.find(home => home.id === homeId);
  };

  const getHomeWithTaskCounts = (homeId?: string) => {
    if (!homeId) return undefined;
    return homesWithTaskCounts.find(home => home.id === homeId);
  };

  // Create a new home
  const createHome = async (homeData: Omit<Home, 'id' | 'user_id'>) => {
    if (!user) throw new Error('User is not authenticated');
    try {
      const { error } = await supabase
        .from('homes')
        .insert([{ ...homeData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // The real-time subscription will handle adding it to the state
    } catch (error) {
      console.error('Error creating home:', error);
      throw error;
    }
  };

  // Update an existing home
  const updateHome = async (homeId: string, updates: Partial<Home>) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('homes')
        .update(updates)
        .eq('id', homeId);
        
      if (error) throw error;
      
      // Update locally for immediate UI update
      setHomes(current => 
        current.map(home => 
          home.id === homeId ? { ...home, ...updates } : home
        )
      );
      
      setHomesWithTaskCounts(current => 
        current.map(home => 
          home.id === homeId ? { ...home, ...updates } : home
        )
      );
    } catch (error) {
      console.error('Error updating home:', error);
      throw error;
    }
  };

  // Delete a home
  const deleteHome = async (homeId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', homeId);
        
      if (error) throw error;
      
      // Remove from local state for immediate UI update
      setHomes(current => current.filter(home => home.id !== homeId));
      setHomesWithTaskCounts(current => current.filter(home => home.id !== homeId));
    } catch (error) {
      console.error('Error deleting home:', error);
      throw error;
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomes();
  };

  const refreshTaskCounts = async (homeId?: string) => {
    if (!homeId) return;
    const taskCounts = await fetchTaskCountsForHomes([homeId]);
    const counts = taskCounts[homeId] || { total: 0, active: 0, completed: 0 };
    const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    setHomesWithTaskCounts(current =>
      current.map(home =>
        home.id === homeId
          ? { ...home, taskCounts: { ...counts, completionRate } }
          : home
      )
    );
  };

  const value = {
    homes,
    homesWithTaskCounts,
    loading,
    refreshing,
    createHome,
    updateHome,
    deleteHome,
    onRefresh,
    getHomeById,
    getHomeWithTaskCounts,
    refreshTaskCounts,
  };

  return (
    <HomesContext.Provider value={value}>
      {children}
    </HomesContext.Provider>
  );
};