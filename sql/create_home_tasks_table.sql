-- Create home_tasks junction table to separate task templates from home-specific instances
CREATE TABLE IF NOT EXISTS public.home_tasks (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    home_id uuid NOT NULL,
    task_id uuid NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    assigned_vendor_id uuid NULL,
    assigned_user_id uuid NULL,
    due_date date NULL,
    next_due timestamp with time zone NULL,
    notes text NULL,
    status text NULL DEFAULT 'pending',
    completed_at timestamp with time zone NULL,
    completion_notes text NULL,
    completed_by_type text NULL,
    completed_by_vendor_id uuid NULL,
    completed_by_user_id uuid NULL,
    completed_by_external_name text NULL,
    completion_verification_status text NULL DEFAULT 'pending',
    last_completed timestamp with time zone NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    
    CONSTRAINT home_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT home_tasks_home_id_fkey FOREIGN KEY (home_id) REFERENCES homes (id) ON DELETE CASCADE,
    CONSTRAINT home_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT home_tasks_assigned_vendor_id_fkey FOREIGN KEY (assigned_vendor_id) REFERENCES vendors (id) ON DELETE SET NULL,
    CONSTRAINT home_tasks_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES user_profiles (id) ON DELETE SET NULL,
    CONSTRAINT home_tasks_completed_by_vendor_id_fkey FOREIGN KEY (completed_by_vendor_id) REFERENCES vendors (id) ON DELETE SET NULL,
    CONSTRAINT home_tasks_completed_by_user_id_fkey FOREIGN KEY (completed_by_user_id) REFERENCES user_profiles (id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate task assignments per home
    CONSTRAINT home_tasks_unique_home_task UNIQUE (home_id, task_id),
    
    -- Check constraints
    CONSTRAINT home_tasks_completion_verification_status_check CHECK (
        completion_verification_status IN ('pending', 'verified', 'disputed')
    ),
    CONSTRAINT home_tasks_completed_by_type_check CHECK (
        completed_by_type IN ('vendor', 'user', 'external')
    ),
    CONSTRAINT home_tasks_status_check CHECK (
        status IN ('pending', 'in_progress', 'completed', 'cancelled')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_home_tasks_home_id ON public.home_tasks (home_id);
CREATE INDEX IF NOT EXISTS idx_home_tasks_task_id ON public.home_tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_home_tasks_status ON public.home_tasks (status);
CREATE INDEX IF NOT EXISTS idx_home_tasks_is_active ON public.home_tasks (is_active);
CREATE INDEX IF NOT EXISTS idx_home_tasks_due_date ON public.home_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_home_tasks_next_due ON public.home_tasks (next_due);
CREATE INDEX IF NOT EXISTS idx_home_tasks_completed_at ON public.home_tasks (completed_at);

-- Create trigger for updated_at
CREATE TRIGGER update_home_tasks_updated_at 
    BEFORE UPDATE ON home_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update calendar_events table to link to home_tasks instead of tasks directly
-- Add home_task_id column to calendar_events
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS home_task_id uuid,
ADD CONSTRAINT calendar_events_home_task_id_fkey 
    FOREIGN KEY (home_task_id) REFERENCES home_tasks (id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_calendar_events_home_task_id ON public.calendar_events (home_task_id);

-- Clean up existing tasks table to only keep templates
-- Remove home-specific data from tasks table since it will be in home_tasks
UPDATE public.tasks SET 
    home_id = NULL,
    is_active = NULL,
    status = 'template',
    assigned_vendor_id = NULL,
    assigned_user_id = NULL,
    due_date = NULL,
    next_due = NULL,
    completed_at = NULL,
    completion_notes = NULL,
    completed_by_type = NULL,
    completed_by_vendor_id = NULL,
    completed_by_user_id = NULL,
    completed_by_external_name = NULL,
    completion_verification_status = NULL,
    last_completed = NULL
WHERE home_id IS NOT NULL;

-- Remove orphaned calendar events that don't have task_id
DELETE FROM public.calendar_events WHERE task_id IS NULL;

-- Comment: After running this SQL, you'll need to manually populate home_tasks 
-- with the appropriate task assignments for each home based on your business logic
