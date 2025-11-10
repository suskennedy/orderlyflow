import { create } from 'zustand';
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

interface RepairsState {
  // Store repairs by homeId: { [homeId]: Repair[] }
  repairsByHome: Record<string, Repair[]>;
  // Store loading states by homeId: { [homeId]: boolean }
  loadingByHome: Record<string, boolean>;
  // Store current home for each component
  currentHomeByComponent: Record<string, string | null>;

  // Actions
  fetchRepairs: (homeId: string, userId: string) => Promise<void>;
  addRepair: (homeId: string, userId: string, repairData: Omit<Repair, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRepair: (homeId: string, id: string, updates: Partial<Repair>) => Promise<void>;
  deleteRepair: (homeId: string, id: string) => Promise<void>;
  setCurrentHome: (componentId: string, homeId: string | null) => void;
  
  // Internal setters for real-time updates
  setRepairs: (homeId: string, repairs: Repair[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useRepairsStore = create<RepairsState>((set, get) => ({
  repairsByHome: {},
  loadingByHome: {},
  currentHomeByComponent: {},

  setRepairs: (homeId, repairs) => {
    set((state) => ({
      repairsByHome: {
        ...state.repairsByHome,
        [homeId]: repairs,
      },
    }));
  },

  setLoading: (homeId, loading) => {
    set((state) => ({
      loadingByHome: {
        ...state.loadingByHome,
        [homeId]: loading,
      },
    }));
  },

  setCurrentHome: (componentId, homeId) => {
    set((state) => ({
      currentHomeByComponent: {
        ...state.currentHomeByComponent,
        [componentId]: homeId,
      },
    }));
  },

  fetchRepairs: async (homeId: string, userId: string) => {
    if (!userId || !homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      get().setRepairs(homeId, (data || []) as Repair[]);
    } catch (error) {
      console.error('Error fetching repairs:', error);
      get().setRepairs(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  addRepair: async (homeId, userId, repairData) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      // Create a clean repair data object with only valid fields
      const cleanRepairData = {
        home_id: repairData.home_id,
        title: repairData.title,
        description: repairData.description_issue, // Map description_issue to description
        status: repairData.status,
        created_by: userId,
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
      
      const { error } = await supabase
        .from('repairs')
        .insert([cleanRepairData])
        .select()
        .single();

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Repair created');
    } catch (error) {
      console.error('Error adding repair:', error);
      throw error;
    }
  },

  updateRepair: async (homeId, id, updates) => {
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
      
      const { error } = await supabase
        .from('repairs')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Repair updated');
    } catch (error) {
      console.error('Error updating repair:', error);
      throw error;
    }
  },

  deleteRepair: async (homeId, id) => {
    try {
      const { error } = await supabase
        .from('repairs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Repair deleted:', id);
    } catch (error) {
      console.error('Error deleting repair:', error);
      throw error;
    }
  },
}));

