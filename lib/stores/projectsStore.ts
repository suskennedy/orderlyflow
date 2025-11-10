import { create } from 'zustand';
import { supabase } from '../supabase';

export interface Project {
  id: string;
  home_id: string;
  title: string;
  description?: string;
  project_type?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  estimated_budget?: number;
  current_spend?: number;
  final_cost?: number;
  start_date?: string;
  target_completion_date?: string;
  completion_date?: string;
  location_in_home?: string;
  vendor_ids?: string[];
  assigned_user_ids?: string[];
  photos_inspiration?: string[];
  reminders_enabled?: boolean;
  reminder_date?: string;
  notes?: string;
  subtasks?: any[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  family_account_id?: string;
}

interface ProjectsState {
  // Store projects by homeId: { [homeId]: Project[] }
  projectsByHome: Record<string, Project[]>;
  // Store loading states by homeId: { [homeId]: boolean }
  loadingByHome: Record<string, boolean>;
  // Store current home for each component
  currentHomeByComponent: Record<string, string | null>;

  // Actions
  fetchProjects: (homeId: string, userId: string) => Promise<void>;
  addProject: (homeId: string, userId: string, projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (homeId: string, id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (homeId: string, id: string) => Promise<void>;
  setCurrentHome: (componentId: string, homeId: string | null) => void;
  
  // Internal setters for real-time updates
  setProjects: (homeId: string, projects: Project[]) => void;
  setLoading: (homeId: string, loading: boolean) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projectsByHome: {},
  loadingByHome: {},
  currentHomeByComponent: {},

  setProjects: (homeId, projects) => {
    set((state) => ({
      projectsByHome: {
        ...state.projectsByHome,
        [homeId]: projects,
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

  fetchProjects: async (homeId: string, userId: string) => {
    if (!userId || !homeId) return;
    
    try {
      get().setLoading(homeId, true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      get().setProjects(homeId, (data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      get().setProjects(homeId, []);
    } finally {
      get().setLoading(homeId, false);
    }
  },

  addProject: async (homeId, userId, projectData) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Project created');
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  updateProject: async (homeId, id, updates) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Project updated');
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (homeId, id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Real-time subscription will handle the state update
      console.log('Project deleted:', id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
}));

