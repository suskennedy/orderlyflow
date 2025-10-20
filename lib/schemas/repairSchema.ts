import { z } from 'zod';

export const repairFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  vendor_id: z.string().optional(),
  user_id: z.string().optional(),
  date_reported: z.string().optional(),
  description_issue: z.string().max(500, 'Description must be less than 500 characters').optional(),
  photos_videos: z.array(z.string()).max(10, 'Maximum 10 files allowed').optional(),
  location_in_home: z.string().max(255, 'Location must be less than 255 characters').optional(),
  cost_estimate: z.number().min(0, 'Cost estimate must be positive').optional(),
  final_cost: z.number().min(0, 'Final cost must be positive').optional(),
  schedule_reminder: z.boolean().default(false),
  reminder_date: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  status: z.enum(['to_do', 'scheduled', 'in_progress', 'complete']).default('to_do'),
});

export type RepairFormData = z.infer<typeof repairFormSchema>;

// Validation for vendor/user assignment - at least one must be selected
export const repairFormSchemaWithValidation = repairFormSchema.refine(
  (data: RepairFormData) => data.vendor_id || data.user_id,
  {
    message: 'Either a vendor or user must be assigned',
    path: ['vendor_id'], // This will show the error on the vendor field
  }
);
