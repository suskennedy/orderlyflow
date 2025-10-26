import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Database } from '../../supabase-types';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';
import { supabase } from '../supabase';

// Use database types for consistency
type TaskTemplate = Database['public']['Tables']['tasks']['Row'];
// type TaskTemplateInsert = Database['public']['Tables']['tasks']['Insert'];
type HomeTask = Database['public']['Tables']['home_tasks']['Row'];
type HomeTaskInsert = Database['public']['Tables']['home_tasks']['Insert'];
type HomeTaskUpdate = Database['public']['Tables']['home_tasks']['Update'];

interface TasksContextType {
  // Data
  templateTasks: TaskTemplate[];
  homeTasks: HomeTask[];
  allHomeTasks: HomeTask[]; // Tasks from all homes for dashboard
  currentHomeId: string | null;
  loading: boolean;
  
  // Essential functions only
  fetchTemplateTasks: () => Promise<void>;
  fetchHomeTasks: (homeId: string) => Promise<void>;
  fetchAllHomeTasks: () => Promise<void>; // Fetch tasks from all homes
  activateTemplateForHome: (templateId: string, homeId: string, details: any) => Promise<void>;
  createCustomTask: (homeId: string, taskData: any) => Promise<HomeTask>;
  updateHomeTask: (homeTaskId: string, updates: any) => Promise<void>;
  completeHomeTask: (homeTaskId: string, completionData: any) => Promise<void>;
  setCurrentHome: (homeId: string | null) => void;
  
  // Calendar integration functions
  createHomeTaskWithCalendar: (homeId: string, taskData: any, calendarOptions?: any) => Promise<HomeTask>;
  updateHomeTaskWithCalendar: (homeTaskId: string, updates: any, calendarOptions?: any) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider = ({ children }: TasksProviderProps) => {
  const { user } = useAuth();
  const [templateTasks, setTemplateTasks] = useState<TaskTemplate[]>([]);
  const [homeTasks, setHomeTasks] = useState<HomeTask[]>([]);
  const [allHomeTasks, setAllHomeTasks] = useState<HomeTask[]>([]);
  const [currentHomeId, setCurrentHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('TasksProvider: Initialized with user:', user?.id, 'user object:', user);

  // Call 1: Fetch template tasks
  const fetchTemplateTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setTemplateTasks(data || []);
    } catch (error) {
      console.error('Error fetching template tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Call 2: Fetch home tasks, repairs, and projects for specific home
  const fetchHomeTasks = useCallback(async (homeId: string) => {
    try {
      console.log('TasksContext: fetchHomeTasks called for homeId:', homeId);
      setLoading(true);
      
      // Fetch home tasks
      const { data: homeTasksData, error: homeTasksError } = await supabase
        .from('home_tasks')
        .select(`
          *,
          homes!inner(name)
        `)
        .eq('home_id', homeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (homeTasksError) throw homeTasksError;

      // Fetch repairs for this home
      const { data: repairsData, error: repairsError } = await supabase
        .from('repairs')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (repairsError) throw repairsError;

      // Fetch projects for this home
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('home_id', homeId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Convert repairs to home task format
      const repairTasks = (repairsData || []).map(repair => ({
        id: `repair_${repair.id}`,
        task_id: null,
        home_id: repair.home_id,
        title: repair.title,
        description: repair.description,
        category: repair.category || 'Repair',
        subcategory: null,
        due_date: repair.due_date,
        priority: repair.priority,
        assigned_user_id: repair.assigned_user_id,
        assigned_vendor_id: repair.assigned_vendor_id,
        notes: repair.notes,
        room_location: null,
        is_active: true,
        status: repair.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        created_by: repair.created_by,
        completed_at: repair.completed_date,
        next_due: null,
        actual_cost: repair.actual_cost,
        estimated_cost: repair.estimated_cost,
        item_type: 'repair' as const,
        original_id: repair.id,
        // Missing HomeTask fields
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: repair.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: repair.photos,
        reminder_interval: null,
        last_reminder_sent: null,
        difficulty_level: null,
        estimated_time_minutes: null,
        actual_time_minutes: null,
        seasonal_month: null,
        seasonal_frequency: null,
        maintenance_interval_days: null,
        last_maintenance_date: null,
        next_maintenance_date: null,
        cost_per_occurrence: null,
        total_cost_to_date: null,
        completion_date: null,
        completion_verification_notes: null,
        completion_verification_status: null,
        custom_frequency: null,
        custom_frequency_unit: null,
        dependencies: null,
        equipment_needed: null,
        external_service_info: null,
        home_area: null,
        impact_if_skipped: null,
        inspection_checklist: null,
        is_emergency: false,
        is_seasonal: false,
        materials_needed: null,
        safety_notes: null,
        tags: null,
        tutorial_link: null,
        weather_dependent: false,
        equipment_required: null,
        estimated_duration_minutes: null,
        frequency_type: null,
        image_url: null,
        maintenance_log: null,
        next_scheduled_date: null,
        priority_score: null,
        resource_links: null,
        skill_level_required: null,
        instructions: null,
        is_recurring_task: false,
        last_completed: null,
        last_modified_by: null,
        location_notes: null,
        next_due_date: null,
        notification_settings: null,
        priority_notes: null,
        recurring_task_id: null,
        priority_level: null,
        recurrence_interval: null,
        recurrence_unit: null,
        suggested_frequency: null,
        task_type: null
      }));

      // Convert projects to home task format
      const projectTasks = (projectsData || []).map(project => ({
        id: `project_${project.id}`,
        task_id: null,
        home_id: project.home_id,
        title: project.title,
        description: project.description,
        category: project.category || 'Project',
        subcategory: null,
        due_date: project.start_date || project.end_date,
        priority: project.priority,
        assigned_user_id: project.assigned_user_id,
        assigned_vendor_id: project.assigned_vendor_id,
        notes: project.notes,
        room_location: null,
        is_active: true,
        status: project.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: project.created_at,
        updated_at: project.updated_at,
        created_by: project.created_by,
        completed_at: project.completion_date,
        next_due: null,
        actual_cost: project.actual_budget,
        estimated_cost: project.estimated_budget,
        start_date: project.start_date,
        end_date: project.end_date,
        item_type: 'project' as const,
        original_id: project.id,
        // Missing HomeTask fields
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: project.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: project.photos,
        reminder_interval: null,
        last_reminder_sent: null,
        difficulty_level: null,
        estimated_time_minutes: null,
        actual_time_minutes: null,
        seasonal_month: null,
        seasonal_frequency: null,
        maintenance_interval_days: null,
        last_maintenance_date: null,
        next_maintenance_date: null,
        cost_per_occurrence: null,
        total_cost_to_date: null,
        completion_date: null,
        completion_verification_notes: null,
        completion_verification_status: null,
        custom_frequency: null,
        custom_frequency_unit: null,
        dependencies: null,
        equipment_needed: null,
        external_service_info: null,
        home_area: null,
        impact_if_skipped: null,
        inspection_checklist: null,
        is_emergency: false,
        is_seasonal: false,
        materials_needed: null,
        safety_notes: null,
        tags: null,
        tutorial_link: null,
        weather_dependent: false,
        equipment_required: null,
        estimated_duration_minutes: null,
        frequency_type: null,
        image_url: null,
        maintenance_log: null,
        next_scheduled_date: null,
        priority_score: null,
        resource_links: null,
        skill_level_required: null,
        instructions: null,
        is_recurring_task: false,
        last_completed: null,
        last_modified_by: null,
        location_notes: null,
        next_due_date: null,
        notification_settings: null,
        priority_notes: null,
        recurring_task_id: null,
        priority_level: null,
        recurrence_interval: null,
        recurrence_unit: null,
        suggested_frequency: null,
        task_type: null
      }));

      // Combine all tasks
      const allTasks = [
        ...(homeTasksData || []),
        ...repairTasks,
        ...projectTasks
      ];

      setHomeTasks(allTasks);
      console.log('TasksContext: fetchHomeTasks completed, tasks count:', allTasks.length);
    } catch (error) {
      console.error('Error fetching home tasks, repairs, and projects:', error);
    } finally {
      console.log('TasksContext: fetchHomeTasks setting loading to false');
      setLoading(false);
    }
  }, []);

  // Call 2.5: Fetch home tasks for all homes (for dashboard)
  const fetchAllHomeTasks = useCallback(async () => {
    if (!user?.id) {
      console.log('TasksContext: No user ID, skipping fetchAllHomeTasks');
      return;
    }
    
    console.log('TasksContext: Fetching all home tasks for user:', user.id);
    
    try {
      setLoading(true);
      
      // First get all homes for the user
      const { data: userHomes, error: homesError } = await supabase
        .from('homes')
        .select('id')
        .eq('user_id', user.id);
      
      if (homesError) throw homesError;
      
      if (!userHomes || userHomes.length === 0) {
        console.log('TasksContext: No homes found for user:', user.id);
        setAllHomeTasks([]);
        return;
      }
      
      const homeIds = userHomes.map(home => home.id);
      console.log('TasksContext: Found homes for user:', homeIds);
      
      // First, let's check if there are any tasks at all in the database
      const { data: allTasksInDB } = await supabase
        .from('home_tasks')
        .select('*')
        .limit(10);
      
      console.log('TasksContext: All tasks in database:', allTasksInDB?.length || 0);
      if (allTasksInDB && allTasksInDB.length > 0) {
        console.log('TasksContext: Sample task from DB:', {
          id: allTasksInDB[0].id,
          title: allTasksInDB[0].title,
          home_id: allTasksInDB[0].home_id,
          is_active: allTasksInDB[0].is_active,
          status: allTasksInDB[0].status
        });
      }
      
      // Get all home tasks for those homes with home information
      const { data: homeTasksData, error: homeTasksError } = await supabase
        .from('home_tasks')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (homeTasksError) throw homeTasksError;

      // Get all repairs for those homes with home information
      const { data: repairsData, error: repairsError } = await supabase
        .from('repairs')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (repairsError) throw repairsError;

      // Get all projects for those homes with home information
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Convert repairs to home task format
      const repairTasks = (repairsData || []).map(repair => ({
        id: `repair_${repair.id}`,
        task_id: null,
        home_id: repair.home_id,
        title: repair.title,
        description: repair.description,
        category: repair.category || 'Repair',
        subcategory: null,
        due_date: repair.due_date,
        priority: repair.priority,
        assigned_user_id: repair.assigned_user_id,
        assigned_vendor_id: repair.assigned_vendor_id,
        notes: repair.notes,
        room_location: null,
        is_active: true,
        status: repair.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        created_by: repair.created_by,
        completed_at: repair.completed_date,
        next_due: null,
        actual_cost: repair.actual_cost,
        estimated_cost: repair.estimated_cost,
        item_type: 'repair' as const,
        original_id: repair.id,
        // Missing HomeTask fields
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: repair.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: repair.photos,
        reminder_interval: null,
        last_reminder_sent: null,
        difficulty_level: null,
        estimated_time_minutes: null,
        actual_time_minutes: null,
        seasonal_month: null,
        seasonal_frequency: null,
        maintenance_interval_days: null,
        last_maintenance_date: null,
        next_maintenance_date: null,
        cost_per_occurrence: null,
        total_cost_to_date: null,
        completion_date: null,
        completion_verification_notes: null,
        completion_verification_status: null,
        custom_frequency: null,
        custom_frequency_unit: null,
        dependencies: null,
        equipment_needed: null,
        external_service_info: null,
        home_area: null,
        impact_if_skipped: null,
        inspection_checklist: null,
        is_emergency: false,
        is_seasonal: false,
        materials_needed: null,
        safety_notes: null,
        tags: null,
        tutorial_link: null,
        weather_dependent: false,
        equipment_required: null,
        estimated_duration_minutes: null,
        frequency_type: null,
        image_url: null,
        maintenance_log: null,
        next_scheduled_date: null,
        priority_score: null,
        resource_links: null,
        skill_level_required: null,
        instructions: null,
        is_recurring_task: false,
        last_completed: null,
        last_modified_by: null,
        location_notes: null,
        next_due_date: null,
        notification_settings: null,
        priority_notes: null,
        recurring_task_id: null,
        priority_level: null,
        recurrence_interval: null,
        recurrence_unit: null,
        suggested_frequency: null,
        task_type: null
      }));

      // Convert projects to home task format
      const projectTasks = (projectsData || []).map(project => ({
        id: `project_${project.id}`,
        task_id: null,
        home_id: project.home_id,
        title: project.title,
        description: project.description,
        category: project.category || 'Project',
        subcategory: null,
        due_date: project.start_date || project.end_date,
        priority: project.priority,
        assigned_user_id: project.assigned_user_id,
        assigned_vendor_id: project.assigned_vendor_id,
        notes: project.notes,
        room_location: null,
        is_active: true,
        status: project.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: project.created_at,
        updated_at: project.updated_at,
        created_by: project.created_by,
        completed_at: project.completion_date,
        next_due: null,
        actual_cost: project.actual_budget,
        estimated_cost: project.estimated_budget,
        start_date: project.start_date,
        end_date: project.end_date,
        item_type: 'project' as const,
        original_id: project.id,
        // Missing HomeTask fields
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: project.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: project.photos,
        reminder_interval: null,
        last_reminder_sent: null,
        difficulty_level: null,
        estimated_time_minutes: null,
        actual_time_minutes: null,
        seasonal_month: null,
        seasonal_frequency: null,
        maintenance_interval_days: null,
        last_maintenance_date: null,
        next_maintenance_date: null,
        cost_per_occurrence: null,
        total_cost_to_date: null,
        completion_date: null,
        completion_verification_notes: null,
        completion_verification_status: null,
        custom_frequency: null,
        custom_frequency_unit: null,
        dependencies: null,
        equipment_needed: null,
        external_service_info: null,
        home_area: null,
        impact_if_skipped: null,
        inspection_checklist: null,
        is_emergency: false,
        is_seasonal: false,
        materials_needed: null,
        safety_notes: null,
        tags: null,
        tutorial_link: null,
        weather_dependent: false,
        equipment_required: null,
        estimated_duration_minutes: null,
        frequency_type: null,
        image_url: null,
        maintenance_log: null,
        next_scheduled_date: null,
        priority_score: null,
        resource_links: null,
        skill_level_required: null,
        instructions: null,
        is_recurring_task: false,
        last_completed: null,
        last_modified_by: null,
        location_notes: null,
        next_due_date: null,
        notification_settings: null,
        priority_notes: null,
        recurring_task_id: null,
        priority_level: null,
        recurrence_interval: null,
        recurrence_unit: null,
        suggested_frequency: null,
        task_type: null
      }));

      // Combine all tasks
      const allTasks = [
        ...(homeTasksData || []),
        ...repairTasks,
        ...projectTasks
      ];

      console.log('TasksContext: Fetched all items:', {
        homeTasks: homeTasksData?.length || 0,
        repairs: repairsData?.length || 0,
        projects: projectsData?.length || 0,
        total: allTasks.length
      });
      
      setAllHomeTasks(allTasks);
    } catch (error) {
      console.error('Error fetching all home tasks:', error);
    } finally {
      console.log('TasksContext: Setting loading to false');
      setLoading(false);
    }
  }, [user?.id]);

  // Call 3: Activate template for home
  const activateTemplateForHome = useCallback(async (templateId: string, homeId: string, details: any) => {
    try {
      const template = templateTasks.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const homeTaskData: HomeTaskInsert = {
        task_id: templateId,
        home_id: homeId,
        title: template.title,
        description: template.description,
        category: template.category,
        subcategory: template.subcategory,
        due_date: details.customSettings?.due_date || null,
        priority: details.customSettings?.priority || null,
        assigned_user_id: details.customSettings?.assigned_user_id || null,
        assigned_vendor_id: details.customSettings?.assigned_vendor_id || null,
        notes: details.customSettings?.notes || null,
        room_location: details.customSettings?.room_location || null,
        is_active: true,
        status: 'pending',
        is_recurring: details.customSettings?.is_recurring || false,
        recurrence_pattern: details.customSettings?.recurrence_pattern || null,
        recurrence_end_date: details.customSettings?.recurrence_end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, create calendar event
      if (details.calendarOptions && details.calendarOptions.create_calendar_event) {
        const calendarEventData = {
          title: template.title,
          description: template.description,
          start_time: details.calendarOptions.start_time,
          end_time: details.calendarOptions.end_time,
          home_id: homeId,
          task_id: templateId,
          home_task_id: data.id,
          task_type: 'task',
          is_recurring: details.calendarOptions.is_recurring || false,
          recurrence_pattern: details.calendarOptions.recurrence_pattern || null,
          recurrence_end_date: details.calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't throw error - task was created successfully
        }
      }
      
      // Update local state
      setHomeTasks(current => [data, ...current]);
    } catch (error) {
      console.error('Error activating template for home:', error);
      throw error;
    }
  }, [templateTasks, user?.id]);

  // Call 4: Create custom task
  const createCustomTask = useCallback(async (homeId: string, taskData: any) => {
    try {
      const homeTaskData: HomeTaskInsert = {
        ...taskData,
        home_id: homeId,
        task_id: null, // Custom task
        is_active: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setHomeTasks(current => [data, ...current]);
      return data;
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }, []);

  // Update home task
  const updateHomeTask = useCallback(async (homeTaskId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('home_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', homeTaskId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setHomeTasks(current => 
        current.map(task => task.id === homeTaskId ? data : task)
      );
    } catch (error) {
      console.error('Error updating home task:', error);
      throw error;
    }
  }, []);

  // Complete home task
  const completeHomeTask = useCallback(async (homeTaskId: string, completionData: any) => {
    try {
      // Check if this is a repair or project
      if (homeTaskId.startsWith('repair_')) {
        const repairId = homeTaskId.replace('repair_', '');
        const { error: repairError } = await supabase
          .from('repairs')
          .update({
            status: 'completed',
            completed_date: new Date().toISOString(),
            notes: completionData.notes ? `${completionData.notes || ''}\n\nCompleted by: ${completionData.completed_by_type === 'user' ? 'User' : completionData.completed_by_type === 'vendor' ? 'Vendor' : 'External'}` : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', repairId);

        if (repairError) throw repairError;

        // Remove calendar events associated with this completed repair
        await supabase
          .from('calendar_events')
          .delete()
          .eq('repair_id', repairId);

      } else if (homeTaskId.startsWith('project_')) {
        const projectId = homeTaskId.replace('project_', '');
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            status: 'completed',
            completion_date: new Date().toISOString(),
            notes: completionData.notes ? `${completionData.notes || ''}\n\nCompleted by: ${completionData.completed_by_type === 'user' ? 'User' : completionData.completed_by_type === 'vendor' ? 'Vendor' : 'External'}` : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (projectError) throw projectError;

        // Remove calendar events associated with this completed project
        await supabase
          .from('calendar_events')
          .delete()
          .eq('project_id', projectId);

      } else {
        // Regular home task
      const updates: HomeTaskUpdate = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_notes: completionData.notes,
        completed_by_type: completionData.completed_by_type,
        completed_by_user_id: completionData.completed_by_user_id,
        completed_by_vendor_id: completionData.completed_by_vendor_id,
        completed_by_external_name: completionData.completed_by_external_name,
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      await updateHomeTask(homeTaskId, updates);

      // Remove calendar events associated with this completed task
        await supabase
          .from('calendar_events')
          .delete()
          .eq('home_task_id', homeTaskId);
      }

      // Refresh the tasks after completion
      if (currentHomeId) {
        await fetchHomeTasks(currentHomeId);
      }

    } catch (error) {
      console.error('Error completing home task:', error);
      throw error;
    }
  }, [updateHomeTask, currentHomeId, fetchHomeTasks]);

  // Set current home
  const setCurrentHome = useCallback((homeId: string | null) => {
    console.log('TasksContext: setCurrentHome called with homeId:', homeId);
    setCurrentHomeId(homeId);
    if (homeId) {
      fetchHomeTasks(homeId);
    } else {
      setHomeTasks([]);
      setLoading(false); // Reset loading state when no home is selected
    }
  }, [fetchHomeTasks]);

  // Calendar integration functions
  const createHomeTaskWithCalendar = useCallback(async (homeId: string, taskData: any, calendarOptions?: any) => {
    try {
      // Create the home task first
      const homeTaskData: HomeTaskInsert = {
        ...taskData,
        home_id: homeId,
        task_id: null, // Custom task
        is_active: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('home_tasks')
        .insert(homeTaskData)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, create calendar event
      if (calendarOptions && calendarOptions.create_calendar_event) {
        const calendarEventData = {
          title: taskData.title,
          description: taskData.description,
          start_time: calendarOptions.start_time || new Date().toISOString(),
          end_time: calendarOptions.end_time || new Date().toISOString(),
          home_id: homeId,
          home_task_id: data.id,
          task_type: 'custom',
          is_recurring: calendarOptions.is_recurring || false,
          recurrence_pattern: calendarOptions.recurrence_pattern || null,
          recurrence_end_date: calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Don't throw error - task was created successfully
        }
      }

      // Update local state
      setHomeTasks(current => [data, ...current]);
      return data;
    } catch (error) {
      console.error('Error creating home task with calendar:', error);
      throw error;
    }
  }, [user?.id]);

  const updateHomeTaskWithCalendar = useCallback(async (homeTaskId: string, updates: any, calendarOptions?: any) => {
    try {
      // Update the home task
      const { data, error } = await supabase
        .from('home_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', homeTaskId)
        .select()
        .single();

      if (error) throw error;

      // If calendar options are provided, update or create calendar event
      if (calendarOptions) {
        // Check if calendar event exists for this home task
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('home_task_id', homeTaskId)
          .single();

        const calendarEventData = {
          title: updates.title || data.title,
          description: updates.description || data.description,
          start_time: calendarOptions.start_time || new Date().toISOString(),
          end_time: calendarOptions.end_time || new Date().toISOString(),
          home_id: data.home_id,
          home_task_id: homeTaskId,
          task_type: 'custom',
          is_recurring: calendarOptions.is_recurring || false,
          recurrence_pattern: calendarOptions.recurrence_pattern || null,
          recurrence_end_date: calendarOptions.recurrence_end_date || null,
          user_id: user?.id || null,
          updated_at: new Date().toISOString(),
        };

        if (existingEvent) {
          // Update existing calendar event
          const { error: calendarError } = await supabase
            .from('calendar_events')
            .update(calendarEventData)
            .eq('id', existingEvent.id);

          if (calendarError) {
            console.error('Error updating calendar event:', calendarError);
          }
        } else if (calendarOptions.create_calendar_event) {
          // Create new calendar event
          const { error: calendarError } = await supabase
            .from('calendar_events')
            .insert({
              ...calendarEventData,
              created_at: new Date().toISOString(),
            });

          if (calendarError) {
            console.error('Error creating calendar event:', calendarError);
          }
        }
      }

      // Update local state
      setHomeTasks(current => 
        current.map(task => task.id === homeTaskId ? data : task)
      );
    } catch (error) {
      console.error('Error updating home task with calendar:', error);
      throw error;
    }
  }, [user?.id]);

  // Performance optimizations with memoization
  // const activeTasks = useMemo(() => 
  //   homeTasks.filter(task => task.is_active && task.status !== 'completed'), 
  //   [homeTasks]
  // );

  // const completedTasks = useMemo(() => 
  //   homeTasks.filter(task => task.status === 'completed'), 
  //   [homeTasks]
  // );

  // const templatesWithStatus = useMemo(() => 
  //   templateTasks.map(template => ({
  //     ...template,
  //     isActive: homeTasks.some(task => task.task_id === template.id)
  //   })), 
  //   [templateTasks, homeTasks]
  // );

  // Debounce timer for task updates
  const taskUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up real-time subscription for home_tasks
  const handleHomeTaskChange = useCallback(async (payload: any) => {
    // Handle changes from home_tasks, repairs, or projects tables
    const homeId = payload.new?.home_id || payload.old?.home_id;
    
    if (homeId) {
      // Clear existing timer
      if (taskUpdateTimerRef.current) {
        clearTimeout(taskUpdateTimerRef.current);
      }
      
      // Set new debounced timer
      const timer = setTimeout(async () => {
        // Always refresh all home tasks for dashboard
        await fetchAllHomeTasks();
        
        // Also refresh current home tasks if this change affects the current home
        if (homeId === currentHomeId) {
          await fetchHomeTasks(homeId);
        }
      }, 200); // 200ms debounce
      
      taskUpdateTimerRef.current = timer;
    }
  }, [currentHomeId, fetchHomeTasks, fetchAllHomeTasks]);

  // Set up real-time subscription for home_tasks
  useRealTimeSubscription(
    { 
      table: 'home_tasks',
    },
    handleHomeTaskChange
  );

  // Set up real-time subscription for repairs (affects home_tasks display)
  useRealTimeSubscription(
    { 
      table: 'repairs',
    },
    handleHomeTaskChange
  );

  // Set up real-time subscription for projects (affects home_tasks display)
  useRealTimeSubscription(
    { 
      table: 'projects',
    },
    handleHomeTaskChange
  );

  // Load template tasks and all home tasks on mount
  useEffect(() => {
    console.log('TasksProvider: useEffect called, user:', user?.id);
    fetchTemplateTasks();
    fetchAllHomeTasks();
    
    // Cleanup timer on unmount
    return () => {
      if (taskUpdateTimerRef.current) {
        clearTimeout(taskUpdateTimerRef.current);
      }
    };
  }, [user?.id, fetchTemplateTasks, fetchAllHomeTasks]);

  const value = {
    // Data
    templateTasks,
    homeTasks,
    allHomeTasks,
    currentHomeId,
    loading,
    
    // Functions
    fetchTemplateTasks,
    fetchHomeTasks,
    fetchAllHomeTasks,
    activateTemplateForHome,
    createCustomTask,
    updateHomeTask,
    completeHomeTask,
    setCurrentHome,
    
    // Calendar integration functions
    createHomeTaskWithCalendar,
    updateHomeTaskWithCalendar,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
