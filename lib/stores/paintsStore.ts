import { create } from 'zustand';
import { supabase } from '../supabase';

export interface PaintColor {
  id: string;
  paint_color_name: string;
  room: string | null;
  finish: string | null;
  wallpaper: boolean | null;
  trim_color: string | null;
  color_code: string | null;
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
      get().setPaints(homeId, (data as any) || []);
    } catch (error) {
      console.error('Error fetching paints:', error);
      get().setPaints(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  createPaint: async (homeId, paintData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    try {
      const { data, error } = await supabase
        .from('paint_colors')
        .insert([{ ...paintData, home_id: homeId }] as any)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const list = get().paintsByHome[homeId] || [];
        get().setPaints(homeId, [data as PaintColor, ...list.filter((p) => p.id !== data.id)]);
      }
    } catch (error) {
      console.error('Error creating paint:', error);
      throw error;
    }
  },

  updatePaint: async (homeId, id, updates) => {
    try {
      const { data, error } = await supabase
        .from('paint_colors')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const list = get().paintsByHome[homeId] || [];
        get().setPaints(homeId, list.map((p) => (p.id === id ? (data as PaintColor) : p)));
      }
    } catch (error) {
      console.error('Error updating paint:', error);
      throw error;
    }
  },

  deletePaint: async (homeId, id) => {
    const prev = get().paintsByHome[homeId] || [];
    set((state) => ({
      paintsByHome: {
        ...state.paintsByHome,
        [homeId]: prev.filter((p) => p.id !== id),
      },
    }));
    try {
      const { error } = await supabase.from('paint_colors').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      get().setPaints(homeId, prev);
      console.error('Error deleting paint:', error);
      throw error;
    }
  },
}));

