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
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      set({ vendors: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      set({ vendors: [], loading: false });
    }
  },

  addVendor: async (userId, vendor) => {
    try {
      console.log('Adding vendor to database:', vendor);
      
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          name: vendor.name,
          category: vendor.category,
          contact_name: vendor.contact_name,
          phone: vendor.phone,
          email: vendor.email,
          website: vendor.website,
          address: vendor.address,
          notes: vendor.notes,
          user_id: userId,
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Vendor added to database:', data);
      
      // Real-time subscription will handle the state update
      console.log('Vendor created');
    } catch (error) {
      console.error('Error adding vendor:', error);
      throw error;
    }
  },

  updateVendor: async (vendorId, updates) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Vendor updated');
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  deleteVendor: async (vendorId) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Vendor deleted:', vendorId);
    } catch (error) {
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

