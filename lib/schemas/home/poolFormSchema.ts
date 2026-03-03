import { z } from 'zod';

export const POOL_TYPES = ['chlorine', 'salt_water'] as const;
export const INSTALLATION_TYPES = ['in_ground', 'above_ground'] as const;

export const poolFormSchema = z.object({
  type: z.enum(POOL_TYPES),
  installation_type: z.enum(INSTALLATION_TYPES),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type PoolFormData = z.infer<typeof poolFormSchema>;

export const transformPoolFormData = (data: PoolFormData) => ({
  type: data.type,
  installation_type: data.installation_type,
  notes: data.notes?.trim() || null,
});
