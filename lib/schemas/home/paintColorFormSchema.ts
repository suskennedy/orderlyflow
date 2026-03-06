import { z } from 'zod';

export const paintColorFormSchema = z.object({
  paint_color_name: z.string().min(1, 'Paint color name is required').max(100, 'Name must be 100 characters or less'),
  room: z.string().min(1, 'Room is required').max(100, 'Room must be 100 characters or less'),
  color_code: z.string().max(100, 'Color code must be 100 characters or less').optional(),
  finish: z.string().max(100, 'Finish must be 100 characters or less').optional(),
  wallpaper: z.boolean().optional().default(false),
  trim_color: z.string().max(100, 'Trim color must be 100 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export type PaintColorFormData = z.infer<typeof paintColorFormSchema>;

export const transformPaintColorFormData = (data: PaintColorFormData) => ({
  paint_color_name: data.paint_color_name.trim(),
  room: data.room.trim(),
  color_code: data.color_code?.trim() || null,
  finish: data.finish?.trim() || null,
  wallpaper: data.wallpaper || false,
  trim_color: data.trim_color?.trim() || null,
  notes: data.notes?.trim() || null,
});
