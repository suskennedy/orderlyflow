import { useEffect } from 'react';
import { VendorItem, useVendorsStore } from '../stores/vendorsStore';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useVendors() {
  const { user } = useAuth();
  const {
    vendors,
    loading,
    refreshing,
    fetchVendors,
    setVendors,
    setLoading,
    addVendor,
    updateVendor,
    deleteVendor,
    onRefresh,
  } = useVendorsStore();

  // Handle real-time vendor changes
  const handleVendorChange = (payload: any) => {
    // Only process changes relevant to the current user
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;
      const currentVendors = useVendorsStore.getState().vendors;

      if (eventType === 'INSERT') {
        setVendors([payload.new, ...currentVendors]);
      } 
      else if (eventType === 'UPDATE') {
        setVendors(
          currentVendors.map(vendor => 
            vendor.id === payload.new.id ? payload.new : vendor
          )
        );
      } 
      else if (eventType === 'DELETE') {
        setVendors(
          currentVendors.filter(vendor => vendor.id !== payload.old.id)
        );
      }
    }
  };

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
      fetchVendors(user.id);
    } else {
      setVendors([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user?.id to avoid infinite loops

  return {
    vendors: Array.isArray(vendors) ? vendors : [],
    loading,
    refreshing,
    addVendor: (vendor: Omit<VendorItem, 'id' | 'created_at' | 'updated_at'>) => 
      user?.id ? addVendor(user.id, vendor) : Promise.reject(new Error('User not authenticated')),
    updateVendor,
    deleteVendor,
    onRefresh: () => user?.id ? onRefresh(user.id) : Promise.resolve(),
  };
}

