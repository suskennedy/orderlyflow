import { useCallback, useEffect } from 'react';
import { Warranty, useWarrantiesStore } from '../stores/warrantiesStore';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useWarranties(homeId: string) {
  const {
    warrantiesByHome,
    loadingByHome,
    fetchWarranties,
    setWarranties,
    setLoading,
    createWarranty,
    updateWarranty,
    deleteWarranty,
  } = useWarrantiesStore();

  const warranties = warrantiesByHome[homeId] || [];
  const loading = loadingByHome[homeId] ?? false;

  // Handle real-time changes
  const handleWarrantyChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) {
      return; // Not for this home
    }

    console.log('🔥 Real-time warranty change:', payload);
    const store = useWarrantiesStore.getState();
    const currentWarranties = store.warrantiesByHome[homeId] || [];

    if (payload.eventType === 'INSERT') {
      const newWarranty = payload.new as Warranty;
      if (!currentWarranties.some(w => w.id === newWarranty.id)) {
        setWarranties(homeId, [newWarranty, ...currentWarranties]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setWarranties(
        homeId,
        currentWarranties.map(warranty =>
          warranty.id === payload.new.id ? (payload.new as Warranty) : warranty
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setWarranties(
        homeId,
        currentWarranties.filter(warranty => warranty.id !== payload.old.id)
      );
    }
  }, [homeId, setWarranties]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'warranties',
      filter: homeId ? `home_id=eq.${homeId}` : undefined,
    },
    handleWarrantyChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchWarranties(homeId);
    } else {
      setWarranties(homeId, []);
      setLoading(homeId, false);
    }
  }, [homeId, fetchWarranties, setWarranties, setLoading]);

  return {
    warranties,
    loading,
    createWarranty: (warrantyData: Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'home_id'>) =>
      createWarranty(homeId, warrantyData),
    updateWarranty: (id: string, updates: Partial<Warranty>) =>
      updateWarranty(homeId, id, updates),
    deleteWarranty: (id: string) => deleteWarranty(homeId, id),
  };
}

