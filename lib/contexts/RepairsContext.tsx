import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

export interface Repair {
  id: string;
  home_id: string | null;
  title: string;
  vendor_id?: string | null;
  user_id?: string | null;
  date_reported?: string | null;
  description_issue?: string | null;
  photos_videos?: string[] | null;
  location_in_home?: string | null;
  cost_estimate?: number | null;
  final_cost?: number | null;
  schedule_reminder?: boolean | null;
  reminder_date?: string | null;
  notes?: string | null;
  status: 'to_do' | 'scheduled' | 'in_progress' | 'complete' | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  family_account_id?: string | null;
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

  // Debounce timer for repair updates
  const repairUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      setRepairs((data || []) as Repair[]);
    } catch (error) {
      console.error('Error fetching repairs:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscription for repairs
  const handleRepairChange = useCallback(async (payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      
      // Clear existing timer
      if (repairUpdateTimerRef.current) {
        clearTimeout(repairUpdateTimerRef.current);
      }
      
      // Set new debounced timer
      const timer = setTimeout(async () => {
        // Refresh repairs for the affected home
        if (homeId === currentHome) {
          await fetchRepairs(homeId);
        }
      }, 200); // 200ms debounce
      
      repairUpdateTimerRef.current = timer;
    }
  }, [currentHome, fetchRepairs]);

  // Set up the repairs real-time subscription
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

  const addRepair = useCallback(async (repairData: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      // Create a clean repair data object with only valid fields
      const cleanRepairData = {
        home_id: repairData.home_id,
        title: repairData.title,
        description: repairData.description_issue, // Map description_issue to description
        status: repairData.status,
        created_by: user.id,
        family_account_id: repairData.family_account_id,
        vendor_id: repairData.vendor_id,
        user_id: repairData.user_id,
        date_reported: repairData.date_reported,
        photos_videos: repairData.photos_videos,
        location_in_home: repairData.location_in_home,
        cost_estimate: repairData.cost_estimate,
        final_cost: repairData.final_cost,
        schedule_reminder: repairData.schedule_reminder,
        reminder_date: repairData.reminder_date,
        notes: repairData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('repairs')
        .insert([cleanRepairData])
        .select()
        .single();

      if (error) throw error;
      
      setRepairs(prev => [data as Repair, ...prev]);
    } catch (error) {
      console.error('Error adding repair:', error);
      throw error;
    }
  }, [user?.id]);

  const updateRepair = useCallback(async (id: string, updates: Partial<Repair>) => {
    try {
      // Create a clean update object with only valid fields
      const cleanUpdates: any = {};
      
      // Only include fields that exist in the repairs table
      if (updates.home_id !== undefined) cleanUpdates.home_id = updates.home_id;
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description_issue !== undefined) {
        cleanUpdates.description = updates.description_issue; // Map to description field
        cleanUpdates.description_issue = updates.description_issue;
      }
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.family_account_id !== undefined) cleanUpdates.family_account_id = updates.family_account_id;
      if (updates.vendor_id !== undefined) cleanUpdates.vendor_id = updates.vendor_id;
      if (updates.user_id !== undefined) cleanUpdates.user_id = updates.user_id;
      if (updates.date_reported !== undefined) cleanUpdates.date_reported = updates.date_reported;
      if (updates.photos_videos !== undefined) cleanUpdates.photos_videos = updates.photos_videos;
      if (updates.location_in_home !== undefined) cleanUpdates.location_in_home = updates.location_in_home;
      if (updates.cost_estimate !== undefined) cleanUpdates.cost_estimate = updates.cost_estimate;
      if (updates.final_cost !== undefined) cleanUpdates.final_cost = updates.final_cost;
      if (updates.schedule_reminder !== undefined) cleanUpdates.schedule_reminder = updates.schedule_reminder;
      if (updates.reminder_date !== undefined) cleanUpdates.reminder_date = updates.reminder_date;
      if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
      
      cleanUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('repairs')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRepairs(prev => prev.map(repair => 
        repair.id === id ? data as Repair : repair
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
