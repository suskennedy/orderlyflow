import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Home interface
interface Home {
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
}

interface HomesContextType {
  homes: Home[];
  loading: boolean;
  refreshing: boolean;
  addHome: (home: Home) => void;
  updateHome: (homeId: string, updates: Partial<Home>) => Promise<void>;
  deleteHome: (homeId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
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
        setHomes(current => [...current, payload.new]);
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

  // Add a new home
  const addHome = (home: Home) => {
    // Add locally for immediate UI update (the subscription will sync with server)
    setHomes(current => [...current, home]);
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
    addHome,
    updateHome,
    deleteHome,
    onRefresh,
  };

  return (
    <HomesContext.Provider value={value}>
      {children}
    </HomesContext.Provider>
  );
};