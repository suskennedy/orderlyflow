import { useCallback, useEffect } from 'react';
import { Appliance, useAppliancesStore } from '../stores/appliancesStore';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useAppliances(homeId: string) {
  const {
    appliancesByHome,
    loadingByHome,
    fetchAppliances,
    setAppliances,
    setLoading,
    createAppliance,
    updateAppliance,
    deleteAppliance,
  } = useAppliancesStore();

  const appliances = appliancesByHome[homeId] || [];
  const loading = loadingByHome[homeId] ?? false;

  // Handle real-time changes
  const handleApplianceChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) {
      return; // Not for this home
    }

    console.log('🔥 Real-time appliance change:', payload);
    const store = useAppliancesStore.getState();
    const currentAppliances = store.appliancesByHome[homeId] || [];

    if (payload.eventType === 'INSERT') {
      const newAppliance = payload.new as Appliance;
      if (!currentAppliances.some(a => a.id === newAppliance.id)) {
        setAppliances(homeId, [newAppliance, ...currentAppliances]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setAppliances(
        homeId,
        currentAppliances.map(appliance =>
          appliance.id === payload.new.id ? (payload.new as Appliance) : appliance
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setAppliances(
        homeId,
        currentAppliances.filter(appliance => appliance.id !== payload.old.id)
      );
    }
  }, [homeId, setAppliances]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'appliances',
      filter: homeId ? `home_id=eq.${homeId}` : undefined,
    },
    handleApplianceChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchAppliances(homeId);
    } else {
      setAppliances(homeId, []);
      setLoading(homeId, false);
    }
  }, [homeId, fetchAppliances, setAppliances, setLoading]);

  return {
    appliances,
    loading,
    createAppliance: (applianceData: Omit<Appliance, 'id' | 'created_at' | 'updated_at' | 'home_id'>) =>
      createAppliance(homeId, applianceData),
    updateAppliance: (id: string, updates: Partial<Appliance>) =>
      updateAppliance(homeId, id, updates),
    deleteAppliance: (id: string) => deleteAppliance(homeId, id),
  };
}

