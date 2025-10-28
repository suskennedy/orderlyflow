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

export const PRIORITY_OPTIONS = ['Primary', 'Secondary'] as const;

export const vendorFormSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(255, 'Vendor name is too long'),
  category: z.enum(VENDOR_CATEGORIES, { message: 'Please select a valid category' }),
  contact_name: z.string().max(255, 'Contact name is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().url('Invalid URL format').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  priority: z.enum(PRIORITY_OPTIONS).default('Primary'),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

export const transformVendorFormData = (data: VendorFormData) => ({
  ...data,
  contact_name: data.contact_name || null,
  phone: data.phone || null,
  email: data.email || null,
  website: data.website || null,
  address: data.address || null,
  notes: data.notes || null,
});
