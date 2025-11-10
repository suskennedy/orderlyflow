import { useCallback, useEffect } from 'react';
import { Material, useMaterialsStore } from '../stores/materialsStore';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useMaterials(homeId: string) {
  const {
    materialsByHome,
    loadingByHome,
    fetchMaterials,
    setMaterials,
    setLoading,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterialsStore();

  const materials = materialsByHome[homeId] || [];
  const loading = loadingByHome[homeId] ?? false;

  // Handle real-time changes
  const handleMaterialChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) {
      return; // Not for this home
    }

    console.log('🔥 Real-time material change:', payload);
    const store = useMaterialsStore.getState();
    const currentMaterials = store.materialsByHome[homeId] || [];

    if (payload.eventType === 'INSERT') {
      const newMaterial = payload.new as Material;
      if (!currentMaterials.some(m => m.id === newMaterial.id)) {
        setMaterials(homeId, [newMaterial, ...currentMaterials]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setMaterials(
        homeId,
        currentMaterials.map(material =>
          material.id === payload.new.id ? (payload.new as Material) : material
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setMaterials(
        homeId,
        currentMaterials.filter(material => material.id !== payload.old.id)
      );
    }
  }, [homeId, setMaterials]);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'materials',
      filter: homeId ? `home_id=eq.${homeId}` : undefined,
    },
    handleMaterialChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchMaterials(homeId);
    } else {
      setMaterials(homeId, []);
      setLoading(homeId, false);
    }
  }, [homeId, fetchMaterials, setMaterials, setLoading]);

  return {
    materials,
    loading,
    createMaterial: (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'home_id'>) =>
      createMaterial(homeId, materialData),
    updateMaterial: (id: string, updates: Partial<Material>) =>
      updateMaterial(homeId, id, updates),
    deleteMaterial: (id: string) => deleteMaterial(homeId, id),
  };
}

