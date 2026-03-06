import { z } from 'zod';

export const POOL_TYPES = ['chlorine', 'salt_water'] as const;
export const INSTALLATION_TYPES = ['in_ground', 'above_ground'] as const;

export const poolFormSchema = z.object({
  salt_water_vs_chlorine: z.enum(POOL_TYPES),
  in_ground_vs_above_ground: z.enum(INSTALLATION_TYPES),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

export type PoolFormData = z.infer<typeof poolFormSchema>;

export const transformPoolFormData = (data: PoolFormData) => ({
  salt_water_vs_chlorine: data.salt_water_vs_chlorine,
  in_ground_vs_above_ground: data.in_ground_vs_above_ground,
  notes: data.notes?.trim() || null,
});
