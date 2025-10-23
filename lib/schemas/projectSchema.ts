import { z } from 'zod';

export const PROJECT_TYPES = [
  'renovation',
  'remodel',
  'landscaping',
  'decorating',
  'organization',
  'other',
] as const;

export const PROJECT_STATUS = [
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
] as const;

const SubtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(255),
  is_done: z.boolean().default(false),
  due_date: z.string().optional(),
});

export const projectFormSchema = z
  .object({
    title: z.string().min(1, 'Project title is required').max(255),
    project_type: z.enum(PROJECT_TYPES, { error: 'Please select a project type' }),
    start_date: z.string().optional(),
    target_completion_date: z.string().optional(),
    description: z.string().max(2000, 'Description too long').optional(),
    photos_inspiration: z.array(z.string()).max(10, 'Maximum 10 files allowed').optional(),
    location_in_home: z.string().max(255, 'Location must be less than 255 characters').optional(),
    vendor_ids: z.array(z.string()).max(20, 'Too many vendors selected').optional(),
    assigned_user_ids: z.array(z.string()).max(20, 'Too many users selected').optional(),
    estimated_budget: z.number().min(0, 'Must be positive').optional(),
    current_spend: z.number().min(0, 'Must be positive').optional(),
    final_cost: z.number().min(0, 'Must be positive').optional(),
    status: z.enum(PROJECT_STATUS).default('not_started'),
    reminders_enabled: z.boolean().default(false),
    notes: z.string().max(2000, 'Notes too long').optional(),
    subtasks: z.array(SubtaskSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.target_completion_date) return true;
      return data.start_date <= data.target_completion_date;
    },
    {
      message: 'Target completion date must be after start date',
      path: ['target_completion_date'],
    }
  );

export type ProjectFormData = z.infer<typeof projectFormSchema>;

