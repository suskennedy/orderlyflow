import { create } from 'zustand';
import { Database } from '../../supabase-types';
import { supabase } from '../supabase';

// Use database types for consistency
type TaskTemplate = Database['public']['Tables']['tasks']['Row'];
type HomeTask = Database['public']['Tables']['home_tasks']['Row'];
type HomeTaskInsert = Database['public']['Tables']['home_tasks']['Insert'];
type HomeTaskUpdate = Database['public']['Tables']['home_tasks']['Update'];

interface TasksState {
  // Data
  templateTasks: TaskTemplate[];
  homeTasksByHome: Record<string, HomeTask[]>; // Store home tasks by homeId
  allHomeTasks: HomeTask[]; // Tasks from all homes for dashboard
  currentHomeId: string | null;
  loading: boolean;

  // Setters
  setTemplateTasks: (tasks: TaskTemplate[]) => void;
  setHomeTasks: (homeId: string, tasks: HomeTask[]) => void;
  setAllHomeTasks: (tasks: HomeTask[]) => void;
  setCurrentHomeId: (homeId: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Actions
  fetchTemplateTasks: () => Promise<void>;
  fetchHomeTasks: (homeId: string) => Promise<void>;
  fetchAllHomeTasks: (userId: string) => Promise<void>;
  activateTemplateForHome: (templateId: string, homeId: string, userId: string, details: any) => Promise<void>;
  createCustomTask: (homeId: string, taskData: any) => Promise<HomeTask>;
  updateHomeTask: (homeTaskId: string, updates: any) => Promise<void>;
  completeHomeTask: (homeTaskId: string, currentHomeId: string | null, completionData: any) => Promise<void>;
  createHomeTaskWithCalendar: (homeId: string, userId: string, taskData: any, calendarOptions?: any) => Promise<HomeTask>;
  updateHomeTaskWithCalendar: (homeTaskId: string, userId: string, updates: any, calendarOptions?: any) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  templateTasks: [],
  homeTasksByHome: {},
  allHomeTasks: [],
  currentHomeId: null,
  loading: false,

  setTemplateTasks: (tasks) => set({ templateTasks: tasks }),
  setHomeTasks: (homeId, tasks) => {
    set((state) => ({
      homeTasksByHome: {
        ...state.homeTasksByHome,
        [homeId]: tasks,
      },
    }));
  },
  setAllHomeTasks: (tasks) => set({ allHomeTasks: tasks }),
  setCurrentHomeId: (homeId) => set({ currentHomeId: homeId }),
  setLoading: (loading) => set({ loading }),

  fetchTemplateTasks: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      set({ templateTasks: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching template tasks:', error);
      set({ loading: false });
    }
  },

  fetchHomeTasks: async (homeId: string) => {
    if (!homeId) {
      get().setHomeTasks(homeId, []);
      set({ loading: false });
      return;
    }
    
    // Prevent concurrent calls for the same homeId
    const state = get();
    if (state.loading) {
      const currentTasks = state.homeTasksByHome[homeId];
      if (currentTasks && currentTasks.length > 0) {
        console.log('TasksStore: Already fetching tasks for homeId:', homeId, '- skipping duplicate call');
        return;
      }
    }
    
    try {
      set({ loading: true });
      console.log('TasksStore: fetchHomeTasks called for homeId:', homeId);
      
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
      const repairTasks = (repairsData || []).filter(repair => repair.home_id).map(repair => ({
        id: `repair_${repair.id}`,
        task_id: null,
        home_id: repair.home_id!,
        title: repair.title,
        description: repair.description,
        category: 'Repair',
        subcategory: null,
        due_date: repair.reminder_date,
        priority: null,
        assigned_user_id: repair.user_id,
        assigned_vendor_id: repair.vendor_id,
        notes: repair.notes,
        room_location: repair.location_in_home,
        is_active: true,
        status: repair.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        created_by: repair.created_by,
        completed_at: repair.status === 'completed' ? repair.updated_at : null,
        next_due: null,
        actual_cost: repair.final_cost,
        estimated_cost: repair.cost_estimate,
        item_type: 'repair' as const,
        original_id: repair.id,
        // Missing HomeTask fields - set to null
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: repair.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: repair.photos_videos,
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
        task_type: null,
      } as HomeTask));

      // Convert projects to home task format
      const projectTasks = (projectsData || []).filter(project => project.home_id).map(project => ({
        id: `project_${project.id}`,
        task_id: null,
        home_id: project.home_id!,
        title: project.title,
        description: project.description,
        category: project.category || 'Project',
        subcategory: null,
        due_date: project.start_date || project.end_date,
        priority: project.priority,
        assigned_user_id: project.assigned_user_ids?.[0] || null,
        assigned_vendor_id: project.vendor_ids?.[0] || null,
        notes: project.notes,
        room_location: project.location_in_home,
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
        actual_cost: project.final_cost,
        estimated_cost: project.estimated_budget,
        start_date: project.start_date,
        end_date: project.end_date,
        item_type: 'project' as const,
        original_id: project.id,
        // Missing HomeTask fields - set to null
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: project.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: project.photos_inspiration,
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
        task_type: null,
      } as HomeTask));

      // Combine all tasks
      const allTasks = [
        ...(homeTasksData || []),
        ...repairTasks,
        ...projectTasks
      ];

      get().setHomeTasks(homeId, allTasks);
      console.log('TasksStore: fetchHomeTasks completed, tasks count:', allTasks.length);
      set({ loading: false });
    } catch (error) {
      console.error('Error fetching home tasks, repairs, and projects:', error);
      get().setHomeTasks(homeId, []);
      set({ loading: false });
    }
  },

  fetchAllHomeTasks: async (userId: string) => {
    if (!userId) {
      console.log('TasksStore: No user ID, skipping fetchAllHomeTasks');
      set({ allHomeTasks: [], loading: false });
      return;
    }
    
    // Prevent concurrent calls
    const state = get();
    if (state.loading) {
      console.log('TasksStore: Already fetching, skipping duplicate call');
      return;
    }
    
    console.log('TasksStore: Fetching all home tasks for user:', userId);
    
    try {
      set({ loading: true });
      
      // First get all homes for the user
      const { data: userHomes, error: homesError } = await supabase
        .from('homes')
        .select('id')
        .eq('user_id', userId);
      
      if (homesError) throw homesError;
      
      if (!userHomes || userHomes.length === 0) {
        console.log('TasksStore: No homes found for user:', userId);
        set({ allHomeTasks: [], loading: false });
        return;
      }
      
      const homeIds = userHomes.map(home => home.id);
      console.log('TasksStore: Found homes for user:', homeIds);
      
      // Get all home tasks for those homes
      const { data: homeTasksData, error: homeTasksError } = await supabase
        .from('home_tasks')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (homeTasksError) throw homeTasksError;

      // Get all repairs for those homes
      const { data: repairsData, error: repairsError } = await supabase
        .from('repairs')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (repairsError) throw repairsError;

      // Get all projects for those homes
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          homes!inner(name)
        `)
        .in('home_id', homeIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Convert repairs to home task format (same as fetchHomeTasks)
      const repairTasks = (repairsData || []).filter(repair => repair.home_id).map(repair => ({
        id: `repair_${repair.id}`,
        task_id: null,
        home_id: repair.home_id!,
        title: repair.title,
        description: repair.description,
        category: 'Repair',
        subcategory: null,
        due_date: repair.reminder_date,
        priority: null,
        assigned_user_id: repair.user_id,
        assigned_vendor_id: repair.vendor_id,
        notes: repair.notes,
        room_location: repair.location_in_home,
        is_active: true,
        status: repair.status === 'completed' ? 'completed' : 'pending',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        created_at: repair.created_at,
        updated_at: repair.updated_at,
        created_by: repair.created_by,
        completed_at: repair.status === 'completed' ? repair.updated_at : null,
        next_due: null,
        actual_cost: repair.final_cost,
        estimated_cost: repair.cost_estimate,
        item_type: 'repair' as const,
        original_id: repair.id,
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: repair.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: repair.photos_videos,
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
        task_type: null,
      } as HomeTask));

      // Convert projects to home task format (same as fetchHomeTasks)
      const projectTasks = (projectsData || []).filter(project => project.home_id).map(project => ({
        id: `project_${project.id}`,
        task_id: null,
        home_id: project.home_id!,
        title: project.title,
        description: project.description,
        category: project.category || 'Project',
        subcategory: null,
        due_date: project.start_date || project.end_date,
        priority: project.priority,
        assigned_user_id: project.assigned_user_ids?.[0] || null,
        assigned_vendor_id: project.vendor_ids?.[0] || null,
        notes: project.notes,
        room_location: project.location_in_home,
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
        actual_cost: project.final_cost,
        estimated_cost: project.estimated_budget,
        start_date: project.start_date,
        end_date: project.end_date,
        item_type: 'project' as const,
        original_id: project.id,
        completion_notes: null,
        completed_by_type: null,
        completed_by_user_id: null,
        completed_by_vendor_id: null,
        completed_by_external_name: null,
        family_account_id: project.family_account_id,
        user_notes: null,
        vendor_notes: null,
        photos: project.photos_inspiration,
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
        task_type: null,
      } as HomeTask));

      // Combine all tasks
      const allTasks = [
        ...(homeTasksData || []),
        ...repairTasks,
        ...projectTasks
      ];

      console.log('TasksStore: Fetched all items:', {
        homeTasks: homeTasksData?.length || 0,
        repairs: repairsData?.length || 0,
        projects: projectsData?.length || 0,
        total: allTasks.length
      });
      
      set({ allHomeTasks: allTasks, loading: false });
    } catch (error) {
      console.error('Error fetching all home tasks:', error);
      set({ allHomeTasks: [], loading: false });
    }
  },

  activateTemplateForHome: async (templateId, homeId, userId, details) => {
    try {
      const template = get().templateTasks.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const homeTaskData: HomeTaskInsert = {
        task_id: templateId,
        home_id: homeId,
        title: template.title,
        description: template.description,
        category: template.category,
        subcategory: null,
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
        created_by: userId || null,
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
          user_id: userId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
        }
      }
      
      // Update local state
      const currentTasks = get().homeTasksByHome[homeId] || [];
      get().setHomeTasks(homeId, [data, ...currentTasks]);
    } catch (error) {
      console.error('Error activating template for home:', error);
      throw error;
    }
  },

  createCustomTask: async (homeId, taskData) => {
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
      const currentTasks = get().homeTasksByHome[homeId] || [];
      get().setHomeTasks(homeId, [data, ...currentTasks]);
      return data;
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  },

  updateHomeTask: async (homeTaskId, updates) => {
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
      
      // Update local state - find which home this task belongs to
      const state = get();
      for (const [homeId, tasks] of Object.entries(state.homeTasksByHome)) {
        const taskIndex = tasks.findIndex(t => t.id === homeTaskId);
        if (taskIndex !== -1) {
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = data;
          get().setHomeTasks(homeId, updatedTasks);
          break;
        }
      }
    } catch (error) {
      console.error('Error updating home task:', error);
      throw error;
    }
  },

  completeHomeTask: async (homeTaskId, currentHomeId, completionData) => {
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

        await get().updateHomeTask(homeTaskId, updates);

        // Remove calendar events associated with this completed task
        await supabase
          .from('calendar_events')
          .delete()
          .eq('home_task_id', homeTaskId);
      }

      // Refresh the tasks after completion
      if (currentHomeId) {
        await get().fetchHomeTasks(currentHomeId);
      }
      // Also refresh all home tasks for dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await get().fetchAllHomeTasks(user.id);
      }

    } catch (error) {
      console.error('Error completing home task:', error);
      throw error;
    }
  },

  createHomeTaskWithCalendar: async (homeId, userId, taskData, calendarOptions) => {
    try {
      const homeTaskData: HomeTaskInsert = {
        ...taskData,
        home_id: homeId,
        task_id: null, // Custom task
        is_active: true,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId || null,
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
          user_id: userId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: calendarError } = await supabase
          .from('calendar_events')
          .insert(calendarEventData);

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
        }
      }

      // Update local state
      const currentTasks = get().homeTasksByHome[homeId] || [];
      get().setHomeTasks(homeId, [data, ...currentTasks]);
      return data;
    } catch (error) {
      console.error('Error creating home task with calendar:', error);
      throw error;
    }
  },

  updateHomeTaskWithCalendar: async (homeTaskId, userId, updates, calendarOptions) => {
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
          user_id: userId || null,
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
      const state = get();
      for (const [homeId, tasks] of Object.entries(state.homeTasksByHome)) {
        const taskIndex = tasks.findIndex(t => t.id === homeTaskId);
        if (taskIndex !== -1) {
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = data;
          get().setHomeTasks(homeId, updatedTasks);
          break;
        }
      }
    } catch (error) {
      console.error('Error updating home task with calendar:', error);
      throw error;
    }
  },
}));

