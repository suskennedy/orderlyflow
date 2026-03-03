import { z } from 'zod';

export const MATERIAL_TYPES = [
  'Carpet',
  'Tile',
  'Wood',
  'Windows',
  'Wallpaper',
  'Backsplash',
  'Stone'
] as const;

export const materialFormSchema = z.object({
  type: z.enum(MATERIAL_TYPES),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be 100 characters or less'),
  brand: z.string().max(100, 'Brand must be 100 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export type MaterialFormData = z.infer<typeof materialFormSchema>;

export const transformMaterialFormData = (data: MaterialFormData) => ({
  type: data.type,
  location: data.location.trim(),
  brand: data.brand?.trim() || null,
  notes: data.notes?.trim() || null,
});
