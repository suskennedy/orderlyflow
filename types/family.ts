// Family Sharing Types
export interface FamilyAccount {
  id: string;
  name: string;
  owner_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_account_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface FamilyInvitation {
  id: string;
  family_account_id: string;
  invited_by: string;
  email: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  invited_by_user?: {
    display_name: string;
    email: string;
  };
  family_account?: {
    name: string;
  };
}

// Update existing interfaces to include family_account_id
export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  family_account_id: string | null;
}

export interface Task {
  id: string;
  user_id: string | null;
  home_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  completion_date: string | null;
  is_recurring: boolean | null;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  family_account_id: string | null;
}

export interface Home {
  id: string;
  user_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  property_type: string | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  mortgage_info: string | null;
  insurance_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  family_account_id: string | null;
}

export interface Vendor {
  id: string;
  user_id: string | null;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  priority: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  family_account_id: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  color: string | null;
  all_day: boolean;
  task_id: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
  family_account_id: string | null;
} 