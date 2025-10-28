import { z } from 'zod';

export const paintColorFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Paint name is required').max(255, 'Paint name must be less than 255 characters'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be less than 100 characters'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand must be less than 255 characters'),
  color_code: z.string().min(1, 'Color code is required').max(50, 'Color code must be less than 50 characters'),
  color_hex: z.string().min(1, 'Color hex is required').regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex must be a valid hex color (e.g., #FFFFFF)'),
  
  // Optional notes field
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type PaintColorFormData = z.infer<typeof paintColorFormSchema>;

// Helper function to transform form data for API submission
export const transformPaintColorFormData = (data: PaintColorFormData) => ({
  name: data.name.trim(),
  room: data.room.trim(),
  brand: data.brand.trim(),
  color_code: data.color_code.trim(),
  color_hex: data.color_hex.trim(),
  notes: data.notes?.trim() || null,
});
