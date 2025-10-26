import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
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

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  currentHome: string | null;
  setCurrentHome: (homeId: string) => void;
  fetchProjects: (homeId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

interface ProjectsProviderProps {
  children: ReactNode;
}

export const ProjectsProvider = ({ children }: ProjectsProviderProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentHome, setCurrentHome] = useState<string | null>(null);
  const { user } = useAuth();

  // Debounce timer for project updates
  const projectUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async (homeId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscription for projects
  const handleProjectChange = useCallback(async (payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      
      // Clear existing timer
      if (projectUpdateTimerRef.current) {
        clearTimeout(projectUpdateTimerRef.current);
      }
      
      // Set new debounced timer
      const timer = setTimeout(async () => {
        // Refresh projects for the affected home
        if (homeId === currentHome) {
          await fetchProjects(homeId);
        }
      }, 200); // 200ms debounce
      
      projectUpdateTimerRef.current = timer;
    }
  }, [currentHome, fetchProjects]);

  // Set up the projects real-time subscription
  useRealTimeSubscription(
    { 
      table: 'projects',
    },
    handleProjectChange
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (projectUpdateTimerRef.current) {
        clearTimeout(projectUpdateTimerRef.current);
      }
    };
  }, []);

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Calendar event will be created automatically by database trigger
      // if start_date is provided
      
      setProjects(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  }, [user?.id]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
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
      
      setProjects(prev => prev.map(project => 
        project.id === id ? data : project
      ));
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProjects(prev => prev.filter(project => project.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, []);

  const value: ProjectsContextType = {
    projects,
    loading,
    currentHome,
    setCurrentHome,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
