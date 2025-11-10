import { create } from 'zustand';
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

interface HomesState {
  // State
  homes: Home[];
  homesWithTaskCounts: HomeWithTaskCounts[];
  loading: boolean;
  refreshing: boolean;

  // Actions
  fetchHomes: () => Promise<void>;
  createHome: (homeData: Omit<Home, 'id' | 'user_id'>) => Promise<void>;
  updateHome: (homeId: string, updates: Partial<Home>) => Promise<void>;
  deleteHome: (homeId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  getHomeById: (homeId?: string) => Home | undefined;
  getHomeWithTaskCounts: (homeId?: string) => HomeWithTaskCounts | undefined;
  refreshTaskCounts: (homeId?: string) => Promise<void>;
  setHomes: (homes: Home[]) => void;
  setHomesWithTaskCounts: (homes: HomeWithTaskCounts[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

// Fetch task counts for all homes in a single query
export const fetchTaskCountsForHomes = async (homeIds: string[]): Promise<Record<string, { total: number; active: number; completed: number }>> => {
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
};

export const useHomesStore = create<HomesState>((set, get) => ({
  // Initial state
  homes: [],
  homesWithTaskCounts: [],
  loading: true,
  refreshing: false,

  // Helper setters
  setHomes: (homes) => set({ homes }),
  setHomesWithTaskCounts: (homesWithTaskCounts) => set({ homesWithTaskCounts }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),

  // Fetch homes from Supabase
  fetchHomes: async () => {
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.log('fetchHomes: No user ID');
        set({ homes: [], homesWithTaskCounts: [], loading: false });
        return;
      }
      
      set({ loading: true });
      console.log('fetchHomes: Starting fetch for user:', user.id);
      
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      console.log('fetchHomes: Homes data:', data);
      const homes = data || [];
      set({ homes });
      
      // Fetch task counts for all homes
      if (homes.length > 0) {
        const homeIds = homes.map(home => home.id);
        const taskCounts = await fetchTaskCountsForHomes(homeIds);
        
        // Create enhanced homes with task counts
        const enhancedHomes: HomeWithTaskCounts[] = homes.map(home => {
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
        
        set({ homesWithTaskCounts: enhancedHomes });
      } else {
        set({ homesWithTaskCounts: [] });
      }
    } catch (error) {
      console.error('Error fetching homes:', error);
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  // Create a new home
  createHome: async (homeData) => {
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User is not authenticated');
      
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
  },

  // Update an existing home
  updateHome: async (homeId, updates) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('homes')
        .update(updates)
        .eq('id', homeId);
        
      if (error) throw error;
      
      // Update locally for immediate UI update
      const { homes, homesWithTaskCounts } = get();
      const updatedHomes = homes.map(home => 
        home.id === homeId ? { ...home, ...updates } : home
      );
      
      const updatedHomesWithCounts = homesWithTaskCounts.map(home => 
        home.id === homeId ? { ...home, ...updates } : home
      );
      
      set({ homes: updatedHomes, homesWithTaskCounts: updatedHomesWithCounts });
    } catch (error) {
      console.error('Error updating home:', error);
      throw error;
    }
  },

  // Delete a home
  deleteHome: async (homeId) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', homeId);
        
      if (error) throw error;
      
      // Remove from local state for immediate UI update
      const { homes, homesWithTaskCounts } = get();
      set({
        homes: homes.filter(home => home.id !== homeId),
        homesWithTaskCounts: homesWithTaskCounts.filter(home => home.id !== homeId)
      });
    } catch (error) {
      console.error('Error deleting home:', error);
      throw error;
    }
  },

  // Refresh data
  onRefresh: async () => {
    set({ refreshing: true });
    await get().fetchHomes();
  },

  // Get home by ID
  getHomeById: (homeId) => {
    if (!homeId) return undefined;
    const { homes } = get();
    return homes.find(home => home.id === homeId);
  },

  // Get home with task counts by ID
  getHomeWithTaskCounts: (homeId) => {
    if (!homeId) return undefined;
    const { homesWithTaskCounts } = get();
    return homesWithTaskCounts.find(home => home.id === homeId);
  },

  // Refresh task counts for a specific home
  refreshTaskCounts: async (homeId) => {
    if (!homeId) return;
    const taskCounts = await fetchTaskCountsForHomes([homeId]);
    const counts = taskCounts[homeId] || { total: 0, active: 0, completed: 0 };
    const completionRate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    const { homesWithTaskCounts, homes } = get();
    const home = homes.find(h => h.id === homeId);
    if (!home) return;

    const updatedHomesWithCounts = homesWithTaskCounts.map(h =>
      h.id === homeId
        ? { ...home, taskCounts: { ...counts, completionRate } }
        : h
    );

    // If home not in homesWithTaskCounts, add it
    if (!homesWithTaskCounts.find(h => h.id === homeId)) {
      updatedHomesWithCounts.push({
        ...home,
        taskCounts: { ...counts, completionRate }
      });
    }

    set({ homesWithTaskCounts: updatedHomesWithCounts });
  },
}));


