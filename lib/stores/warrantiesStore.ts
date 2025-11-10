import { create } from 'zustand';
import { supabase } from '../supabase';

export interface Warranty {
  id: string;
  item_name: string;
  room: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  provider: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface WarrantiesState {
  warrantiesByHome: Record<string, Warranty[]>;
  loadingByHome: Record<string, boolean>;

  fetchWarranties: (homeId: string) => Promise<void>;
  createWarranty: (homeId: string, warrantyData: Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateWarranty: (homeId: string, id: string, updates: Partial<Warranty>) => Promise<void>;
  deleteWarranty: (homeId: string, id: string) => Promise<void>;
  
  setWarranties: (homeId: string, warranties: Warranty[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useWarrantiesStore = create<WarrantiesState>((set, get) => ({
  warrantiesByHome: {},
  loadingByHome: {},

  setWarranties: (homeId, warranties) => {
    set((state) => ({
      warrantiesByHome: {
        ...state.warrantiesByHome,
        [homeId]: warranties,
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

  fetchWarranties: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await (supabase as any)
        .from('warranties')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      get().setWarranties(homeId, (data || []) as Warranty[]);
    } catch (error) {
      console.error('Error fetching warranties:', error);
      get().setWarranties(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createWarranty: async (homeId, warrantyData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { error } = await (supabase as any)
        .from('warranties')
        .insert([{ ...warrantyData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Warranty created');
    } catch (error) {
      console.error('Error creating warranty:', error);
      throw error;
    }
  },

  updateWarranty: async (homeId, id, updates) => {
    try {
      const { error } = await (supabase as any)
        .from('warranties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Warranty updated');
    } catch (error) {
      console.error('Error updating warranty:', error);
      throw error;
    }
  },

  deleteWarranty: async (homeId, id) => {
    try {
      const { error } = await (supabase as any)
        .from('warranties')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      console.log('Warranty deleted:', id);
    } catch (error) {
      console.error('Error deleting warranty:', error);
      throw error;
    }
  },
}));

