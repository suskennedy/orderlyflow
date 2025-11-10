import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Repair, useRepairsStore } from '../stores/repairsStore';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useRepairs() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const homeIdFromParams = params.homeId as string | undefined;
  
  const {
    repairsByHome,
    loadingByHome,
    currentHomeByComponent,
    fetchRepairs,
    setRepairs,
    setLoading,
    setCurrentHome,
    addRepair,
    updateRepair,
    deleteRepair,
  } = useRepairsStore();

  // Use a component ID to track current home per component instance
  const componentIdRef = useRef(`repairs-${Date.now()}-${Math.random()}`);
  
  // Use homeId from params if available, otherwise use currentHome from store
  const currentHome = homeIdFromParams || currentHomeByComponent[componentIdRef.current] || null;
  const repairs = currentHome ? (repairsByHome[currentHome] || []) : [];
  const loading = currentHome ? (loadingByHome[currentHome] ?? false) : false;

  // Debounce timer for repair updates
  const repairUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle real-time changes
  const handleRepairChange = useCallback((payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      
      // Clear existing timer
      if (repairUpdateTimerRef.current) {
        clearTimeout(repairUpdateTimerRef.current);
      }
      
      // Set new debounced timer
      const timer = setTimeout(async () => {
        // Refresh repairs for the affected home
        if (homeId === currentHome && user?.id) {
          await fetchRepairs(homeId, user.id);
        }
      }, 200); // 200ms debounce
      
      repairUpdateTimerRef.current = timer;
    }
  }, [currentHome, user?.id, fetchRepairs]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'repairs',
    },
    handleRepairChange
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (repairUpdateTimerRef.current) {
        clearTimeout(repairUpdateTimerRef.current);
      }
    };
  }, []);

  // Initial data fetch when currentHome changes
  useEffect(() => {
    if (currentHome && user?.id) {
      fetchRepairs(currentHome, user.id);
    } else if (!currentHome) {
      setRepairs('', []);
      setLoading('', false);
    }
  }, [currentHome, user?.id, fetchRepairs, setRepairs, setLoading]);

  return {
    repairs,
    loading,
    currentHome,
    setCurrentHome: (homeId: string | null) => setCurrentHome(componentIdRef.current, homeId),
    fetchRepairs: (homeId: string) => user?.id ? fetchRepairs(homeId, user.id) : Promise.resolve(),
    addRepair: (repairData: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => {
      const targetHomeId = repairData.home_id || currentHome;
      if (!targetHomeId || !user?.id) {
        return Promise.reject(new Error('No home selected or user not authenticated'));
      }
      return addRepair(targetHomeId, user.id, repairData);
    },
    updateRepair: (id: string, updates: Partial<Repair>) => {
      // Try to find the repair to get its home_id, or use currentHome
      const repair = repairs.find(r => r.id === id);
      const targetHomeId = repair?.home_id || currentHome;
      if (!targetHomeId) {
        return Promise.reject(new Error('No home selected'));
      }
      return updateRepair(targetHomeId, id, updates);
    },
    deleteRepair: (id: string) => {
      // Try to find the repair to get its home_id, or use currentHome
      const repair = repairs.find(r => r.id === id);
      const targetHomeId = repair?.home_id || currentHome;
      if (!targetHomeId) {
        return Promise.reject(new Error('No home selected'));
      }
      return deleteRepair(targetHomeId, id);
    },
  };
}

