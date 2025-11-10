import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Project, useProjectsStore } from '../stores/projectsStore';
import { useAuth } from './useAuth';
import { useRealTimeSubscription } from './useRealTimeSubscription';

export function useProjects() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const homeIdFromParams = params.homeId as string | undefined;
  
  const {
    projectsByHome,
    loadingByHome,
    currentHomeByComponent,
    fetchProjects,
    setProjects,
    setLoading,
    setCurrentHome,
    addProject,
    updateProject,
    deleteProject,
  } = useProjectsStore();

  // Use a component ID to track current home per component instance
  const componentIdRef = useRef(`projects-${Date.now()}-${Math.random()}`);
  
  // Use homeId from params if available, otherwise use currentHome from store
  const currentHome = homeIdFromParams || currentHomeByComponent[componentIdRef.current] || null;
  const projects = currentHome ? (projectsByHome[currentHome] || []) : [];
  const loading = currentHome ? (loadingByHome[currentHome] ?? false) : false;

  // Debounce timer for project updates
  const projectUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle real-time changes
  const handleProjectChange = useCallback((payload: any) => {
    if (payload.new?.home_id || payload.old?.home_id) {
      const homeId = payload.new?.home_id || payload.old?.home_id;
      
      // Clear existing timer
      if (projectUpdateTimerRef.current) {
        clearTimeout(projectUpdateTimerRef.current);
      }
      
      // Set new debounced timer
      const timer = setTimeout(async () => {
        // Refresh projects for the affected home
        if (homeId === currentHome && user?.id) {
          await fetchProjects(homeId, user.id);
        }
      }, 200); // 200ms debounce
      
      projectUpdateTimerRef.current = timer;
    }
  }, [currentHome, user?.id, fetchProjects]);

  // Set up real-time subscription
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

  // Initial data fetch when currentHome changes
  useEffect(() => {
    if (currentHome && user?.id) {
      fetchProjects(currentHome, user.id);
    } else if (!currentHome) {
      setProjects('', []);
      setLoading('', false);
    }
  }, [currentHome, user?.id, fetchProjects, setProjects, setLoading]);

  return {
    projects,
    loading,
    currentHome,
    setCurrentHome: (homeId: string | null) => setCurrentHome(componentIdRef.current, homeId),
    fetchProjects: (homeId: string) => user?.id ? fetchProjects(homeId, user.id) : Promise.resolve(),
    addProject: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
      const targetHomeId = projectData.home_id || currentHome;
      if (!targetHomeId || !user?.id) {
        return Promise.reject(new Error('No home selected or user not authenticated'));
      }
      return addProject(targetHomeId, user.id, projectData);
    },
    updateProject: (id: string, updates: Partial<Project>) => {
      // Try to find the project to get its home_id, or use currentHome
      const project = projects.find(p => p.id === id);
      const targetHomeId = project?.home_id || currentHome;
      if (!targetHomeId) {
        return Promise.reject(new Error('No home selected'));
      }
      return updateProject(targetHomeId, id, updates);
    },
    deleteProject: (id: string) => {
      // Try to find the project to get its home_id, or use currentHome
      const project = projects.find(p => p.id === id);
      const targetHomeId = project?.home_id || currentHome;
      if (!targetHomeId) {
        return Promise.reject(new Error('No home selected'));
      }
      return deleteProject(targetHomeId, id);
    },
  };
}

