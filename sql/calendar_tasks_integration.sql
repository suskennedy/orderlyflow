-- Calendar Tasks Integration Schema Updates
-- This file adds the necessary fields and indexes to integrate tasks with calendar events

-- Step 1: Add missing columns to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS home_id UUID REFERENCES homes(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS home_task_id UUID REFERENCES home_tasks(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'task';

-- Step 2: Create performance indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_home_id ON calendar_events(home_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_home_task_id ON calendar_events(home_task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task_id ON calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- Create composite index for home-specific event queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_home_user ON calendar_events(home_id, user_id);

-- Create index for recurring events
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring, recurrence_pattern);

-- Step 3: Add comments for documentation
COMMENT ON COLUMN calendar_events.home_id IS 'References the home that this calendar event belongs to';
COMMENT ON COLUMN calendar_events.home_task_id IS 'References the specific home task instance that created this calendar event';
COMMENT ON COLUMN calendar_events.task_type IS 'Type of task: task (from template) or custom (user-created)';

-- Step 4: Create function to automatically create calendar events when home tasks are created
CREATE OR REPLACE FUNCTION create_calendar_event_for_home_task()
RETURNS TRIGGER AS $$
DECLARE
  new_event_id UUID;
BEGIN
  -- Only create calendar event if the task has a due date and is active
  IF NEW.due_date IS NOT NULL AND NEW.is_active = true THEN
    INSERT INTO calendar_events (
      title,
      description,
      start_time,
      end_time,
      home_id,
      task_id,
      home_task_id,
      task_type,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.title,
      NEW.description,
      NEW.due_date,
      NEW.due_date, -- Same day event
      NEW.home_id,
      NEW.task_id,
      NEW.id,
      CASE WHEN NEW.task_id IS NULL THEN 'custom' ELSE 'task' END,
      NEW.is_recurring,
      NEW.recurrence_pattern,
      NEW.recurrence_end_date,
      NEW.created_by,
      NOW(),
      NOW()
    ) RETURNING id INTO new_event_id;
    
    -- Create mapping in home_calendar_events table
    INSERT INTO home_calendar_events (event_id, home_id, created_at)
    VALUES (new_event_id, NEW.home_id, NOW());
    
    -- If it's a recurring task, generate recurring calendar events
    IF NEW.is_recurring = true AND NEW.recurrence_pattern IS NOT NULL THEN
      PERFORM generate_recurring_calendar_events(
        NEW.id,
        NEW.due_date::DATE,
        NEW.recurrence_pattern,
        NEW.recurrence_end_date::DATE
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically create calendar events
DROP TRIGGER IF EXISTS trigger_create_calendar_event_for_home_task ON home_tasks;
CREATE TRIGGER trigger_create_calendar_event_for_home_task
  AFTER INSERT ON home_tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_for_home_task();

-- Step 6: Create function to update calendar events when home tasks are updated
CREATE OR REPLACE FUNCTION update_calendar_event_for_home_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Update existing calendar events for this home task
  UPDATE calendar_events 
  SET 
    title = NEW.title,
    description = NEW.description,
    start_time = NEW.due_date,
    end_time = NEW.due_date,
    is_recurring = NEW.is_recurring,
    recurrence_pattern = NEW.recurrence_pattern,
    recurrence_end_date = NEW.recurrence_end_date,
    updated_at = NOW()
  WHERE home_task_id = NEW.id;
  
  -- If task is deactivated, delete all associated calendar events and mappings
  IF NEW.is_active = false THEN
    -- First delete the mapping entries, then the calendar events
    DELETE FROM home_calendar_events 
    WHERE event_id IN (SELECT id FROM calendar_events WHERE home_task_id = NEW.id);
    
    DELETE FROM calendar_events WHERE home_task_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to update calendar events
DROP TRIGGER IF EXISTS trigger_update_calendar_event_for_home_task ON home_tasks;
CREATE TRIGGER trigger_update_calendar_event_for_home_task
  AFTER UPDATE ON home_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_for_home_task();

-- Step 8: Create function to delete calendar events when home tasks are deleted
CREATE OR REPLACE FUNCTION delete_calendar_event_for_home_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all calendar events associated with this home task
  -- First delete the mapping entries, then the calendar events
  DELETE FROM home_calendar_events 
  WHERE event_id IN (SELECT id FROM calendar_events WHERE home_task_id = OLD.id);
  
  DELETE FROM calendar_events WHERE home_task_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to delete calendar events
DROP TRIGGER IF EXISTS trigger_delete_calendar_event_for_home_task ON home_tasks;
CREATE TRIGGER trigger_delete_calendar_event_for_home_task
  AFTER DELETE ON home_tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_calendar_event_for_home_task();

-- Step 10: Create function to generate recurring calendar events
CREATE OR REPLACE FUNCTION generate_recurring_calendar_events(
  p_home_task_id UUID,
  p_start_date DATE,
  p_recurrence_pattern VARCHAR(50),
  p_recurrence_end_date DATE DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_occurrence_date DATE := p_start_date;
  end_date DATE;
  interval_days INTEGER;
  home_task_record RECORD;
  new_event_id UUID;
BEGIN
  -- Get the home task details
  SELECT * INTO home_task_record FROM home_tasks WHERE id = p_home_task_id;
  
  -- Set end date (default to 1 year from start if not specified)
  end_date := COALESCE(p_recurrence_end_date, p_start_date + INTERVAL '1 year');
  
  -- Determine interval based on pattern
  CASE p_recurrence_pattern
    WHEN 'daily' THEN interval_days := 1;
    WHEN 'weekly' THEN interval_days := 7;
    WHEN 'monthly' THEN interval_days := 30;
    WHEN 'quarterly' THEN interval_days := 90;
    WHEN 'yearly' THEN interval_days := 365;
    ELSE interval_days := 7; -- Default to weekly
  END CASE;
  
  -- Generate recurring events (limit to 100 occurrences to prevent infinite loops)
  WHILE current_occurrence_date <= end_date AND (current_occurrence_date - p_start_date) < INTERVAL '1000 days' LOOP
    -- Skip the first occurrence as it's already created by the main trigger
    IF current_occurrence_date > p_start_date THEN
      INSERT INTO calendar_events (
        title,
        description,
        start_time,
        end_time,
        home_id,
        task_id,
        home_task_id,
        task_type,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date,
        user_id,
        created_at,
        updated_at
      ) VALUES (
        home_task_record.title,
        home_task_record.description,
        current_occurrence_date::timestamp,
        current_occurrence_date::timestamp,
        home_task_record.home_id,
        home_task_record.task_id,
        home_task_record.id,
        CASE WHEN home_task_record.task_id IS NULL THEN 'custom' ELSE 'task' END,
        true,
        p_recurrence_pattern,
        p_recurrence_end_date,
        home_task_record.created_by,
        NOW(),
        NOW()
      ) RETURNING id INTO new_event_id;
      
      -- Create mapping in home_calendar_events table for recurring events
      INSERT INTO home_calendar_events (event_id, home_id, created_at)
      VALUES (new_event_id, home_task_record.home_id, NOW());
    END IF;
    
    -- Move to next occurrence
    current_occurrence_date := current_occurrence_date + (interval_days || ' days')::interval;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create view for home-specific calendar events with task details
CREATE OR REPLACE VIEW home_calendar_events_with_tasks AS
SELECT 
  ce.id,
  ce.title,
  ce.description,
  ce.start_time,
  ce.end_time,
  ce.home_id,
  ce.task_id,
  ce.home_task_id,
  ce.task_type,
  ce.is_recurring,
  ce.recurrence_pattern,
  ce.recurrence_end_date,
  ce.user_id,
  ce.created_at,
  ce.updated_at,
  ht.title as task_title,
  ht.description as task_description,
  ht.category,
  ht.subcategory,
  ht.priority,
  ht.status,
  ht.is_active,
  h.name as home_name
FROM calendar_events ce
LEFT JOIN home_tasks ht ON ce.home_task_id = ht.id
LEFT JOIN homes h ON ce.home_id = h.id
WHERE ce.home_id IS NOT NULL;

-- Step 12: Grant necessary permissions
GRANT SELECT ON home_calendar_events_with_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION generate_recurring_calendar_events TO authenticated;

-- Step 13: Create a function to clean up orphaned calendar events
CREATE OR REPLACE FUNCTION cleanup_orphaned_calendar_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete calendar events that reference non-existent home tasks
  DELETE FROM calendar_events 
  WHERE home_task_id IS NOT NULL 
  AND home_task_id NOT IN (SELECT id FROM home_tasks);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Grant permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_orphaned_calendar_events TO authenticated;

-- Step 15: Create function to handle manual calendar event creation with mapping
CREATE OR REPLACE FUNCTION create_calendar_event_with_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- If the calendar event has a home_id, create the mapping
  IF NEW.home_id IS NOT NULL THEN
    INSERT INTO home_calendar_events (event_id, home_id, created_at)
    VALUES (NEW.id, NEW.home_id, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Create trigger for manual calendar event creation
DROP TRIGGER IF EXISTS trigger_create_calendar_event_with_mapping ON calendar_events;
CREATE TRIGGER trigger_create_calendar_event_with_mapping
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_event_with_mapping();

-- Step 17: Create function to handle calendar event updates with mapping
CREATE OR REPLACE FUNCTION update_calendar_event_with_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- If home_id changed, update the mapping
  IF OLD.home_id IS DISTINCT FROM NEW.home_id THEN
    -- Remove old mapping if it exists
    IF OLD.home_id IS NOT NULL THEN
      DELETE FROM home_calendar_events 
      WHERE event_id = NEW.id AND home_id = OLD.home_id;
    END IF;
    
    -- Add new mapping if home_id is provided
    IF NEW.home_id IS NOT NULL THEN
      INSERT INTO home_calendar_events (event_id, home_id, created_at)
      VALUES (NEW.id, NEW.home_id, NOW());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 18: Create trigger for calendar event updates
DROP TRIGGER IF EXISTS trigger_update_calendar_event_with_mapping ON calendar_events;
CREATE TRIGGER trigger_update_calendar_event_with_mapping
  AFTER UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_with_mapping();

-- Step 19: Create function to handle calendar event deletion with mapping cleanup
CREATE OR REPLACE FUNCTION delete_calendar_event_with_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove all mappings for this event
  DELETE FROM home_calendar_events WHERE event_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 20: Create trigger for calendar event deletion
DROP TRIGGER IF EXISTS trigger_delete_calendar_event_with_mapping ON calendar_events;
CREATE TRIGGER trigger_delete_calendar_event_with_mapping
  AFTER DELETE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION delete_calendar_event_with_mapping();

-- Step 21: Grant permissions for new functions
GRANT EXECUTE ON FUNCTION create_calendar_event_with_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION update_calendar_event_with_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION delete_calendar_event_with_mapping TO authenticated;
