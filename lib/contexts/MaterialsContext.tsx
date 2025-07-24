import React, { createContext, useContext, useEffect, useState } from 'react';
import { Material } from '../../types/database';
import { supabase } from '../supabase';

interface MaterialsContextType {
  materials: Material[];
  loading: boolean;
  createMaterial: (materialData: Omit<Material, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

export function MaterialsProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, [homeId]);

  const fetchMaterials = async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('home_id', homeId);
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMaterial = async (materialData: Omit<Material, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('materials')
        .insert([{ ...materialData, home_id: homeId, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      setMaterials(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  };

  return (
    <MaterialsContext.Provider value={{ materials, loading, createMaterial }}>
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