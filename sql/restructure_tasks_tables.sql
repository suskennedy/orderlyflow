-- =============================================================================
-- RESTRUCTURE TASKS AND HOME_TASKS TABLES
-- =============================================================================
-- This script restructures the database to separate template tasks from 
-- active home-specific tasks as requested:
-- 
-- TASKS TABLE: Template tasks only (id, title, description, category, subcategory)
-- HOME_TASKS TABLE: Active tasks with all home-specific fields
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: BACKUP EXISTING DATA (Optional - for safety)
-- =============================================================================
-- Create backup tables before making changes
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM public.tasks;
CREATE TABLE IF NOT EXISTS home_tasks_backup AS SELECT * FROM public.home_tasks;

-- =============================================================================
-- STEP 2: CLEAR EXISTING DATA
-- =============================================================================
-- Clear all existing data from both tables
TRUNCATE TABLE public.home_tasks CASCADE;
TRUNCATE TABLE public.tasks CASCADE;

-- =============================================================================
-- STEP 3: DROP RLS POLICIES AND RESTRUCTURE TASKS TABLE (TEMPLATES ONLY)
-- =============================================================================

-- First, drop all RLS policies on tasks table since templates don't need family-level security
-- (templates are global and accessible to all users)
DROP POLICY IF EXISTS "Users can view tasks in their family account" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their family account" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their family account" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their family account" ON public.tasks;

-- Disable RLS on tasks table since templates are global
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Now drop all columns except the template fields (using CASCADE to handle any remaining dependencies)
ALTER TABLE public.tasks 
  DROP COLUMN IF EXISTS assigned_user_id CASCADE,
  DROP COLUMN IF EXISTS assigned_vendor_id CASCADE,
  DROP COLUMN IF EXISTS completed_at CASCADE,
  DROP COLUMN IF EXISTS completed_by_external_name CASCADE,
  DROP COLUMN IF EXISTS completed_by_type CASCADE,
  DROP COLUMN IF EXISTS completed_by_user_id CASCADE,
  DROP COLUMN IF EXISTS completed_by_vendor_id CASCADE,
  DROP COLUMN IF EXISTS completion_date CASCADE,
  DROP COLUMN IF EXISTS completion_notes CASCADE,
  DROP COLUMN IF EXISTS completion_verification_notes CASCADE,
  DROP COLUMN IF EXISTS completion_verification_status CASCADE,
  DROP COLUMN IF EXISTS created_by CASCADE,
  DROP COLUMN IF EXISTS custom_frequency CASCADE,
  DROP COLUMN IF EXISTS due_date CASCADE,
  DROP COLUMN IF EXISTS equipment_required CASCADE,
  DROP COLUMN IF EXISTS estimated_cost CASCADE,
  DROP COLUMN IF EXISTS estimated_duration_minutes CASCADE,
  DROP COLUMN IF EXISTS family_account_id CASCADE,
  DROP COLUMN IF EXISTS frequency_type CASCADE,
  DROP COLUMN IF EXISTS image_url CASCADE,
  DROP COLUMN IF EXISTS instructions CASCADE,
  DROP COLUMN IF EXISTS is_active CASCADE,
  DROP COLUMN IF EXISTS is_recurring CASCADE,
  DROP COLUMN IF EXISTS is_recurring_task CASCADE,
  DROP COLUMN IF EXISTS last_completed CASCADE,
  DROP COLUMN IF EXISTS last_modified_by CASCADE,
  DROP COLUMN IF EXISTS next_due CASCADE,
  DROP COLUMN IF EXISTS notes CASCADE,
  DROP COLUMN IF EXISTS priority CASCADE,
  DROP COLUMN IF EXISTS priority_level CASCADE,
  DROP COLUMN IF EXISTS recurrence_end_date CASCADE,
  DROP COLUMN IF EXISTS recurrence_interval CASCADE,
  DROP COLUMN IF EXISTS recurrence_pattern CASCADE,
  DROP COLUMN IF EXISTS recurrence_unit CASCADE,
  DROP COLUMN IF EXISTS room_location CASCADE,
  DROP COLUMN IF EXISTS safety_notes CASCADE,
  DROP COLUMN IF EXISTS status CASCADE,
  DROP COLUMN IF EXISTS suggested_frequency CASCADE,
  DROP COLUMN IF EXISTS task_type CASCADE,
  DROP COLUMN IF EXISTS updated_at CASCADE,
  DROP COLUMN IF EXISTS vendor_notes CASCADE;

-- Ensure the remaining columns are properly configured
ALTER TABLE public.tasks 
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- =============================================================================
-- STEP 4: RESTRUCTURE HOME_TASKS TABLE (ACTIVE TASKS)
-- =============================================================================
-- Add missing columns to home_tasks that were in tasks
ALTER TABLE public.home_tasks 
  ADD COLUMN IF NOT EXISTS custom_frequency text,
  ADD COLUMN IF NOT EXISTS frequency_type text,
  ADD COLUMN IF NOT EXISTS is_recurring_task boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority_level text,
  ADD COLUMN IF NOT EXISTS suggested_frequency text,
  ADD COLUMN IF NOT EXISTS vendor_notes text;

-- Ensure proper constraints and defaults
ALTER TABLE public.home_tasks 
  ALTER COLUMN home_id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN is_active SET DEFAULT true;

-- =============================================================================
-- STEP 4.5: SET UP RLS POLICIES FOR HOME_TASKS TABLE
-- =============================================================================
-- Enable RLS on home_tasks table since these are family-specific
ALTER TABLE public.home_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view home tasks in their family account" ON public.home_tasks;
DROP POLICY IF EXISTS "Users can insert home tasks in their family account" ON public.home_tasks;
DROP POLICY IF EXISTS "Users can update home tasks in their family account" ON public.home_tasks;
DROP POLICY IF EXISTS "Users can delete home tasks in their family account" ON public.home_tasks;

-- Create new RLS policies for home_tasks table
-- Users can view home tasks for homes in their family account
CREATE POLICY "Users can view home tasks in their family account" ON public.home_tasks
  FOR SELECT USING (
    home_id IN (
      SELECT h.id FROM public.homes h
      JOIN public.family_members fm ON h.family_account_id = fm.family_account_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Users can insert home tasks for homes in their family account
CREATE POLICY "Users can insert home tasks in their family account" ON public.home_tasks
  FOR INSERT WITH CHECK (
    home_id IN (
      SELECT h.id FROM public.homes h
      JOIN public.family_members fm ON h.family_account_id = fm.family_account_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Users can update home tasks for homes in their family account
CREATE POLICY "Users can update home tasks in their family account" ON public.home_tasks
  FOR UPDATE USING (
    home_id IN (
      SELECT h.id FROM public.homes h
      JOIN public.family_members fm ON h.family_account_id = fm.family_account_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Users can delete home tasks for homes in their family account
CREATE POLICY "Users can delete home tasks in their family account" ON public.home_tasks
  FOR DELETE USING (
    home_id IN (
      SELECT h.id FROM public.homes h
      JOIN public.family_members fm ON h.family_account_id = fm.family_account_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- STEP 6: SEED TEMPLATE TASKS
-- =============================================================================
-- Insert template tasks (these are the base templates that users can activate for their homes)

-- Home Maintenance Templates
INSERT INTO public.tasks (title, description, category, subcategory) VALUES
('Filters', 'Replace or clean air filters, water filters, etc.', 'Home Maintenance', 'HVAC'),
('Light Bulbs', 'Check and replace light bulbs as needed', 'Home Maintenance', 'Electrical'),
('Irrigation (spring start-up / fall winterize)', 'Prepare irrigation system for season changes', 'Home Maintenance', 'Landscaping'),
('Window Cleaning', 'Clean interior and exterior windows', 'Home Maintenance', 'Cleaning'),
('Furniture Cleaning', 'Deep clean upholstered furniture', 'Home Maintenance', 'Cleaning'),
('Rug Cleaning', 'Professional or deep clean area rugs', 'Home Maintenance', 'Cleaning'),
('Exterior Home Wash', 'Wash exterior walls, siding, and surfaces', 'Home Maintenance', 'Exterior'),
('Painting Touch-ups', 'Touch up paint and address minor paint issues', 'Home Maintenance', 'Painting'),
('Gutters', 'Clean and inspect gutters and downspouts', 'Home Maintenance', 'Exterior'),
('Chimney / Fireplace Service', 'Annual chimney cleaning and inspection', 'Home Maintenance', 'Fireplace'),
('Deck/Patio Reseal', 'Reseal deck or patio surfaces', 'Home Maintenance', 'Exterior'),
('Tree & Shrub Trimming', 'Trim trees and shrubs for health and appearance', 'Home Maintenance', 'Landscaping'),
('Grass Cutting', 'Regular lawn mowing and maintenance', 'Home Maintenance', 'Landscaping'),
('HVAC Service', 'Professional HVAC system maintenance', 'Home Maintenance', 'HVAC'),
('Sump Pump Check', 'Test and maintain sump pump system', 'Home Maintenance', 'Plumbing'),
('Security Systems & Cameras', 'Test and clean security equipment', 'Home Maintenance', 'Security');

-- Health + Safety Templates
INSERT INTO public.tasks (title, description, category, subcategory) VALUES
('Smoke / CO2 Detectors', 'Test and replace batteries in smoke and CO2 detectors', 'Health + Safety', 'Safety Equipment'),
('Fire Extinguisher Inspection', 'Annual fire extinguisher inspection and maintenance', 'Health + Safety', 'Safety Equipment'),
('Emergency Kit Review', 'Review and update emergency preparedness kit', 'Health + Safety', 'Emergency Preparedness'),
('Medication Clean Out', 'Dispose of expired medications safely', 'Health + Safety', 'Health');

-- Deep Cleaning Templates
INSERT INTO public.tasks (title, description, category, subcategory) VALUES
('Fridge Deep Clean', 'Deep clean refrigerator interior and exterior', 'Deep Cleaning', 'Kitchen'),
('Dryer Vents Clean', 'Clean dryer vents and lint traps', 'Deep Cleaning', 'Laundry'),
('Trash Cans Clean', 'Deep clean and sanitize trash cans', 'Deep Cleaning', 'Sanitization'),
('Sheets Refresh', 'Wash and refresh bed linens', 'Deep Cleaning', 'Bedroom'),
('Baseboards and Door Frames Clean', 'Clean baseboards and door frames', 'Deep Cleaning', 'General'),
('Light Fixtures + Ceiling Fans Clean', 'Clean light fixtures and ceiling fans', 'Deep Cleaning', 'General'),
('Vents + Air Returns Clean', 'Clean air vents and return registers', 'Deep Cleaning', 'HVAC'),
('Shower Heads Descale', 'Descale and clean shower heads', 'Deep Cleaning', 'Bathroom'),
('Garbage Disposal Clean', 'Deep clean garbage disposal unit', 'Deep Cleaning', 'Kitchen'),
('Washer + Dryer Deep Clean', 'Deep clean washing machine and dryer', 'Deep Cleaning', 'Laundry'),
('Grout Clean', 'Clean and restore grout lines', 'Deep Cleaning', 'Bathroom'),
('Garage Clean-out', 'Organize and clean garage space', 'Deep Cleaning', 'Garage');

-- Repairs Templates
INSERT INTO public.tasks (title, description, category, subcategory) VALUES
('Repairs (Assessment)', 'Assess and document repair needs', 'Repairs', 'Assessment'),
('Repair - Photo + Cost + Notes', 'Document repair with photos, costs, and notes', 'Repairs', 'Documentation');

-- =============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
-- Indexes for tasks table (templates)
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks (category);
CREATE INDEX IF NOT EXISTS idx_tasks_subcategory ON public.tasks (subcategory);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON public.tasks (title);

-- Indexes for home_tasks table (active tasks)
CREATE INDEX IF NOT EXISTS idx_home_tasks_home_id ON public.home_tasks (home_id);
CREATE INDEX IF NOT EXISTS idx_home_tasks_task_id ON public.home_tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_home_tasks_status ON public.home_tasks (status);
CREATE INDEX IF NOT EXISTS idx_home_tasks_is_active ON public.home_tasks (is_active);
CREATE INDEX IF NOT EXISTS idx_home_tasks_due_date ON public.home_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_home_tasks_category ON public.home_tasks (category);

-- =============================================================================
-- STEP 8: ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================
COMMENT ON TABLE public.tasks IS 'Template tasks that serve as blueprints for home-specific tasks. Contains only basic task information.';
COMMENT ON TABLE public.home_tasks IS 'Active tasks assigned to specific homes. Contains all task execution details and status information.';

COMMENT ON COLUMN public.tasks.id IS 'Unique identifier for template task';
COMMENT ON COLUMN public.tasks.title IS 'Template task title';
COMMENT ON COLUMN public.tasks.description IS 'Template task description';
COMMENT ON COLUMN public.tasks.category IS 'Template task category';
COMMENT ON COLUMN public.tasks.subcategory IS 'Template task subcategory';
COMMENT ON COLUMN public.tasks.created_at IS 'When this template was created';

COMMENT ON COLUMN public.home_tasks.home_id IS 'Home this task is assigned to';
COMMENT ON COLUMN public.home_tasks.task_id IS 'Reference to template task (from tasks table)';
COMMENT ON COLUMN public.home_tasks.title IS 'Task title (copied from template or customized)';
COMMENT ON COLUMN public.home_tasks.status IS 'Current task status (pending, in_progress, completed, etc.)';
COMMENT ON COLUMN public.home_tasks.is_active IS 'Whether this task is currently active for the home';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these queries to verify the restructuring worked correctly:

-- Check tasks table structure (should only have template fields)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Check home_tasks table structure (should have all active task fields)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'home_tasks' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Count template tasks
-- SELECT COUNT(*) as template_count FROM public.tasks;

-- Count active home tasks (should be 0 after restructuring)
-- SELECT COUNT(*) as active_task_count FROM public.home_tasks;
