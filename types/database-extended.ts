// Extended types for the new home_tasks structure
export interface TaskTemplate {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priority?: string | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
  
  // Template-specific fields
  status: 'template'; // Templates are always 'template' status
  suggested_frequency?: string | null;
  instructions?: string | null;
  estimated_cost?: number | null;
  task_type?: string | null;
  priority_level?: string | null;
  room_location?: string | null;
  equipment_required?: string | null;
  safety_notes?: string | null;
  estimated_duration_minutes?: number | null;
  is_recurring_task?: boolean | null;
  recurrence_interval?: number | null;
  recurrence_unit?: string | null;
  created_by?: string | null;
}

export interface HomeTask {
  id: string;
  home_id: string;
  task_id: string;
  is_active: boolean;
  assigned_vendor_id?: string | null;
  assigned_user_id?: string | null;
  due_date?: string | null;
  next_due?: string | null;
  notes?: string | null;
  status?: string | null;
  completed_at?: string | null;
  completion_notes?: string | null;
  completed_by_type?: 'vendor' | 'user' | 'external' | null;
  completed_by_vendor_id?: string | null;
  completed_by_user_id?: string | null;
  completed_by_external_name?: string | null;
  completion_verification_status?: 'pending' | 'verified' | 'disputed' | null;
  last_completed?: string | null;
  created_at: string;
  updated_at?: string | null;
}

// Combined type for UI that includes template data with home-specific data
export interface TaskItem extends TaskTemplate {
  // Home-specific task data from junction table
  home_task_id?: string;
  home_id?: string;
  is_active?: boolean;
  assigned_vendor_id?: string | null;
  assigned_user_id?: string | null;
  due_date?: string | null;
  next_due?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  completed_by_type?: 'vendor' | 'user' | 'external' | null;
  completed_by_vendor_id?: string | null;
  completed_by_user_id?: string | null;
  completed_by_external_name?: string | null;
  completion_verification_status?: 'pending' | 'verified' | 'disputed' | null;
  last_completed?: string | null;
  
  // Relationships
  homes?: {
    name: string;
  } | null;
  assigned_vendor?: {
    name: string;
  } | null;
  assigned_user?: {
    display_name: string;
  } | null;
}

export interface CalendarEventExtended {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  color?: string | null;
  all_day?: boolean | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  task_id?: string | null;
  home_task_id?: string | null; // New field
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
