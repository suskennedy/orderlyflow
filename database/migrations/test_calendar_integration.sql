s-- Complete Calendar Integration Migration for Repairs and Projects
-- This migration adds the necessary columns and triggers for automatic calendar event creation

-- Step 1: Add missing columns to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'task';

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_repair_id ON calendar_events(repair_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task_type ON calendar_events(task_type);

-- Step 3: Create function to automatically create calendar events for repairs
CREATE OR REPLACE FUNCTION create_calendar_event_for_repair()
RETURNS TRIGGER AS $$
DECLARE
  new_event_id UUID;
BEGIN
  -- Only create calendar event if the repair has a due_date and home_id
  IF NEW.due_date IS NOT NULL AND NEW.home_id IS NOT NULL THEN
    INSERT INTO calendar_events (
      title,
      description,
      start_time,
      end_time,
      home_id,
      repair_id,
      task_type,
      user_id,
      family_account_id,
      created_at,
      updated_at
    ) VALUES (
      '🔧 ' || NEW.title,
      COALESCE(NEW.description, 'Repair: ' || NEW.title),
      NEW.due_date::timestamp,
      (NEW.due_date::timestamp + INTERVAL '1 hour'), -- 1 hour duration for repairs
      NEW.home_id,
      NEW.id,
      'repair',
      NEW.created_by,
      NEW.family_account_id,
      NOW(),
      NOW()
    ) RETURNING id INTO new_event_id;
    
    -- Create mapping in home_calendar_events table (only if it doesn't exist)
    INSERT INTO home_calendar_events (event_id, home_id, created_at)
    SELECT new_event_id, NEW.home_id, NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM home_calendar_events 
      WHERE event_id = new_event_id AND home_id = NEW.home_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger for repairs
DROP TRIGGER IF EXISTS trigger_create_calendar_event_for_repair ON repairs;
CREATE TRIGGER trigger_create_calendar_event_for_repair
  AFTER INSERT ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_for_repair();

-- Step 5: Create function to update calendar events for repairs
CREATE OR REPLACE FUNCTION update_calendar_event_for_repair()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing calendar events for this repair
  UPDATE calendar_events 
  SET 
    title = '🔧 ' || NEW.title,
    description = COALESCE(NEW.description, 'Repair: ' || NEW.title),
    start_time = NEW.due_date::timestamp,
    end_time = (NEW.due_date::timestamp + INTERVAL '1 hour'),
    updated_at = NOW()
  WHERE repair_id = NEW.id;
  
  -- If repair is completed or cancelled, update the calendar event
  IF NEW.status IN ('completed', 'cancelled') THEN
    UPDATE calendar_events 
    SET 
      title = '✅ ' || NEW.title,
      description = COALESCE(NEW.description, 'Repair: ' || NEW.title) || ' - ' || NEW.status,
      updated_at = NOW()
    WHERE repair_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to update calendar events for repairs
DROP TRIGGER IF EXISTS trigger_update_calendar_event_for_repair ON repairs;
CREATE TRIGGER trigger_update_calendar_event_for_repair
  AFTER UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_for_repair();

-- Step 7: Create function to delete calendar events for repairs
CREATE OR REPLACE FUNCTION delete_calendar_event_for_repair()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all calendar events associated with this repair
  -- First delete the mapping entries, then the calendar events
  DELETE FROM home_calendar_events 
  WHERE event_id IN (SELECT id FROM calendar_events WHERE repair_id = OLD.id);
  
  DELETE FROM calendar_events WHERE repair_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to delete calendar events for repairs
DROP TRIGGER IF EXISTS trigger_delete_calendar_event_for_repair ON repairs;
CREATE TRIGGER trigger_delete_calendar_event_for_repair
  AFTER DELETE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION delete_calendar_event_for_repair();

-- Step 9: Create function to automatically create calendar events for projects
CREATE OR REPLACE FUNCTION create_calendar_event_for_project()
RETURNS TRIGGER AS $$
DECLARE
  new_event_id UUID;
BEGIN
  -- Only create calendar event if the project has a start_date and home_id
  IF NEW.start_date IS NOT NULL AND NEW.home_id IS NOT NULL THEN
    INSERT INTO calendar_events (
      title,
      description,
      start_time,
      end_time,
      home_id,
      project_id,
      task_type,
      user_id,
      family_account_id,
      created_at,
      updated_at
    ) VALUES (
      '🏗️ ' || NEW.title,
      COALESCE(NEW.description, 'Project: ' || NEW.title),
      NEW.start_date::timestamp,
      COALESCE(NEW.end_date::timestamp, (NEW.start_date::timestamp + INTERVAL '8 hours')), -- 8 hour duration for projects
      NEW.home_id,
      NEW.id,
      'project',
      NEW.created_by,
      NEW.family_account_id,
      NOW(),
      NOW()
    ) RETURNING id INTO new_event_id;
    
    -- Create mapping in home_calendar_events table (only if it doesn't exist)
    INSERT INTO home_calendar_events (event_id, home_id, created_at)
    SELECT new_event_id, NEW.home_id, NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM home_calendar_events 
      WHERE event_id = new_event_id AND home_id = NEW.home_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger for projects
DROP TRIGGER IF EXISTS trigger_create_calendar_event_for_project ON projects;
CREATE TRIGGER trigger_create_calendar_event_for_project
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_for_project();

-- Step 11: Create function to update calendar events for projects
CREATE OR REPLACE FUNCTION update_calendar_event_for_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing calendar events for this project
  UPDATE calendar_events 
  SET 
    title = '🏗️ ' || NEW.title,
    description = COALESCE(NEW.description, 'Project: ' || NEW.title),
    start_time = NEW.start_date::timestamp,
    end_time = COALESCE(NEW.end_date::timestamp, (NEW.start_date::timestamp + INTERVAL '8 hours')),
    updated_at = NOW()
  WHERE project_id = NEW.id;
  
  -- If project is completed or on hold, update the calendar event
  IF NEW.status IN ('completed', 'on_hold') THEN
    UPDATE calendar_events 
    SET 
      title = CASE 
        WHEN NEW.status = 'completed' THEN '✅ ' || NEW.title
        WHEN NEW.status = 'on_hold' THEN '⏸️ ' || NEW.title
        ELSE '🏗️ ' || NEW.title
      END,
      description = COALESCE(NEW.description, 'Project: ' || NEW.title) || ' - ' || NEW.status,
      updated_at = NOW()
    WHERE project_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to update calendar events for projects
DROP TRIGGER IF EXISTS trigger_update_calendar_event_for_project ON projects;
CREATE TRIGGER trigger_update_calendar_event_for_project
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_for_project();

-- Step 13: Create function to delete calendar events for projects
CREATE OR REPLACE FUNCTION delete_calendar_event_for_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all calendar events associated with this project
  -- First delete the mapping entries, then the calendar events
  DELETE FROM home_calendar_events 
  WHERE event_id IN (SELECT id FROM calendar_events WHERE project_id = OLD.id);
  
  DELETE FROM calendar_events WHERE project_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create trigger to delete calendar events for projects
DROP TRIGGER IF EXISTS trigger_delete_calendar_event_for_project ON projects;
CREATE TRIGGER trigger_delete_calendar_event_for_project
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION delete_calendar_event_for_project();

-- Step 15: Grant permissions for new functions
GRANT EXECUTE ON FUNCTION create_calendar_event_for_repair TO authenticated;
GRANT EXECUTE ON FUNCTION update_calendar_event_for_repair TO authenticated;
GRANT EXECUTE ON FUNCTION delete_calendar_event_for_repair TO authenticated;
GRANT EXECUTE ON FUNCTION create_calendar_event_for_project TO authenticated;
GRANT EXECUTE ON FUNCTION update_calendar_event_for_project TO authenticated;
GRANT EXECUTE ON FUNCTION delete_calendar_event_for_project TO authenticated;

-- Step 16: Add comments for documentation
COMMENT ON COLUMN calendar_events.repair_id IS 'References the repair that created this calendar event';
COMMENT ON COLUMN calendar_events.project_id IS 'References the project that created this calendar event';
COMMENT ON COLUMN calendar_events.task_type IS 'Type of event: task, repair, or project';
COMMENT ON FUNCTION create_calendar_event_for_repair() IS 'Automatically creates calendar events when repairs are created';
COMMENT ON FUNCTION create_calendar_event_for_project() IS 'Automatically creates calendar events when projects are created';

-- Step 17: Fix for duplicate key constraint violations
-- The triggers now use WHERE NOT EXISTS to prevent duplicate entries in home_calendar_events
-- This prevents the "duplicate key value violates unique constraint" error
