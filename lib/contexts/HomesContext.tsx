import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

interface Home {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_footage: number | null;
  year_built: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
}

interface HomesContextType {
  homes: Home[];
  loading: boolean;
  refreshing: boolean;
  fetchHomes: () => Promise<void>;
  addHome: (home: Omit<Home, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateHome: (id: string, updates: Partial<Home>) => Promise<void>;
  deleteHome: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const HomesContext = createContext<HomesContextType | undefined>(undefined);

export const useHomes = () => {
  const context = useContext(HomesContext);
  if (context === undefined) {
    throw new Error('useHomes must be used within a HomesProvider');
  }
  return context;
};

interface HomesProviderProps {
  children: ReactNode;
}

export const HomesProvider: React.FC<HomesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomes = async () => {
    try {
      if (!user?.id) {
        setHomes([]);
        return;
      }

      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
      Alert.alert('Error', 'Failed to load homes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addHome = async (homeData: Omit<Home, 'id' | 'created_at' | 'user_id'>) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('homes')
        .insert([{ ...homeData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setHomes(prev => [data, ...prev]);
      Alert.alert('Success', 'Home added successfully');
    } catch (error) {
      console.error('Error adding home:', error);
      Alert.alert('Error', 'Failed to add home');
      throw error;
    }
  };

  const updateHome = async (id: string, updates: Partial<Home>) => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setHomes(prev => prev.map(home => home.id === id ? data : home));
      Alert.alert('Success', 'Home updated successfully');
    } catch (error) {
      console.error('Error updating home:', error);
      Alert.alert('Error', 'Failed to update home');
      throw error;
    }
  };

  const deleteHome = async (id: string) => {
    try {
      const { error } = await supabase
        .from('homes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHomes(prev => prev.filter(home => home.id !== id));
      Alert.alert('Success', 'Home deleted successfully');
    } catch (error) {
      console.error('Error deleting home:', error);
      Alert.alert('Error', 'Failed to delete home');
      throw error;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomes();
  };

  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    } else {
      setHomes([]);
      setLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('homes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time homes update:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setHomes(prev => {
                const exists = prev.find(home => home.id === payload.new.id);
                if (exists) return prev;
                return [payload.new as Home, ...prev];
              });
              break;
            case 'UPDATE':
              setHomes(prev => prev.map(home => 
                home.id === payload.new.id ? payload.new as Home : home
              ));
              break;
            case 'DELETE':
              setHomes(prev => prev.filter(home => home.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const value: HomesContextType = {
    homes,
    loading,
    refreshing,
    fetchHomes,
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