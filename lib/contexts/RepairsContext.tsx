import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export interface Repair {
  id: string;
  home_id: string;
  title: string;
  vendor_id?: string;
  user_id?: string;
  date_reported?: string;
  description_issue?: string;
  photos_videos?: string[];
  location_in_home?: string;
  cost_estimate?: number;
  final_cost?: number;
  schedule_reminder?: boolean;
  reminder_date?: string;
  notes?: string;
  status: 'to_do' | 'scheduled' | 'in_progress' | 'complete';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  family_account_id?: string;
}

interface RepairsContextType {
  repairs: Repair[];
  loading: boolean;
  currentHome: string | null;
  setCurrentHome: (homeId: string) => void;
  fetchRepairs: (homeId: string) => Promise<void>;
  addRepair: (repair: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRepair: (id: string, updates: Partial<Repair>) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
}

const RepairsContext = createContext<RepairsContextType | undefined>(undefined);

export const useRepairs = () => {
  const context = useContext(RepairsContext);
  if (context === undefined) {
    throw new Error('useRepairs must be used within a RepairsProvider');
  }
  return context;
};

interface RepairsProviderProps {
  children: ReactNode;
}

export const RepairsProvider = ({ children }: RepairsProviderProps) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentHome, setCurrentHome] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRepairs = useCallback(async (homeId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepairs(data || []);
    } catch (error) {
      console.error('Error fetching repairs:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addRepair = useCallback(async (repairData: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('repairs')
        .insert([{
          ...repairData,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Calendar event will be created automatically by database trigger
      // if due_date is provided
      
      setRepairs(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding repair:', error);
      throw error;
    }
  }, [user?.id]);

  const updateRepair = useCallback(async (id: string, updates: Partial<Repair>) => {
    try {
      const { data, error } = await supabase
        .from('repairs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRepairs(prev => prev.map(repair => 
        repair.id === id ? data : repair
      ));
    } catch (error) {
      console.error('Error updating repair:', error);
      throw error;
    }
  }, []);

  const deleteRepair = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('repairs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRepairs(prev => prev.filter(repair => repair.id !== id));
    } catch (error) {
      console.error('Error deleting repair:', error);
      throw error;
    }
  }, []);

  const value: RepairsContextType = {
    repairs,
    loading,
    currentHome,
    setCurrentHome,
    fetchRepairs,
    addRepair,
    updateRepair,
    deleteRepair,
  };

  return (
    <RepairsContext.Provider value={value}>
      {children}
    </RepairsContext.Provider>
  );
};
