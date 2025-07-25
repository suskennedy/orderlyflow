import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Define the Warranty type based on your current schema
interface Warranty {
  id: string;
  item_name: string;
  room: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  provider: string | null;
  notes: string | null;
  home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface WarrantiesContextType {
  warranties: Warranty[];
  loading: boolean;
  createWarranty: (warrantyData: Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => Promise<void>;
  updateWarranty: (id: string, updates: Partial<Warranty>) => Promise<void>;
  deleteWarranty: (id: string) => Promise<void>;
}

const WarrantiesContext = createContext<WarrantiesContextType | undefined>(undefined);

export function WarrantiesProvider({ homeId, children }: { homeId: string; children: React.ReactNode }) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch warranties from Supabase
  const fetchWarranties = useCallback(async () => {
    if (!homeId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warranties')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWarranties(data || []);
    } catch (error) {
      console.error('Error fetching warranties:', error);
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  // Handle real-time changes
  const handleWarrantyChange = useCallback((payload: any) => {
    console.log('🔥 Real-time warranty change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setWarranties(prev => [payload.new as Warranty, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setWarranties(prev => 
        prev.map(warranty => 
          warranty.id === payload.new.id ? payload.new as Warranty : warranty
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setWarranties(prev => 
        prev.filter(warranty => warranty.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  useRealTimeSubscription(
    {
      table: 'warranties',
      filter: homeId ? `home_id=eq.${homeId}` : undefined
    },
    handleWarrantyChange
  );

  // Initial data fetch
  useEffect(() => {
    if (homeId) {
      fetchWarranties();
    } else {
      setWarranties([]);
    }
  }, [homeId, fetchWarranties]);

  const createWarranty = async (warrantyData: Omit<Warranty, 'id' | 'created_at' | 'updated_at' | 'home_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      
      const { data, error } = await supabase
        .from('warranties')
        .insert([{ ...warrantyData, home_id: homeId }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Warranty created:', data);
    } catch (error) {
      console.error('Error creating warranty:', error);
      throw error;
    }
  };

  const updateWarranty = async (id: string, updates: Partial<Warranty>) => {
    try {
      const { data, error } = await supabase
        .from('warranties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Warranty updated:', data);
    } catch (error) {
      console.error('Error updating warranty:', error);
      throw error;
    }
  };

  const deleteWarranty = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warranties')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Warranty deleted:', id);
    } catch (error) {
      console.error('Error deleting warranty:', error);
      throw error;
    }
  };

  return (
    <WarrantiesContext.Provider value={{ 
      warranties, 
      loading, 
      createWarranty, 
      updateWarranty, 
      deleteWarranty 
    }}>
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