import { z } from 'zod';

export const filterFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Filter name is required').max(255, 'Filter name must be less than 255 characters'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be less than 100 characters'),
  type: z.string().min(1, 'Type is required').max(100, 'Type must be less than 100 characters'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand must be less than 255 characters'),
  model: z.string().min(1, 'Model is required').max(100, 'Model must be less than 100 characters'),
  size: z.string().min(1, 'Size is required').max(50, 'Size must be less than 50 characters'),
  replacement_frequency: z.string().min(1, 'Replacement frequency is required').transform((val) => parseInt(val)).refine((val) => val >= 1 && val <= 120, 'Replacement frequency must be between 1 and 120 months'),
  
  // Optional date field
  last_replaced: z.string().optional(),
  
  // Optional notes field
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine(
  (data) => {
    // If last replaced date is provided, it should be in the past or today
    if (data.last_replaced) {
      const lastReplacedDate = new Date(data.last_replaced);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return lastReplacedDate <= today;
    }
    return true;
  },
  {
    message: 'Last replaced date must be today or in the past',
    path: ['last_replaced'],
  }
);

export type FilterFormData = z.infer<typeof filterFormSchema>;

// Helper function to transform form data for API submission
export const transformFilterFormData = (data: FilterFormData) => ({
  name: data.name.trim(),
  room: data.room.trim(),
  type: data.type.trim(),
  brand: data.brand.trim(),
  model: data.model.trim(),
  size: data.size.trim(),
  last_replaced: data.last_replaced || null,
  replacement_frequency: data.replacement_frequency,
  notes: data.notes?.trim() || null,
});
