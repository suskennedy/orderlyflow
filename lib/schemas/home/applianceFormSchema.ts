import { z } from 'zod';

export const APPLIANCE_TYPES = [
  'Washer', 'Dryer', 'Refrigerator', 'Freezer', 'Oven', 'Range', 
  'Dishwasher', 'Microwave', 'Garbage disposal', 'Ice maker'
] as const;

export const applianceFormSchema = z.object({
  type: z.enum(APPLIANCE_TYPES),
  brand: z.string().max(255, 'Brand must be less than 255 characters').optional(),
  model: z.string().max(255, 'Model must be less than 255 characters').optional(),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  
  // Media and notes
  manual_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  warranty_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type ApplianceFormData = z.infer<typeof applianceFormSchema>;

export const transformApplianceFormData = (data: ApplianceFormData) => ({
  type: data.type,
  brand: data.brand?.trim() || null,
  model: data.model?.trim() || null,
  location: data.location.trim(),
  manual_url: data.manual_url || null,
  warranty_url: data.warranty_url || null,
  notes: data.notes?.trim() || null,
});
