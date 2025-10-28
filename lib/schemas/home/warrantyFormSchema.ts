import { z } from 'zod';

export const warrantyFormSchema = z.object({
  // Required fields
  item_name: z.string().min(1, 'Item name is required').max(255, 'Item name must be less than 255 characters'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be less than 100 characters'),
  provider: z.string().min(1, 'Provider is required').max(255, 'Provider must be less than 255 characters'),
  
  // Optional date fields
  warranty_start_date: z.string().optional(),
  warranty_end_date: z.string().optional(),
  
  // Optional notes field
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine(
  (data) => {
    // If warranty start date is provided, it should be in the past or today
    if (data.warranty_start_date) {
      const startDate = new Date(data.warranty_start_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return startDate <= today;
    }
    return true;
  },
  {
    message: 'Warranty start date must be today or in the past',
    path: ['warranty_start_date'],
  }
).refine(
  (data) => {
    // If both dates are provided, end date must be after start date
    if (data.warranty_start_date && data.warranty_end_date) {
      const startDate = new Date(data.warranty_start_date);
      const endDate = new Date(data.warranty_end_date);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'Warranty end date must be after start date',
    path: ['warranty_end_date'],
  }
);

export type WarrantyFormData = z.infer<typeof warrantyFormSchema>;

// Helper function to transform form data for API submission
export const transformWarrantyFormData = (data: WarrantyFormData) => ({
  item_name: data.item_name.trim(),
  room: data.room.trim(),
  provider: data.provider.trim(),
  warranty_start_date: data.warranty_start_date || null,
  warranty_end_date: data.warranty_end_date || null,
  notes: data.notes?.trim() || null,
});
