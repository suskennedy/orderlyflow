import { z } from 'zod';

export const APPLIANCE_TYPES = [
  'Washer', 'Dryer', 'Refrigerator', 'Freezer', 'Oven', 'Range', 
  'Dishwasher', 'Microwave', 'Garbage disposal', 'Ice maker', 'Other'
] as const;

export const applianceFormSchema = z.object({
  name: z.string().min(1, 'Appliance name is required').max(255, 'Appliance name must be less than 255 characters'),
  type: z.enum(APPLIANCE_TYPES),
  brand: z.string().max(255, 'Brand must be less than 255 characters').optional(),
  model: z.string().max(255, 'Model must be less than 255 characters').optional(),
  room: z.string().max(100, 'Room must be less than 100 characters').optional(),
  purchased_store: z.string().max(255, 'Store must be less than 255 characters').optional(),
  
  // Media and notes
  manual_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  warranty_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type ApplianceFormData = z.infer<typeof applianceFormSchema>;

export const transformApplianceFormData = (data: ApplianceFormData) => ({
  name: data.name.trim(),
  type: data.type,
  brand: data.brand?.trim() || null,
  model: data.model?.trim() || null,
  room: data.room?.trim() || null,
  purchased_store: data.purchased_store?.trim() || null,
  manual_url: data.manual_url || null,
  warranty_url: data.warranty_url || null,
  notes: data.notes?.trim() || null,
});
