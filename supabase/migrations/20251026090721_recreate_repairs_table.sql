-- Migration: Drop and recreate repairs table with clean triggers
-- This migration completely recreates the repairs table to fix the due_date error

-- Step 1: Drop existing triggers and functions first
DROP TRIGGER IF EXISTS create_repair_calendar_event_trigger ON repairs;
DROP TRIGGER IF EXISTS repair_calendar_trigger ON repairs;
DROP TRIGGER IF EXISTS repairs_calendar_trigger ON repairs;
DROP TRIGGER IF EXISTS repairs_trigger ON repairs;

-- Step 2: Drop existing functions
DROP FUNCTION IF EXISTS create_repair_calendar_event();
DROP FUNCTION IF EXISTS repair_calendar_function();
DROP FUNCTION IF EXISTS repairs_calendar_function();
DROP FUNCTION IF EXISTS repairs_function();

-- Step 3: Drop the repairs table (this will also drop all constraints)
DROP TABLE IF EXISTS repairs CASCADE;

-- Step 4: Recreate the repairs table with the exact schema
CREATE TABLE public.repairs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  home_id uuid NULL,
  title character varying(255) NOT NULL,
  description text NULL,
  status character varying(20) NULL DEFAULT 'pending'::character varying,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  created_by uuid NULL,
  family_account_id uuid NULL,
  vendor_id uuid NULL,
  user_id uuid NULL,
  date_reported date NULL DEFAULT CURRENT_DATE,
  description_issue text NULL,
  photos_videos text[] NULL,
  location_in_home character varying(255) NULL,
  cost_estimate numeric(10, 2) NULL,
  final_cost numeric(10, 2) NULL,
  schedule_reminder boolean NULL DEFAULT false,
  reminder_date date NULL,
  notes text NULL,
  CONSTRAINT repairs_pkey PRIMARY KEY (id),
  CONSTRAINT repairs_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profiles (id),
  CONSTRAINT repairs_family_account_id_fkey FOREIGN KEY (family_account_id) REFERENCES family_accounts (id),
  CONSTRAINT repairs_home_id_fkey FOREIGN KEY (home_id) REFERENCES homes (id) ON DELETE CASCADE,
  CONSTRAINT repairs_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles (id),
  CONSTRAINT repairs_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors (id)
) TABLESPACE pg_default;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repairs_home_id ON repairs(home_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_created_at ON repairs(created_at);
CREATE INDEX IF NOT EXISTS idx_repairs_vendor_id ON repairs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_repairs_user_id ON repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_repairs_reminder_date ON repairs(reminder_date) WHERE reminder_date IS NOT NULL;

-- Step 6: Create the corrected trigger function
CREATE OR REPLACE FUNCTION create_repair_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create calendar event if reminder_date is provided and schedule_reminder is true
  IF NEW.reminder_date IS NOT NULL AND NEW.schedule_reminder = true THEN
    INSERT INTO calendar_events (
      title,
      start_time,
      end_time,
      repair_id,
      home_id,
      family_account_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.title,
      NEW.reminder_date::timestamp,
      (NEW.reminder_date + INTERVAL '1 hour')::timestamp,
      NEW.id,
      NEW.home_id,
      NEW.family_account_id,
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create the trigger
CREATE TRIGGER create_repair_calendar_event_trigger
  AFTER INSERT OR UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION create_repair_calendar_event();

-- Step 8: Add comments for documentation
COMMENT ON TABLE repairs IS 'Repairs table for home maintenance and repair tracking';
COMMENT ON COLUMN repairs.description IS 'General description of the repair';
COMMENT ON COLUMN repairs.description_issue IS 'Specific description of the issue';
COMMENT ON COLUMN repairs.reminder_date IS 'Date for reminder notification';
COMMENT ON COLUMN repairs.schedule_reminder IS 'Whether to schedule a reminder';
COMMENT ON FUNCTION create_repair_calendar_event() IS 'Creates calendar events for repairs when reminder_date is set and schedule_reminder is true';
COMMENT ON TRIGGER create_repair_calendar_event_trigger ON repairs IS 'Automatically creates calendar events for repairs with reminders';

-- Step 9: Enable Row Level Security (if needed)
-- ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies (if needed)
-- CREATE POLICY "Users can view repairs for their family" ON repairs
--   FOR SELECT USING (family_account_id IN (
--     SELECT family_account_id FROM family_members WHERE user_id = auth.uid()
--   ));

-- CREATE POLICY "Users can insert repairs for their family" ON repairs
--   FOR INSERT WITH CHECK (family_account_id IN (
--     SELECT family_account_id FROM family_members WHERE user_id = auth.uid()
--   ));

-- CREATE POLICY "Users can update repairs for their family" ON repairs
--   FOR UPDATE USING (family_account_id IN (
--     SELECT family_account_id FROM family_members WHERE user_id = auth.uid()
--   ));

-- CREATE POLICY "Users can delete repairs for their family" ON repairs
--   FOR DELETE USING (family_account_id IN (
--     SELECT family_account_id FROM family_members WHERE user_id = auth.uid()
--   ));

