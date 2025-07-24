import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appliance } from '../../types/database';
import { supabase } from '../supabase';

interface AppliancesContextType {
  appliances: Appliance[];
  loading: boolean;
  createAppliance: (applianceData: Omit<Appliance, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
}

const AppliancesContext = createContext<AppliancesContextType | undefined>(undefined);

export function AppliancesProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppliances();
  }, [homeId]);

  const fetchAppliances = async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('home_id', homeId);
      if (error) throw error;
      setAppliances(data || []);
    } catch (error) {
      console.error('Error fetching appliances:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppliance = async (applianceData: Omit<Appliance, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('appliances')
        .insert([{ ...applianceData, home_id: homeId, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      setAppliances(prev => [...prev, data]);
    } catch (error) {
      console.error('Error creating appliance:', error);
      throw error;
    }
  };

  return (
    <AppliancesContext.Provider value={{ appliances, loading, createAppliance }}>
      {children}
    </AppliancesContext.Provider>
  );
}

export function useAppliances(homeId: string) {
  const context = useContext(AppliancesContext);
  if (context === undefined) {
    throw new Error('useAppliances must be used within a AppliancesProvider');
  }
  return context;
} 