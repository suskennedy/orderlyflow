import { z } from 'zod';

export const SEWER_TYPES = ['sewer', 'septic'] as const;
export const WATER_SOURCES = ['city', 'well'] as const;

export const homeFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Home name is required').max(255, 'Home name must be less than 255 characters'),
  
  // Optional address fields
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  
  // Optional property details
  bedrooms: z.union([z.string(), z.number()]).optional().nullable().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? null : num;
  }).refine((val) => val === null || (val >= 0 && val <= 50), 'Bedrooms must be between 0 and 50'),

  bathrooms: z.union([z.string(), z.number()]).optional().nullable().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).refine((val) => val === null || (val >= 0 && val <= 50), 'Bathrooms must be between 0 and 50'),

  square_footage: z.union([z.string(), z.number()]).optional().nullable().transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? null : num;
  }).refine((val) => val === null || (val >= 0 && val <= 100000), 'Square footage must be between 0 and 100,000'),
  
  // Utilities & Systems
  sewer_vs_septic: z.enum(SEWER_TYPES).optional(),
  water_source: z.enum(WATER_SOURCES).optional(),
  water_heater_location: z.string().max(500, 'Water heater location must be less than 500 characters').optional(),
  
  // Optional media
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type HomeFormData = z.infer<typeof homeFormSchema>;

// Helper function to transform form data for API submission
export const transformHomeFormData = (data: HomeFormData) => ({
  name: data.name.trim(),
  address: data.address?.trim() || null,
  bedrooms: data.bedrooms,
  bathrooms: data.bathrooms,
  square_footage: data.square_footage,
  sewer_vs_septic: data.sewer_vs_septic || null,
  water_source: data.water_source || null,
  water_heater_location: data.water_heater_location?.trim() || null,
  image_url: data.image_url || null,
});
