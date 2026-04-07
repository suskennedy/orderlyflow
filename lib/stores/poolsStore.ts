import { create } from 'zustand';
import { Database } from '../../supabase-types';
import { supabase } from '../supabase';

export type Pool = Database['public']['Tables']['pools']['Row'];

interface PoolsState {
  poolsByHome: Record<string, Pool[]>;
  loadingByHome: Record<string, boolean>;

  fetchPools: (homeId: string) => Promise<void>;
  createPool: (homeId: string, poolData: Omit<Pool, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updatePool: (homeId: string, id: string, updates: Partial<Pool>) => Promise<void>;
  deletePool: (homeId: string, id: string) => Promise<void>;
  
  setPools: (homeId: string, pools: Pool[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const usePoolsStore = create<PoolsState>((set, get) => ({
  poolsByHome: {},
  loadingByHome: {},

  setPools: (homeId, pools) => {
    set((state) => ({
      poolsByHome: {
        ...state.poolsByHome,
        [homeId]: pools,
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

  fetchPools: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      get().setPools(homeId, data || []);
    } catch (error) {
      console.error('Error fetching pools:', error);
      get().setPools(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createPool: async (homeId, poolData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    try {
      const { data, error } = await supabase
        .from('pools')
        .insert([{ ...poolData, home_id: homeId }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const list = get().poolsByHome[homeId] || [];
        get().setPools(homeId, [data, ...list.filter(p => p.id !== data.id)]);
      }
    } catch (error) {
      console.error('Error creating pool:', error);
      throw error;
    }
  },

  updatePool: async (homeId, id, updates) => {
    try {
      const { data, error } = await supabase
        .from('pools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const list = get().poolsByHome[homeId] || [];
        get().setPools(homeId, list.map(p => (p.id === id ? data : p)));
      }
    } catch (error) {
      console.error('Error updating pool:', error);
      throw error;
    }
  },

  deletePool: async (homeId, id) => {
    const prev = get().poolsByHome[homeId] || [];
    set((state) => ({
      poolsByHome: {
        ...state.poolsByHome,
        [homeId]: prev.filter((p) => p.id !== id),
      },
    }));

    try {
      const { error } = await supabase.from('pools').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      set((state) => ({
        poolsByHome: {
          ...state.poolsByHome,
          [homeId]: prev,
        },
      }));
      console.error('Error deleting pool:', error);
      throw error;
    }
  },
}));
