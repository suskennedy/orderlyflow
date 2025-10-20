-- Update repairs table structure according to new requirements
-- Drop existing data and recreate with new structure

-- First, drop all existing data from repairs table
DELETE FROM repairs;

-- Drop existing columns that are no longer needed
ALTER TABLE repairs DROP COLUMN IF EXISTS category;
ALTER TABLE repairs DROP COLUMN IF EXISTS priority;
ALTER TABLE repairs DROP COLUMN IF EXISTS estimated_cost;
ALTER TABLE repairs DROP COLUMN IF EXISTS actual_cost;
ALTER TABLE repairs DROP COLUMN IF EXISTS assigned_vendor_id;
ALTER TABLE repairs DROP COLUMN IF EXISTS assigned_user_id;
ALTER TABLE repairs DROP COLUMN IF EXISTS due_date;
ALTER TABLE repairs DROP COLUMN IF EXISTS completed_date;
ALTER TABLE repairs DROP COLUMN IF EXISTS notes;
ALTER TABLE repairs DROP COLUMN IF EXISTS photos;

-- Add new columns according to requirements
ALTER TABLE repairs 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS date_reported DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS description_issue TEXT,
ADD COLUMN IF NOT EXISTS photos_videos TEXT[], -- Array of photo/video URLs
ADD COLUMN IF NOT EXISTS location_in_home VARCHAR(255),
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS final_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS schedule_reminder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'to_do' CHECK (status IN ('to_do', 'scheduled', 'in_progress', 'complete'));

-- Update the title column to be more specific
ALTER TABLE repairs ALTER COLUMN title TYPE VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repairs_vendor_id ON repairs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_repairs_user_id ON repairs(user_id);
CREATE INDEX IF NOT EXISTS idx_repairs_date_reported ON repairs(date_reported);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_location ON repairs(location_in_home);

-- Update RLS policies to work with new structure
DROP POLICY IF EXISTS "Users can view repairs for their family homes" ON repairs;
DROP POLICY IF EXISTS "Users can insert repairs for their family homes" ON repairs;
DROP POLICY IF EXISTS "Users can update repairs for their family homes" ON repairs;
DROP POLICY IF EXISTS "Users can delete repairs for their family homes" ON repairs;

-- Create new RLS policies
CREATE POLICY "Users can view repairs for their family homes" ON repairs
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert repairs for their family homes" ON repairs
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update repairs for their family homes" ON repairs
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repairs for their family homes" ON repairs
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Add comments to document the new structure
COMMENT ON TABLE repairs IS 'Repairs table with new structure: Title, Vendor/User, Date Reported, Description, Photos/Videos, Location, Cost Estimate, Final Cost, Schedule Reminder, Notes, Status';
COMMENT ON COLUMN repairs.vendor_id IS 'Reference to vendor assigned to this repair';
COMMENT ON COLUMN repairs.user_id IS 'Reference to user assigned to this repair';
COMMENT ON COLUMN repairs.date_reported IS 'Date when the repair was reported (auto-set to today)';
COMMENT ON COLUMN repairs.description_issue IS 'Short description of the issue';
COMMENT ON COLUMN repairs.photos_videos IS 'Array of photo/video URLs';
COMMENT ON COLUMN repairs.location_in_home IS 'Location within the home where repair is needed';
COMMENT ON COLUMN repairs.cost_estimate IS 'Estimated cost of the repair';
COMMENT ON COLUMN repairs.final_cost IS 'Final actual cost of the repair';
COMMENT ON COLUMN repairs.schedule_reminder IS 'Whether to schedule a reminder for this repair';
COMMENT ON COLUMN repairs.reminder_date IS 'Date for the reminder if schedule_reminder is true';
COMMENT ON COLUMN repairs.status IS 'Status: to_do, scheduled, in_progress, complete';
