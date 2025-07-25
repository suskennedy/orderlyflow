import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Material type based on your current schema
interface Material {
  id: string;
  name: string;
  room: string | null;
  type: string | null;
  brand: string | null;
  source: string | null;
  purchase_date: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MaterialsContextType {
  materials: Material[];
  loading: boolean;
  createMaterial: (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

export function MaterialsProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch materials from Supabase
  const fetchMaterials = useCallback(async () => {
    if (!homeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  // Handle real-time changes
  const handleMaterialChange = useCallback((payload: any) => {
    console.log('🔥 Real-time material change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setMaterials(prev => [payload.new as Material, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setMaterials(prev => 
        prev.map(material => 
          material.id === payload.new.id ? payload.new as Material : material
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setMaterials(prev => 
        prev.filter(material => material.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'materials',
      filter: homeId ? `home_id=eq.${homeId}` : undefined
    },
    handleMaterialChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchMaterials();
    } else {
      setMaterials([]);
    }
  }, [homeId, fetchMaterials]);

  const createMaterial = async (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('materials')
        .insert([{ ...materialData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Material created:', data);
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<Material>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Material updated:', data);
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Material deleted:', id);
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  };

  return (
    <MaterialsContext.Provider value={{ 
      materials, 
      loading, 
      createMaterial, 
      updateMaterial, 
      deleteMaterial 
    }}>
      {children}
    </MaterialsContext.Provider>
  );
}

export function useMaterials(homeId: string) {
  const context = useContext(MaterialsContext);
  if (context === undefined) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
} 