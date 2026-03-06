-- Migration: Fix "created_by" error in home_tasks trigger functions
-- This migration redefines the trigger functions that were failing because they referenced 
-- a non-existent "created_by" column in the home_tasks table.

-- Fix for create_calendar_event_for_home_task function
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
      NEW.assigned_user_id, -- Fixed: use assigned_user_id instead of created_by
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

-- Fix for generate_recurring_calendar_events function
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
        home_task_record.assigned_user_id, -- Fixed: use assigned_user_id instead of created_by
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
