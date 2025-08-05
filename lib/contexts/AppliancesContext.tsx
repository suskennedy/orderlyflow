import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Appliance type based on your current schema
interface Appliance {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  manual_url: string | null;
  notes: string | null;
  room: string | null;
  purchased_store: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AppliancesContextType {
  appliances: Appliance[];
  loading: boolean;
  createAppliance: (applianceData: Omit<Appliance, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateAppliance: (id: string, updates: Partial<Appliance>) => Promise<void>;
  deleteAppliance: (id: string) => Promise<void>;
}

const AppliancesContext = createContext<AppliancesContextType | undefined>(undefined);

export function AppliancesProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch appliances from Supabase
  const fetchAppliances = useCallback(async () => {
    if (!homeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
        setAppliances(data as any[]);
    } catch (error) {
      console.error('Error fetching appliances:', error);
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  // Handle real-time changes
  const handleApplianceChange = useCallback((payload: any) => {
    console.log('🔥 Real-time appliance change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setAppliances(prev => [payload.new as Appliance, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setAppliances(prev => 
        prev.map(appliance => 
          appliance.id === payload.new.id ? payload.new as Appliance : appliance
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setAppliances(prev => 
        prev.filter(appliance => appliance.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'appliances',
      filter: homeId ? `home_id=eq.${homeId}` : undefined
    },
    handleApplianceChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchAppliances();
    } else {
      setAppliances([]);
    }
  }, [homeId, fetchAppliances]);

  const createAppliance = async (applianceData: Omit<Appliance, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('appliances')
        .insert([{ ...applianceData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance created:', data);
    } catch (error) {
      console.error('Error creating appliance:', error);
      throw error;
    }
  };

  const updateAppliance = async (id: string, updates: Partial<Appliance>) => {
    try {
      const { data, error } = await supabase
        .from('appliances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance updated:', data);
    } catch (error) {
      console.error('Error updating appliance:', error);
      throw error;
    }
  };

  const deleteAppliance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appliances')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Appliance deleted:', id);
    } catch (error) {
      console.error('Error deleting appliance:', error);
      throw error;
    }
  };

  return (
    <AppliancesContext.Provider value={{ 
      appliances, 
      loading, 
      createAppliance, 
      updateAppliance, 
      deleteAppliance 
    }}>
      {children}
    </AppliancesContext.Provider>
  );
}

export function useAppliances() {
  const context = useContext(AppliancesContext);
  if (context === undefined) {
    throw new Error('useAppliances must be used within a AppliancesProvider');
  }
  return context;
} 