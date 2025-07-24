import React, { createContext, useContext, useEffect, useState } from 'react';
import { Filter } from '../../types/database';
import { supabase } from '../supabase';

interface FiltersContextType {
  filters: Filter[];
  loading: boolean;
  createFilter: (filterData: Omit<Filter, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilters();
  }, [homeId]);

  const fetchFilters = async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('filters')
        .select('*')
        .eq('home_id', homeId);
      if (error) throw error;
      setFilters(data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFilter = async (filterData: Omit<Filter, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('filters')
        .insert([{ ...filterData, home_id: homeId, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      setFilters(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating filter:', error);
      throw error;
    }
  };

  return (
    <FiltersContext.Provider value={{ filters, loading, createFilter }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(homeId: string) {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
} 