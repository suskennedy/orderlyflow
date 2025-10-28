import { Database } from '../supabase-types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Main entity types
export type Home = Tables<'homes'>;
export type Task = Tables<'tasks'>;
export type CalendarEvent = Tables<'calendar_events'>;
export type UserProfile = Tables<'user_profiles'>;
export type Appliance = Tables<'appliances'>;
export type Filter = Tables<'filters'>;
export type LightFixture = Tables<'light_fixtures'>;
export type PaintColor = Tables<'paint_colors'>;
export type Tile = Tables<'tiles'>;
export type Cabinet = Tables<'cabinets'>;
export type InfrastructureLocation = Tables<'infrastructure_locations'>;
export type Vendor = Tables<'vendors'>;

// Insert types
export type HomeInsert = TablesInsert<'homes'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type CalendarEventInsert = TablesInsert<'calendar_events'>;
export type ApplianceInsert = TablesInsert<'appliances'>;
export type FilterInsert = TablesInsert<'filters'>;
export type LightFixtureInsert = TablesInsert<'light_fixtures'>;
export type PaintColorInsert = TablesInsert<'paint_colors'>;
export type TileInsert = TablesInsert<'tiles'>;
export type CabinetInsert = TablesInsert<'cabinets'>;
export type InfrastructureLocationInsert = TablesInsert<'infrastructure_locations'>;
export type VendorInsert = TablesInsert<'vendors'>;

// Update types
export type HomeUpdate = TablesUpdate<'homes'>;
export type TaskUpdate = TablesUpdate<'tasks'>;
export type CalendarEventUpdate = TablesUpdate<'calendar_events'>;
export type ApplianceUpdate = TablesUpdate<'appliances'>;
export type FilterUpdate = TablesUpdate<'filters'>;
export type LightFixtureUpdate = TablesUpdate<'light_fixtures'>;
export type PaintColorUpdate = TablesUpdate<'paint_colors'>;
export type TileUpdate = TablesUpdate<'tiles'>;
export type CabinetUpdate = TablesUpdate<'cabinets'>;
export type InfrastructureLocationUpdate = TablesUpdate<'infrastructure_locations'>;
export type VendorUpdate = TablesUpdate<'vendors'>;

// Enums and constants
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const TaskCategory = {
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  CLEANING: 'cleaning',
  INSPECTION: 'inspection',
  UPGRADE: 'upgrade',
  OTHER: 'other',
} as const;

export const RecurrencePattern = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const; 