import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Filter type based on your current schema
interface Filter {
  id: string;
  name: string;
  room: string | null;
  type: string | null;
  brand: string | null;
  model: string | null;
  size: string | null;
  last_replaced: string | null;
  replacement_frequency: number | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FiltersContextType {
  filters: Filter[];
  loading: boolean;
  createFilter: (filterData: Omit<Filter, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateFilter: (id: string, updates: Partial<Filter>) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch filters from Supabase
  const fetchFilters = useCallback(async () => {
    if (!homeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('filters')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Supabase returns raw rows whose shape does not perfectly match
      // our Filter interface (e.g. the db still uses `location` instead
      // of `room`).  Normalise the rows so TypeScript – and the rest of
      // the application – get exactly what they expect.
      const normalisedFilters: Filter[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        room: row.room ?? row.location ?? null,
        type: row.type ?? null,
        brand: row.brand ?? null,
        model: row.model ?? null,
        size: row.size ?? null,
        last_replaced: row.last_replaced ?? null,
        replacement_frequency: row.replacement_frequency ?? null,
        notes: row.notes ?? null,
        home_id: row.home_id ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      }));

      setFilters(normalisedFilters);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  // Handle real-time changes
  const handleFilterChange = useCallback((payload: any) => {
    console.log('🔥 Real-time filter change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setFilters(prev => [payload.new as Filter, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setFilters(prev => 
        prev.map(filter => 
          filter.id === payload.new.id ? payload.new as Filter : filter
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setFilters(prev => 
        prev.filter(filter => filter.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'filters',
      filter: homeId ? `home_id=eq.${homeId}` : undefined
    },
    handleFilterChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchFilters();
    } else {
      setFilters([]);
    }
  }, [homeId, fetchFilters]);

  const createFilter = async (filterData: Omit<Filter, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('filters')
        .insert([{ ...filterData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Filter created:', data);
    } catch (error) {
      console.error('Error creating filter:', error);
      throw error;
    }
  };

  const updateFilter = async (id: string, updates: Partial<Filter>) => {
    try {
      const { data, error } = await supabase
        .from('filters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Filter updated:', data);
    } catch (error) {
      console.error('Error updating filter:', error);
      throw error;
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('filters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Filter deleted:', id);
    } catch (error) {
      console.error('Error deleting filter:', error);
      throw error;
    }
  };

  return (
    <FiltersContext.Provider value={{ 
      filters, 
      loading, 
      createFilter, 
      updateFilter, 
      deleteFilter 
    }}>
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