import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export interface Project {
  id: string;
  home_id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_budget?: number;
  actual_budget?: number;
  start_date?: string;
  end_date?: string;
  completion_date?: string;
  assigned_vendor_id?: string;
  assigned_user_id?: string;
  notes?: string;
  photos?: string[];
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
