import { z } from 'zod';

export const materialFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Material name is required').max(255, 'Material name must be less than 255 characters'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be less than 100 characters'),
  type: z.string().min(1, 'Type is required').max(100, 'Type must be less than 100 characters'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand must be less than 255 characters'),
  source: z.string().min(1, 'Source is required').max(255, 'Source must be less than 255 characters'),
  
  // Optional date field
  purchase_date: z.string().optional(),
  
  // Optional notes field
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
}).refine(
  (data) => {
    // If purchase date is provided, it should be in the past or today
    if (data.purchase_date) {
      const purchaseDate = new Date(data.purchase_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return purchaseDate <= today;
    }
    return true;
  },
  {
    message: 'Purchase date must be today or in the past',
    path: ['purchase_date'],
  }
);

export type MaterialFormData = z.infer<typeof materialFormSchema>;

// Helper function to transform form data for API submission
export const transformMaterialFormData = (data: MaterialFormData) => ({
  name: data.name.trim(),
  room: data.room.trim(),
  type: data.type.trim(),
  brand: data.brand.trim(),
  source: data.source.trim(),
  purchase_date: data.purchase_date || null,
  notes: data.notes?.trim() || null,
});
