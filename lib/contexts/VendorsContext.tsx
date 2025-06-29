import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export interface VendorItem {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
}

interface VendorsContextType {
  vendors: VendorItem[];
  loading: boolean;
  refreshing: boolean;
  fetchVendors: () => Promise<void>;
  addVendor: (vendor: Omit<VendorItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateVendor: (id: string, updates: Partial<VendorItem>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const VendorsContext = createContext<VendorsContextType | undefined>(undefined);

export const useVendors = () => {
  const context = useContext(VendorsContext);
  if (!context) {
    throw new Error('useVendors must be used within a VendorsProvider');
  }
  return context;
};

export function VendorsProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchVendors = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const addVendor = async (vendorData: Omit<VendorItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([{ ...vendorData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setVendors(prev => [data, ...prev]);
      Alert.alert('Success', 'Vendor added successfully');
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor');
    }
  };

  const updateVendor = async (id: string, updates: Partial<VendorItem>) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVendors(prev => prev.map(vendor => vendor.id === id ? data : vendor));
      Alert.alert('Success', 'Vendor updated successfully');
    } catch (error) {
      console.error('Error updating vendor:', error);
      Alert.alert('Error', 'Failed to update vendor');
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVendors(prev => prev.filter(vendor => vendor.id !== id));
      Alert.alert('Success', 'Vendor deleted successfully');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      Alert.alert('Error', 'Failed to delete vendor');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('vendors_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setVendors(prev => [payload.new as VendorItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVendors(prev => prev.map(vendor => 
              vendor.id === payload.new.id ? payload.new as VendorItem : vendor
            ));
          } else if (payload.eventType === 'DELETE') {
            setVendors(prev => prev.filter(vendor => vendor.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: VendorsContextType = {
    vendors,
    loading,
    refreshing,
    fetchVendors,
    addVendor,
    updateVendor,
    deleteVendor,
    onRefresh,
  };

  return (
    <VendorsContext.Provider value={value}>
      {children}
    </VendorsContext.Provider>
  );
} 