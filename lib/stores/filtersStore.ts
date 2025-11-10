import { create } from 'zustand';
import { supabase } from '../supabase';

export interface Filter {
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

interface FiltersState {
  filtersByHome: Record<string, Filter[]>;
  loadingByHome: Record<string, boolean>;

  fetchFilters: (homeId: string) => Promise<void>;
  createFilter: (homeId: string, filterData: Omit<Filter, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateFilter: (homeId: string, id: string, updates: Partial<Filter>) => Promise<void>;
  deleteFilter: (homeId: string, id: string) => Promise<void>;
  
  setFilters: (homeId: string, filters: Filter[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filtersByHome: {},
  loadingByHome: {},

  setFilters: (homeId, filters) => {
    set((state) => ({
      filtersByHome: {
        ...state.filtersByHome,
        [homeId]: filters,
      },
    }));
  },

  setLoading: (homeId, loading) => {
    set((state) => ({
      loadingByHome: {
        ...state.loadingByHome,
        [homeId]: loading,
      },
    }));
  },

  fetchFilters: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('filters')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Normalize the rows (handle location -> room migration)
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

      get().setFilters(homeId, normalisedFilters);
    } catch (error) {
      console.error('Error fetching filters:', error);
      get().setFilters(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createFilter: async (homeId, filterData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { error } = await supabase
        .from('filters')
        .insert([{ ...filterData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Filter created');
    } catch (error) {
      console.error('Error creating filter:', error);
      throw error;
    }
  },

  updateFilter: async (homeId, id, updates) => {
    try {
      const { error } = await supabase
        .from('filters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Filter updated');
    } catch (error) {
      console.error('Error updating filter:', error);
      throw error;
    }
  },

  deleteFilter: async (homeId, id) => {
    try {
      const { error } = await supabase
        .from('filters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      console.log('Filter deleted:', id);
    } catch (error) {
      console.error('Error deleting filter:', error);
      throw error;
    }
  },
}));

