import { z } from 'zod';

export const applianceFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Appliance name is required').max(255, 'Appliance name must be less than 255 characters'),
  brand: z.string().min(1, 'Brand is required').max(255, 'Brand must be less than 255 characters'),
  model: z.string().min(1, 'Model is required').max(100, 'Model must be less than 100 characters'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be less than 100 characters'),
  manual_url: z.string().min(1, 'Manual URL is required').url('Manual URL must be a valid URL'),
  purchased_store: z.string().min(1, 'Purchased store is required').max(255, 'Purchased store must be less than 255 characters'),
  
  // Optional date fields
  purchase_date: z.string().optional(),
  warranty_expiration: z.string().optional(),
  
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
).refine(
  (data) => {
    // If both dates are provided, warranty expiration must be after purchase date
    if (data.purchase_date && data.warranty_expiration) {
      const purchaseDate = new Date(data.purchase_date);
      const warrantyExpiration = new Date(data.warranty_expiration);
      return warrantyExpiration > purchaseDate;
    }
    return true;
  },
  {
    message: 'Warranty expiration must be after purchase date',
    path: ['warranty_expiration'],
  }
);

export type ApplianceFormData = z.infer<typeof applianceFormSchema>;

// Helper function to transform form data for API submission
export const transformApplianceFormData = (data: ApplianceFormData) => ({
  name: data.name.trim(),
  brand: data.brand.trim(),
  model: data.model.trim(),
  room: data.room.trim(),
  purchase_date: data.purchase_date || null,
  warranty_expiration: data.warranty_expiration || null,
  manual_url: data.manual_url.trim(),
  purchased_store: data.purchased_store.trim(),
  notes: data.notes?.trim() || null,
});
