import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
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

interface VendorsContextType {
  vendors: VendorItem[];
  loading: boolean;
  refreshing: boolean;
  addVendor: (vendor: VendorItem) => void;
  updateVendor: (vendorId: string, updates: Partial<VendorItem>) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const VendorsContext = createContext<VendorsContextType | undefined>(undefined);

export const useVendors = () => {
  const context = useContext(VendorsContext);
  if (!context) {
    throw new Error('useVendors must be used within a VendorsProvider');
  }
  return context;
};

interface VendorsProviderProps {
  children: ReactNode;
}

export const VendorsProvider = ({ children }: VendorsProviderProps) => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vendors from Supabase
  const fetchVendors = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Set up real-time subscription for vendors table
  const handleVendorChange = useCallback((payload: any) => {
    // Only process changes relevant to the current user
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;

      if (eventType === 'INSERT') {
        setVendors(current => [payload.new, ...current]);
      } 
      else if (eventType === 'UPDATE') {
        setVendors(current => 
          current.map(vendor => 
            vendor.id === payload.new.id ? payload.new : vendor
          )
        );
      } 
      else if (eventType === 'DELETE') {
        setVendors(current => 
          current.filter(vendor => vendor.id !== payload.old.id)
        );
      }
    }
  }, [user?.id]);

  // Set up the real-time subscription
  useRealTimeSubscription(
    { 
      table: 'vendors',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleVendorChange
  );

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchVendors();
    } else {
      setVendors([]);
    }
  }, [user, fetchVendors]);

  // Add a new vendor
  const addVendor = (vendor: VendorItem) => {
    // Add locally for immediate UI update (the subscription will sync with server)
    setVendors(current => [vendor, ...current]);
  };

  // Update an existing vendor
  const updateVendor = async (vendorId: string, updates: Partial<VendorItem>) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId);
        
      if (error) throw error;
      
      // Update locally for immediate UI update
      setVendors(current => 
        current.map(vendor => 
          vendor.id === vendorId ? { ...vendor, ...updates } : vendor
        )
      );
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  };

  // Delete a vendor
  const deleteVendor = async (vendorId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);
        
      if (error) throw error;
      
      // Remove from local state for immediate UI update
      setVendors(current => current.filter(vendor => vendor.id !== vendorId));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendors();
  };

  const value = {
    vendors,
    loading,
    refreshing,
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
}; 