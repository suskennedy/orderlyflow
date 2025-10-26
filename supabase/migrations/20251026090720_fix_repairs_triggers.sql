-- Migration: Fix database triggers for repairs table
-- This migration ensures that any triggers on the repairs table don't reference non-existent fields

-- First, let's check if there are any existing triggers on the repairs table
-- and drop them if they reference due_date

-- Drop any existing triggers that might reference due_date
DROP TRIGGER IF EXISTS create_repair_calendar_event_trigger ON repairs;
DROP TRIGGER IF EXISTS repair_calendar_trigger ON repairs;
DROP TRIGGER IF EXISTS repairs_calendar_trigger ON repairs;

-- Drop any functions that might reference due_date for repairs
DROP FUNCTION IF EXISTS create_repair_calendar_event();
DROP FUNCTION IF EXISTS repair_calendar_function();
DROP FUNCTION IF EXISTS repairs_calendar_function();

-- Create a new trigger function that only uses valid fields
CREATE OR REPLACE FUNCTION create_repair_calendar_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create calendar event if reminder_date is provided
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

-- Create the trigger using the corrected function
CREATE TRIGGER create_repair_calendar_event_trigger
  AFTER INSERT OR UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION create_repair_calendar_event();

-- Add comment to document the trigger
COMMENT ON FUNCTION create_repair_calendar_event() IS 'Creates calendar events for repairs when reminder_date is set and schedule_reminder is true';
COMMENT ON TRIGGER create_repair_calendar_event_trigger ON repairs IS 'Automatically creates calendar events for repairs with reminders';