import { z } from 'zod';

export const CUSTOM_TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const CUSTOM_TASK_CATEGORIES = [
  'Deep Cleaning',
  'Health + Safety', 
  'Home Maintenance',
  'Repairs',
  'Custom'
] as const;
export const CUSTOM_RECURRENCE_PATTERNS = [
  'daily',
  'weekly',
  'bi-weekly', 
  'monthly',
  'quarterly',
  'semi-annually',
  'annually'
] as const;

export const customTaskFormSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Task title is required').max(255, 'Task title must be less than 255 characters'),
  category: z.enum(CUSTOM_TASK_CATEGORIES, { errorMap: () => ({ message: 'Category is required' }) }),
  home_id: z.string().min(1, 'Please select a home for this task'),
  
  // Optional basic info
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  priority: z.enum(CUSTOM_TASK_PRIORITIES).default('medium'),
  
  // Optional scheduling
  due_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(CUSTOM_RECURRENCE_PATTERNS).optional(),
  recurrence_end_date: z.string().optional(),
  
  // Optional assignment and location
  assigned_vendor_id: z.string().optional(),
  assigned_user_id: z.string().optional(),
  room_location: z.string().max(255, 'Room location must be less than 255 characters').optional(),
  
  // Optional detailed info
  instructions: z.string().max(2000, 'Instructions must be less than 2000 characters').optional(),
  equipment_required: z.string().max(1000, 'Equipment required must be less than 1000 characters').optional(),
  safety_notes: z.string().max(1000, 'Safety notes must be less than 1000 characters').optional(),
  estimated_cost: z.string().optional().transform((val) => val ? parseFloat(val) : null).refine((val) => val === null || val >= 0, 'Estimated cost must be positive'),
  estimated_duration_minutes: z.string().optional().transform((val) => val ? parseInt(val) : null).refine((val) => val === null || (val >= 0 && val <= 10080), 'Duration must be between 0 and 10080 minutes (1 week)'),
  
  // Optional notes
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
}).refine(
  (data) => {
    // If recurring is true, recurrence pattern must be provided
    if (data.is_recurring && !data.recurrence_pattern) {
      return false;
    }
    return true;
  },
  {
    message: 'Recurrence pattern is required for recurring tasks',
    path: ['recurrence_pattern'],
  }
).refine(
  (data) => {
    // If recurrence end date is provided, it must be after due date
    if (data.due_date && data.recurrence_end_date) {
      const dueDate = new Date(data.due_date);
      const endDate = new Date(data.recurrence_end_date);
      return endDate >= dueDate;
    }
    return true;
  },
  {
    message: 'Recurrence end date must be after due date',
    path: ['recurrence_end_date'],
  }
);

export type CustomTaskFormData = z.infer<typeof customTaskFormSchema>;

// Helper function to transform form data for API submission
export const transformCustomTaskFormData = (data: CustomTaskFormData) => {
  // Determine task_type based on category
  const getTaskType = (category: string) => {
    switch (category) {
      case 'Deep Cleaning':
        return 'deep_cleaning';
      case 'Health + Safety':
        return 'health_safety';
      case 'Home Maintenance':
        return 'home_maintenance';
      case 'Repairs':
        return 'repairs';
      case 'Custom':
        return 'custom';
      default:
        return 'custom';
    }
  };

  return {
    title: data.title.trim(),
    description: data.description?.trim() || null,
    category: data.category,
    subcategory: null,
    priority: data.priority,
    priority_level: data.priority,
    due_date: data.due_date || null,
    is_recurring: data.is_recurring,
    recurrence_pattern: data.recurrence_pattern || null,
    recurrence_end_date: data.recurrence_end_date || null,
    home_id: data.home_id,
    notes: data.notes?.trim() || null,
    assigned_vendor_id: data.assigned_vendor_id || null,
    assigned_user_id: data.assigned_user_id || null,
    instructions: data.instructions?.trim() || null,
    estimated_cost: data.estimated_cost,
    room_location: data.room_location?.trim() || null,
    equipment_required: data.equipment_required?.trim() || null,
    safety_notes: data.safety_notes?.trim() || null,
    estimated_duration_minutes: data.estimated_duration_minutes,
    task_type: getTaskType(data.category),
    is_active: true,
    status: 'pending' as const,
  };
};
