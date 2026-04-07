import { create } from 'zustand';
import { supabase } from '../supabase';

export interface Material {
  id: string;
  type: string | null;
  location: string | null;
  brand: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MaterialsState {
  materialsByHome: Record<string, Material[]>;
  loadingByHome: Record<string, boolean>;

  fetchMaterials: (homeId: string) => Promise<void>;
  createMaterial: (homeId: string, materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateMaterial: (homeId: string, id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (homeId: string, id: string) => Promise<void>;
  
  setMaterials: (homeId: string, materials: Material[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useMaterialsStore = create<MaterialsState>((set, get) => ({
  materialsByHome: {},
  loadingByHome: {},

  setMaterials: (homeId, materials) => {
    set((state) => ({
      materialsByHome: {
        ...state.materialsByHome,
        [homeId]: materials,
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

  fetchMaterials: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await (supabase as any)
        .from('materials')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      get().setMaterials(homeId, (data as any) || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      get().setMaterials(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createMaterial: async (homeId, materialData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { error } = await (supabase as any)
        .from('materials')
        .insert([{ ...materialData, home_id: homeId } as any])
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Material created');
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },

  updateMaterial: async (homeId, id, updates) => {
    try {
      const { error } = await (supabase as any)
        .from('materials')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Material updated');
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  },

  deleteMaterial: async (homeId, id) => {
    const prev = get().materialsByHome[homeId] || [];
    set((state) => ({
      materialsByHome: {
        ...state.materialsByHome,
        [homeId]: prev.filter((m) => m.id !== id),
      },
    }));
    try {
      const { error } = await (supabase as any).from('materials').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      get().setMaterials(homeId, prev);
      console.error('Error deleting material:', error);
      throw error;
    }
  },
}));

