import { z } from 'zod';

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const TASK_CATEGORIES = [
  'Maintenance',
  'Repair', 
  'Cleaning',
  'Inspection',
  'Upgrade',
  'Seasonal',
  'Emergency',
  'Other'
] as const;
export const RECURRENCE_PATTERNS = [
  'daily',
  'weekly', 
  'bi-weekly',
  'monthly',
  'quarterly',
  'semi-annually',
  'annually'
] as const;

export const taskFormSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Task title is required').max(255, 'Task title must be less than 255 characters'),
  home_id: z.string().min(1, 'Please select a home for this task'),
  
  // Optional basic info
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  category: z.enum(TASK_CATEGORIES).optional(),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  status: z.enum(TASK_STATUSES).default('pending'),
  
  // Optional scheduling
  due_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.enum(RECURRENCE_PATTERNS).optional(),
  recurrence_end_date: z.string().optional(),
  
  // Optional assignment and location
  assigned_user_id: z.string().optional(),
  assigned_vendor_id: z.string().optional(),
  room_location: z.string().max(255, 'Room location must be less than 255 characters').optional(),
  
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

export type TaskFormData = z.infer<typeof taskFormSchema>;

// Helper function to transform form data for API submission
export const transformTaskFormData = (data: TaskFormData) => ({
  title: data.title.trim(),
  description: data.description?.trim() || null,
  category: data.category || null,
  priority: data.priority,
  status: data.status,
  due_date: data.due_date || null,
  is_recurring: data.is_recurring,
  recurrence_pattern: data.recurrence_pattern || null,
  recurrence_end_date: data.recurrence_end_date || null,
  home_id: data.home_id,
  assigned_user_id: data.assigned_user_id || null,
  assigned_vendor_id: data.assigned_vendor_id || null,
  room_location: data.room_location?.trim() || null,
  notes: data.notes?.trim() || null,
});
