import { create } from 'zustand';
import { supabase } from '../supabase';

export interface PaintColor {
  id: string;
  name: string;
  room: string | null;
  brand: string | null;
  color_code: string | null;
  color_hex: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PaintsState {
  paintsByHome: Record<string, PaintColor[]>;
  loadingByHome: Record<string, boolean>;

  fetchPaints: (homeId: string) => Promise<void>;
  createPaint: (homeId: string, paintData: Omit<PaintColor, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updatePaint: (homeId: string, id: string, updates: Partial<PaintColor>) => Promise<void>;
  deletePaint: (homeId: string, id: string) => Promise<void>;
  
  setPaints: (homeId: string, paints: PaintColor[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const usePaintsStore = create<PaintsState>((set, get) => ({
  paintsByHome: {},
  loadingByHome: {},

  setPaints: (homeId, paints) => {
    set((state) => ({
      paintsByHome: {
        ...state.paintsByHome,
        [homeId]: paints,
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

  fetchPaints: async (homeId: string) => {
    if (!homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('paint_colors')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      get().setPaints(homeId, (data || []) as PaintColor[]);
    } catch (error) {
      console.error('Error fetching paints:', error);
      get().setPaints(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createPaint: async (homeId, paintData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { error } = await supabase
        .from('paint_colors')
        .insert([{ ...paintData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Paint created');
    } catch (error) {
      console.error('Error creating paint:', error);
      throw error;
    }
  },

  updatePaint: async (homeId, id, updates) => {
    try {
      const { error } = await supabase
        .from('paint_colors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('Paint updated');
    } catch (error) {
      console.error('Error updating paint:', error);
      throw error;
    }
  },

  deletePaint: async (homeId, id) => {
    try {
      const { error } = await supabase
        .from('paint_colors')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      console.log('Paint deleted:', id);
    } catch (error) {
      console.error('Error deleting paint:', error);
      throw error;
    }
  },
}));

