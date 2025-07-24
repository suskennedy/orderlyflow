import React, { createContext, useContext, useEffect, useState } from 'react';
import { Warranty } from '../../types/database';
import { supabase } from '../supabase';

interface WarrantiesContextType {
  warranties: Warranty[];
  loading: boolean;
  createWarranty: (warrantyData: Omit<Warranty, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const WarrantiesContext = createContext<WarrantiesContextType | undefined>(undefined);

export function WarrantiesProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarranties();
  }, [homeId]);

  const fetchWarranties = async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warranties')
        .select('*')
        .eq('home_id', homeId);
      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWarranty = async (warrantyData: Omit<Warranty, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('warranties')
        .insert([{ ...warrantyData, home_id: homeId, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      setWarranties(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating warranty:', error);
      throw error;
    }
  };

  return (
    <WarrantiesContext.Provider value={{ warranties, loading, createWarranty }}>
      {children}
    </WarrantiesContext.Provider>
  );
}

export function useWarranties(homeId: string) {
  const context = useContext(WarrantiesContext);
  if (context === undefined) {
    throw new Error('useWarranties must be used within a WarrantiesProvider');
  }
  return context;
} 