-- Add recurring fields to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_pattern TEXT,
ADD COLUMN recurrence_end_date TIMESTAMPTZ;

-- Create index for better performance on recurring queries
CREATE INDEX idx_calendar_events_is_recurring ON calendar_events(is_recurring);
CREATE INDEX idx_calendar_events_recurrence_pattern ON calendar_events(recurrence_pattern);

-- Update existing calendar events to set is_recurring based on task relationship
UPDATE calendar_events 
SET is_recurring = tasks.is_recurring,
    recurrence_pattern = tasks.recurrence_pattern,
    recurrence_end_date = tasks.recurrence_end_date
FROM tasks 
WHERE calendar_events.task_id = tasks.id 
  AND tasks.is_recurring = true; 