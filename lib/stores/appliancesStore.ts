import { create } from 'zustand';
import { supabase } from '../supabase';

export interface Appliance {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  manual_url: string | null;
  notes: string | null;
  room: string | null;
  purchased_store: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AppliancesState {
  // Store appliances by homeId: { [homeId]: Appliance[] }
  appliancesByHome: Record<string, Appliance[]>;
  // Store loading states by homeId: { [homeId]: boolean }
  loadingByHome: Record<string, boolean>;

  // Actions
  fetchAppliances: (homeId: string) => Promise<void>;
  createAppliance: (homeId: string, applianceData: Omit<Appliance, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateAppliance: (homeId: string, id: string, updates: Partial<Appliance>) => Promise<void>;
  deleteAppliance: (homeId: string, id: string) => Promise<void>;
  
  // Internal setters for real-time updates
  setAppliances: (homeId: string, appliances: Appliance[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useAppliancesStore = create<AppliancesState>((set, get) => ({
  appliancesByHome: {},
  loadingByHome: {},

  setAppliances: (homeId, appliances) => {
    set((state) => ({
      appliancesByHome: {
        ...state.appliancesByHome,
        [homeId]: appliances,
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

  fetchAppliances: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      get().setAppliances(homeId, (data || []) as Appliance[]);
    } catch (error) {
      console.error('Error fetching appliances:', error);
      get().setAppliances(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createAppliance: async (homeId, applianceData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { error } = await supabase
        .from('appliances')
        .insert([{ ...applianceData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance created');
    } catch (error) {
      console.error('Error creating appliance:', error);
      throw error;
    }
  },

  updateAppliance: async (homeId, id, updates) => {
    try {
      const { error } = await supabase
        .from('appliances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance updated');
    } catch (error) {
      console.error('Error updating appliance:', error);
      throw error;
    }
  },

  deleteAppliance: async (homeId, id) => {
    try {
      const { error } = await supabase
        .from('appliances')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance deleted:', id);
    } catch (error) {
      console.error('Error deleting appliance:', error);
      throw error;
    }
  },
}));

