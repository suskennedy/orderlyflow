import { z } from 'zod';

export const FOUNDATION_TYPES = [
  'slab',
  'crawl_space',
  'basement',
  'pier_and_beam',
  'other'
] as const;

export const homeFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Home name is required').max(255, 'Home name must be less than 255 characters'),
  
  // Optional address fields
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  city: z.string().max(100, 'City must be less than 100 characters').optional(),
  state: z.string().max(50, 'State must be less than 50 characters').optional(),
  zip: z.string().max(20, 'ZIP code must be less than 20 characters').optional(),
  
  // Optional property details
  bedrooms: z.string().optional().transform((val) => val ? parseInt(val) : null).refine((val) => val === null || (val >= 0 && val <= 50), 'Bedrooms must be between 0 and 50'),
  bathrooms: z.string().optional().transform((val) => val ? parseFloat(val) : null).refine((val) => val === null || (val >= 0 && val <= 50), 'Bathrooms must be between 0 and 50'),
  square_footage: z.string().optional().transform((val) => val ? parseInt(val) : null).refine((val) => val === null || (val >= 0 && val <= 100000), 'Square footage must be between 0 and 100,000'),
  year_built: z.string().optional().transform((val) => val ? parseInt(val) : null).refine((val) => val === null || (val >= 1800 && val <= new Date().getFullYear()), 'Year built must be between 1800 and current year'),
  
  // Optional dates and selections
  purchase_date: z.string().optional(),
  foundation_type: z.enum(FOUNDATION_TYPES).optional(),
  
  // Optional text fields
  warranty_info: z.string().max(2000, 'Warranty info must be less than 2000 characters').optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  
  // Optional media and location
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => {
    // If latitude is provided, longitude must also be provided
    if (data.latitude !== null && data.longitude === null) return false;
    if (data.longitude !== null && data.latitude === null) return false;
    return true;
  },
  {
    message: 'Both latitude and longitude must be provided together',
    path: ['latitude'],
  }
).refine(
  (data) => {
    // If purchase date is provided, it should be in the past
    if (data.purchase_date) {
      const purchaseDate = new Date(data.purchase_date);
      const today = new Date();
      return purchaseDate <= today;
    }
    return true;
  },
  {
    message: 'Purchase date must be in the past',
    path: ['purchase_date'],
  }
);

export type HomeFormData = z.infer<typeof homeFormSchema>;

// Helper function to transform form data for API submission
export const transformHomeFormData = (data: HomeFormData) => ({
  name: data.name.trim(),
  address: data.address?.trim() || null,
  city: data.city?.trim() || null,
  state: data.state?.trim() || null,
  zip: data.zip?.trim() || null,
  bedrooms: data.bedrooms,
  bathrooms: data.bathrooms,
  square_footage: data.square_footage,
  year_built: data.year_built,
  purchase_date: data.purchase_date || null,
  foundation_type: data.foundation_type || null,
  warranty_info: data.warranty_info?.trim() || null,
  notes: data.notes?.trim() || null,
  image_url: data.image_url || null,
  latitude: data.latitude,
  longitude: data.longitude,
});
