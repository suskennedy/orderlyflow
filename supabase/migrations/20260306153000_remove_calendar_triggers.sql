-- Migration: Remove calendar triggers from home_tasks
-- The user requested to simplify task management and remove calendar integration for now.
-- This script drops the triggers that were automatically creating/updating calendar events.

-- Drop triggers from home_tasks table
DROP TRIGGER IF EXISTS trigger_create_calendar_event_for_home_task ON public.home_tasks;
DROP TRIGGER IF EXISTS trigger_update_calendar_event_for_home_task ON public.home_tasks;
DROP TRIGGER IF EXISTS trigger_delete_calendar_event_for_home_task ON public.home_tasks;

-- Drop the associated functions to keep the database clean
DROP FUNCTION IF EXISTS public.create_calendar_event_for_home_task();
DROP FUNCTION IF EXISTS public.update_calendar_event_for_home_task();
DROP FUNCTION IF EXISTS public.delete_calendar_event_for_home_task();
DROP FUNCTION IF EXISTS public.generate_recurring_calendar_events(uuid, date, varchar, date);
