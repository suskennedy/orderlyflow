import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Home interface
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
}

interface HomesContextType {
  homes: Home[];
  loading: boolean;
  refreshing: boolean;
  createHome: (homeData: Omit<Home, 'id' | 'user_id'>) => Promise<void>;
  updateHome: (homeId: string, updates: Partial<Home>) => Promise<void>;
  deleteHome: (homeId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  getHomeById: (homeId?: string) => Home | undefined;
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch homes from Supabase
  const fetchHomes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Set up real-time subscription for homes table
  const handleHomeChange = useCallback((payload: any) => {
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
      } 
      else if (eventType === 'UPDATE') {
        setHomes(current => 
          current.map(home => 
            home.id === payload.new.id ? payload.new : home
          )
        );
      } 
      else if (eventType === 'DELETE') {
        setHomes(current => 
          current.filter(home => home.id !== payload.old.id)
        );
      }
    }
  }, [user?.id]);

  // Set up the real-time subscription
  useRealTimeSubscription(
    { 
      table: 'homes',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleHomeChange
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    } else {
      setHomes([]);
    }
  }, [user, fetchHomes]);

  const getHomeById = (homeId?: string) => {
    if (!homeId) return undefined;
    return homes.find(home => home.id === homeId);
  };

  // Create a new home
  const createHome = async (homeData: Omit<Home, 'id' | 'user_id'>) => {
    if (!user) throw new Error('User is not authenticated');
    try {
      const { data, error } = await supabase
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

  const value = {
    homes,
    loading,
    refreshing,
    createHome,
    updateHome,
    deleteHome,
    onRefresh,
    getHomeById,
  };

  return (
    <HomesContext.Provider value={value}>
      {children}
    </HomesContext.Provider>
  );
};