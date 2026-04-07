import { create } from 'zustand';
import { supabase } from '../supabase';

export interface VendorItem {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VendorsState {
  vendors: VendorItem[];
  loading: boolean;
  refreshing: boolean;

  // Actions
  fetchVendors: (userId: string) => Promise<void>;
  addVendor: (userId: string, vendor: Omit<VendorItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateVendor: (vendorId: string, updates: Partial<VendorItem>) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  onRefresh: (userId: string) => Promise<void>;
  
  // Internal setters
  setVendors: (vendors: VendorItem[]) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useVendorsStore = create<VendorsState>((set, get) => ({
  vendors: [],
  loading: true,
  refreshing: false,

  setVendors: (vendors) => set({ vendors }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),

  fetchVendors: async (userId: string) => {
    if (!userId) {
      set({ vendors: [], loading: false });
      return;
    }
    
    try {
      set({ loading: true });
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      set({ vendors: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      set({ vendors: [], loading: false });
    }
  },

  addVendor: async (userId, vendor) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          name: vendor.name,
          category: vendor.category,
          phone: vendor.phone,
          email: vendor.email,
          notes: vendor.notes,
          contact_name: vendor.contact_name ?? null,
          website: vendor.website ?? null,
          address: vendor.address ?? null,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const list = get().vendors;
        const next = [data as VendorItem, ...list.filter((v) => v.id !== data.id)].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        set({ vendors: next });
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    }
  },

  updateVendor: async (vendorId, updates) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const list = get().vendors;
        set({
          vendors: list
            .map((v) => (v.id === vendorId ? (data as VendorItem) : v))
            .sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  deleteVendor: async (vendorId) => {
    const prev = get().vendors;
    set({ vendors: prev.filter((v) => v.id !== vendorId) });
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) throw error;
    } catch (error) {
      set({ vendors: prev });
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  onRefresh: async (userId) => {
    set({ refreshing: true });
    await get().fetchVendors(userId);
    set({ refreshing: false });
  },
}));

