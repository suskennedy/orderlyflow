-- Add quiet hours and timezone columns to user_profiles for SMS reminder settings
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
