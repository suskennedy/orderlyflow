import { z } from 'zod';

export const VENDOR_CATEGORIES = [
  'Appliances',
  'Architect',
  'Builder',
  'Carpenter',
  'Cleaning',
  'Closets',
  'Drywall',
  'Electrician',
  'Fencing',
  'Flooring',
  'Garage Door',
  'Handyman',
  'HVAC',
  'Interior Designs',
  'Landscape',
  'Masonry / Concrete',
  'Organizer',
  'Painter',
  'Pest Control',
  'Plumber',
  'Pool / Spa',
  'Roofing',
  'Security',
  'Solar Panel',
  'Well / Water Treatment',
  'Windows',
  'Other',
] as const;

export const vendorFormSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(255, 'Vendor name is too long'),
  /** Optional — helps group vendors (plumber, electrician, etc.) */
  category: z.union([z.enum(VENDOR_CATEGORIES), z.null()]).optional(),
  phone: z.string().min(1, 'Phone is required').max(40, 'Phone number is too long'),
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

/** Payload for Supabase — legacy columns cleared so we only store the simplified schema */
export const transformVendorFormData = (data: VendorFormData) => ({
  name: data.name.trim(),
  category: data.category ?? null,
  phone: data.phone.trim(),
  email: data.email?.trim() || null,
  notes: data.notes?.trim() || null,
  contact_name: null,
  website: null,
  address: null,
});
