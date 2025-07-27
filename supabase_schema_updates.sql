-- Update appliances table to include room and purchased store
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS purchased_store TEXT;

-- Update filters table to include room
ALTER TABLE filters ADD COLUMN IF NOT EXISTS room TEXT;

-- Create materials table if it doesn't exist (based on your schema, it seems to be missing)
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  room TEXT,
  brand TEXT,
  source TEXT,
  purchase_date TEXT,
  notes TEXT,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update paint_colors table to include room under name
-- The table already has room field, but let's ensure it's properly structured

-- Create warranties table if it doesn't exist
CREATE TABLE IF NOT EXISTS warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  room TEXT,
  warranty_start_date TEXT,
  warranty_end_date TEXT,
  provider TEXT,
  notes TEXT,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for materials and warranties
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Materials policies
CREATE POLICY "Users can view their own materials" ON materials
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can insert their own materials" ON materials
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can update their own materials" ON materials
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can delete their own materials" ON materials
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

-- Warranties policies
CREATE POLICY "Users can view their own warranties" ON warranties
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can insert their own warranties" ON warranties
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can update their own warranties" ON warranties
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can delete their own warranties" ON warranties
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id)); 

-- Remove purchase information from paint_colors
ALTER TABLE paint_colors DROP COLUMN IF EXISTS date_purchased;

-- Remove location and serial_number from appliances
ALTER TABLE appliances DROP COLUMN IF EXISTS location;
ALTER TABLE appliances DROP COLUMN IF EXISTS serial_number; 

-- Modify tasks table to support the new task system
-- Add new columns to support the comprehensive task management system

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS suggested_frequency VARCHAR(255),
ADD COLUMN IF NOT EXISTS custom_frequency VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_completed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_due TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES vendors(id),
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS frequency_type VARCHAR(50) DEFAULT 'custom', -- 'suggested' or 'custom'
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'maintenance', -- 'maintenance', 'cleaning', 'repair', 'safety'
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS vendor_notes TEXT,
ADD COLUMN IF NOT EXISTS room_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS equipment_required TEXT,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS is_recurring_task BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER, -- in days
ADD COLUMN IF NOT EXISTS recurrence_unit VARCHAR(20), -- 'days', 'weeks', 'months', 'years'
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id);

-- Create task_history table to track completion history
CREATE TABLE IF NOT EXISTS task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  completion_rating INTEGER CHECK (completion_rating >= 1 AND completion_rating <= 5),
  photos TEXT[], -- Array of photo URLs
  cost_actual DECIMAL(10,2),
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_templates table for predefined tasks
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255) NOT NULL,
  suggested_frequency VARCHAR(255),
  instructions TEXT,
  estimated_duration_minutes INTEGER,
  estimated_cost DECIMAL(10,2),
  task_type VARCHAR(50) DEFAULT 'maintenance',
  priority_level VARCHAR(20) DEFAULT 'medium',
  equipment_required TEXT,
  safety_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined task templates
INSERT INTO task_templates (title, category, subcategory, suggested_frequency, instructions, estimated_duration_minutes, task_type, priority_level) VALUES
-- Home Maintenance
('HVAC Filter Replacement', 'Home Maintenance', 'Filters', '30-90 days', 'Replace the air filter in the HVAC system. Check filter size before purchasing.', 15, 'maintenance', 'medium'),
('Light Bulb Check', 'Home Maintenance', 'Light Bulbs', 'As needed - check monthly', 'Check all light bulbs and replace any that are burned out or flickering.', 30, 'maintenance', 'low'),
('Irrigation System', 'Home Maintenance', 'Irrigation', 'Spring (start-up) / Fall (winterize)', 'Spring: Start up irrigation system and check for leaks. Fall: Winterize system to prevent freezing.', 120, 'maintenance', 'medium'),
('Window Cleaning', 'Home Maintenance', 'Window Cleaning', '2x a year - spring and fall', 'Clean all windows inside and out. Check for any damage or needed repairs.', 180, 'maintenance', 'low'),
('Furniture Cleaning', 'Home Maintenance', 'Furniture Cleaning', '6 months', 'Deep clean upholstered furniture, vacuum under cushions, spot clean stains.', 240, 'maintenance', 'low'),
('Rug Cleaning', 'Home Maintenance', 'Rug Cleaning', '6 months', 'Professional deep cleaning of all area rugs. Check for damage or needed repairs.', 300, 'maintenance', 'low'),
('Exterior Home Maintenance', 'Home Maintenance', 'Exterior Home', 'Annually (spring or summer)', 'Inspect siding, trim, and exterior surfaces. Clean and repair as needed.', 480, 'maintenance', 'medium'),
('Painting Touch-ups', 'Home Maintenance', 'Painting', 'Touch ups annually; full repair every 5-10 years', 'Touch up interior paint where needed. Full repaint every 5-10 years.', 120, 'maintenance', 'low'),
('Gutter Cleaning', 'Home Maintenance', 'Gutters', 'Spring and fall', 'Clean all gutters and downspouts. Check for damage and repair as needed.', 180, 'maintenance', 'medium'),
('Chimney Inspection', 'Home Maintenance', 'Chimney / Fireplace', 'Annually (fall)', 'Annual chimney inspection and cleaning. Check for creosote buildup and damage.', 120, 'maintenance', 'high'),
('Deck/Patio Resealing', 'Home Maintenance', 'Decks / Patio', 'Annually (spring / summer)', 'Clean and reseal deck/patio surface. Check for loose boards or needed repairs.', 360, 'maintenance', 'medium'),
('Tree/Shrub Trimming', 'Home Maintenance', 'Tree / Shrub Trimming', 'Annually (late winter / early spring or after blooming)', 'Trim trees and shrubs for health and appearance. Remove dead branches.', 240, 'maintenance', 'medium'),
('Grass Cutting', 'Home Maintenance', 'Grass cutting', 'Weekly or as needed', 'Mow lawn and trim edges. Adjust height based on season.', 60, 'maintenance', 'low'),
('HVAC Service', 'Home Maintenance', 'HVAC Service', 'Twice per year (spring and fall)', 'Spring: AC tune-up. Fall: Heating system inspection and maintenance.', 120, 'maintenance', 'high'),
('Sump Pump Check', 'Home Maintenance', 'Sump Pump', 'Annually', 'Test sump pump operation. Clean pit and check for debris.', 30, 'maintenance', 'high'),
('Security System Check', 'Home Maintenance', 'Security Systems and Cameras', 'Annually (test and clean)', 'Test all security systems and cameras. Clean camera lenses and check connections.', 90, 'maintenance', 'high'),

-- Health + Safety
('Smoke/CO2 Detector Test', 'Health + Safety', 'Smoke / CO2 Detectors', 'Test monthly, replace batteries annually', 'Test all smoke and CO2 detectors by pressing the test button. Replace batteries if needed.', 15, 'safety', 'high'),
('Fire Extinguisher Inspection', 'Health + Safety', 'Fire Extinguisher', 'Inspect annually', 'Inspect fire extinguishers for proper pressure and expiration dates.', 30, 'safety', 'high'),
('Emergency Kit Review', 'Health + Safety', 'Emergency Kit', 'Review and update every 6 months', 'Check emergency kit contents and replace expired items. Update contact information.', 60, 'safety', 'medium'),
('Medication Clean Out', 'Health + Safety', 'Medication Clean Out', 'Annually', 'Dispose of expired medications properly. Check all medicine cabinets.', 45, 'safety', 'medium'),

-- Deep Cleaning
('Fridge Deep Clean', 'Deep Cleaning', 'Fridge', '6 months', 'Remove all food, clean shelves, drawers, and door seals. Check for expired items.', 120, 'cleaning', 'low'),
('Dryer Vent Cleaning', 'Deep Cleaning', 'Dryer Vents', 'Annually', 'Clean dryer vent and exhaust duct to prevent fire hazards.', 90, 'cleaning', 'high'),
('Trash Can Cleaning', 'Deep Cleaning', 'Trash Cans', 'Monthly', 'Clean all trash cans inside and out. Disinfect to prevent odors and bacteria.', 30, 'cleaning', 'low'),
('Bedding Change', 'Deep Cleaning', 'Sheets', 'Weekly or bi-weekly', 'Change and wash all bedding including sheets, pillowcases, and duvet covers.', 45, 'cleaning', 'low'),
('Baseboards and Door Frames', 'Deep Cleaning', 'Baseboards and Door Frames', '6 months', 'Clean baseboards and door frames throughout the house. Remove dust and dirt buildup.', 180, 'cleaning', 'low'),
('Light Fixtures and Ceiling Fans', 'Deep Cleaning', 'Light Fixtures + Ceiling Fans', 'Quarterly', 'Clean light fixtures and ceiling fan blades. Replace bulbs as needed.', 90, 'cleaning', 'low'),
('Vents and Air Returns', 'Deep Cleaning', 'Vents + Air Returns', 'Quarterly', 'Clean air vents and return grilles. Remove dust and debris.', 60, 'cleaning', 'medium'),
('Shower Head Cleaning', 'Deep Cleaning', 'Shower Heads', '6 months', 'Remove mineral deposits from shower heads. Soak in vinegar if needed.', 45, 'cleaning', 'low'),
('Garbage Disposal Cleaning', 'Deep Cleaning', 'Garbage Disposal', 'Monthly (deep clean 6 months)', 'Clean garbage disposal with ice cubes and citrus. Deep clean every 6 months.', 15, 'cleaning', 'low'),
('Washer and Dryer Cleaning', 'Deep Cleaning', 'Washer + Dryer', 'Annually', 'Clean washer drum, dryer lint trap, and area behind appliances.', 120, 'cleaning', 'medium'),
('Grout Cleaning', 'Deep Cleaning', 'Grout', 'Annually', 'Deep clean and seal grout in bathrooms and kitchen. Remove stains and mildew.', 240, 'cleaning', 'low'),
('Garage Cleaning', 'Deep Cleaning', 'Garage', 'Quarterly', 'Organize and clean garage. Remove clutter and sweep floors.', 180, 'cleaning', 'low');

-- Add RLS policies for new tables
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_history
CREATE POLICY "Users can view their own task history" ON task_history
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own task history" ON task_history
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task history" ON task_history
  FOR UPDATE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own task history" ON task_history
  FOR DELETE USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

-- RLS policies for task_templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view task templates" ON task_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_subcategory ON tasks(subcategory);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_next_due ON tasks(next_due);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_completed_at ON task_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_subcategory ON task_templates(subcategory);

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Comprehensive task management system for home maintenance, cleaning, and repairs';
COMMENT ON TABLE task_history IS 'Historical record of task completions with details';
COMMENT ON TABLE task_templates IS 'Predefined task templates for common home maintenance activities'; 

-- Clean up and simplify to use only tasks table
-- Remove task_templates table and related functionality
DROP TABLE IF EXISTS task_templates CASCADE;

-- Clean up tasks table and simplify RLS policies
-- Remove all existing tasks data
DELETE FROM task_history;
DELETE FROM tasks;

-- Drop existing RLS policies for tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

-- Create simplified RLS policies for tasks table (authenticated users only)
CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tasks" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tasks" ON tasks
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tasks" ON tasks
  FOR DELETE USING (auth.role() = 'authenticated');

-- Clean up task_history table and simplify RLS policies
DELETE FROM task_history;

-- Drop existing RLS policies for task_history table
DROP POLICY IF EXISTS "Users can view their own task history" ON task_history;
DROP POLICY IF EXISTS "Users can insert their own task history" ON task_history;
DROP POLICY IF EXISTS "Users can update their own task history" ON task_history;
DROP POLICY IF EXISTS "Users can delete their own task history" ON task_history;
DROP POLICY IF EXISTS "Authenticated users can view task history" ON task_history;
DROP POLICY IF EXISTS "Authenticated users can insert task history" ON task_history;
DROP POLICY IF EXISTS "Authenticated users can update task history" ON task_history;
DROP POLICY IF EXISTS "Authenticated users can delete task history" ON task_history;

-- Create simplified RLS policies for task_history table (authenticated users only)
CREATE POLICY "Authenticated users can view task history" ON task_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert task history" ON task_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update task history" ON task_history
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete task history" ON task_history
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add is_primary field to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Insert predefined tasks directly into the tasks table
INSERT INTO tasks (title, category, subcategory, suggested_frequency, instructions, estimated_duration_minutes, task_type, priority_level, is_active, status) VALUES
-- Home Maintenance
('HVAC Filter Replacement', 'Home Maintenance', 'Filters', '30-90 days', 'Replace the air filter in the HVAC system. Check filter size before purchasing.', 15, 'maintenance', 'medium', true, 'pending'),
('Light Bulb Check', 'Home Maintenance', 'Light Bulbs', 'As needed - check monthly', 'Check all light bulbs and replace any that are burned out or flickering.', 30, 'maintenance', 'low', true, 'pending'),
('Irrigation System', 'Home Maintenance', 'Irrigation', 'Spring (start-up) / Fall (winterize)', 'Spring: Start up irrigation system and check for leaks. Fall: Winterize system to prevent freezing.', 120, 'maintenance', 'medium', true, 'pending'),
('Window Cleaning', 'Home Maintenance', 'Window Cleaning', '2x a year - spring and fall', 'Clean all windows inside and out. Check for any damage or needed repairs.', 180, 'maintenance', 'low', true, 'pending'),
('Furniture Cleaning', 'Home Maintenance', 'Furniture Cleaning', '6 months', 'Deep clean upholstered furniture, vacuum under cushions, spot clean stains.', 240, 'maintenance', 'low', true, 'pending'),
('Rug Cleaning', 'Home Maintenance', 'Rug Cleaning', '6 months', 'Professional deep cleaning of all area rugs. Check for damage or needed repairs.', 300, 'maintenance', 'low', true, 'pending'),
('Exterior Home Maintenance', 'Home Maintenance', 'Exterior Home', 'Annually (spring or summer)', 'Inspect siding, trim, and exterior surfaces. Clean and repair as needed.', 480, 'maintenance', 'medium', true, 'pending'),
('Painting Touch-ups', 'Home Maintenance', 'Painting', 'Touch ups annually; full repair every 5-10 years', 'Touch up interior paint where needed. Full repaint every 5-10 years.', 120, 'maintenance', 'low', true, 'pending'),
('Gutter Cleaning', 'Home Maintenance', 'Gutters', 'Spring and fall', 'Clean all gutters and downspouts. Check for damage and repair as needed.', 180, 'maintenance', 'medium', true, 'pending'),
('Chimney Inspection', 'Home Maintenance', 'Chimney / Fireplace', 'Annually (fall)', 'Annual chimney inspection and cleaning. Check for creosote buildup and damage.', 120, 'maintenance', 'high', true, 'pending'),
('Deck/Patio Resealing', 'Home Maintenance', 'Decks / Patio', 'Annually (spring / summer)', 'Clean and reseal deck/patio surface. Check for loose boards or needed repairs.', 360, 'maintenance', 'medium', true, 'pending'),
('Tree/Shrub Trimming', 'Home Maintenance', 'Tree / Shrub Trimming', 'Annually (late winter / early spring or after blooming)', 'Trim trees and shrubs for health and appearance. Remove dead branches.', 240, 'maintenance', 'medium', true, 'pending'),
('Grass Cutting', 'Home Maintenance', 'Grass cutting', 'Weekly or as needed', 'Mow lawn and trim edges. Adjust height based on season.', 60, 'maintenance', 'low', true, 'pending'),
('HVAC Service', 'Home Maintenance', 'HVAC Service', 'Twice per year (spring and fall)', 'Spring: AC tune-up. Fall: Heating system inspection and maintenance.', 120, 'maintenance', 'high', true, 'pending'),
('Sump Pump Check', 'Home Maintenance', 'Sump Pump', 'Annually', 'Test sump pump operation. Clean pit and check for debris.', 30, 'maintenance', 'high', true, 'pending'),
('Security System Check', 'Home Maintenance', 'Security Systems and Cameras', 'Annually (test and clean)', 'Test all security systems and cameras. Clean camera lenses and check connections.', 90, 'maintenance', 'high', true, 'pending'),

-- Health + Safety
('Smoke/CO2 Detector Test', 'Health + Safety', 'Smoke / CO2 Detectors', 'Test monthly, replace batteries annually', 'Test all smoke and CO2 detectors by pressing the test button. Replace batteries if needed.', 15, 'safety', 'high', true, 'pending'),
('Fire Extinguisher Inspection', 'Health + Safety', 'Fire Extinguisher', 'Inspect annually', 'Inspect fire extinguishers for proper pressure and expiration dates.', 30, 'safety', 'high', true, 'pending'),
('Emergency Kit Review', 'Health + Safety', 'Emergency Kit', 'Review and update every 6 months', 'Check emergency kit contents and replace expired items. Update contact information.', 60, 'safety', 'medium', true, 'pending'),
('Medication Clean Out', 'Health + Safety', 'Medication Clean Out', 'Annually', 'Dispose of expired medications properly. Check all medicine cabinets.', 45, 'safety', 'medium', true, 'pending'),

-- Deep Cleaning
('Fridge Deep Clean', 'Deep Cleaning', 'Fridge', '6 months', 'Remove all food, clean shelves, drawers, and door seals. Check for expired items.', 120, 'cleaning', 'low', true, 'pending'),
('Dryer Vent Cleaning', 'Deep Cleaning', 'Dryer Vents', 'Annually', 'Clean dryer vent and exhaust duct to prevent fire hazards.', 90, 'cleaning', 'high', true, 'pending'),
('Trash Can Cleaning', 'Deep Cleaning', 'Trash Cans', 'Monthly', 'Clean all trash cans inside and out. Disinfect to prevent odors and bacteria.', 30, 'cleaning', 'low', true, 'pending'),
('Bedding Change', 'Deep Cleaning', 'Sheets', 'Weekly or bi-weekly', 'Change and wash all bedding including sheets, pillowcases, and duvet covers.', 45, 'cleaning', 'low', true, 'pending'),
('Baseboards and Door Frames', 'Deep Cleaning', 'Baseboards and Door Frames', '6 months', 'Clean baseboards and door frames throughout the house. Remove dust and dirt buildup.', 180, 'cleaning', 'low', true, 'pending'),
('Light Fixtures and Ceiling Fans', 'Deep Cleaning', 'Light Fixtures + Ceiling Fans', 'Quarterly', 'Clean light fixtures and ceiling fan blades. Replace bulbs as needed.', 90, 'cleaning', 'low', true, 'pending'),
('Vents and Air Returns', 'Deep Cleaning', 'Vents + Air Returns', 'Quarterly', 'Clean air vents and return grilles. Remove dust and debris.', 60, 'cleaning', 'medium', true, 'pending'),
('Shower Head Cleaning', 'Deep Cleaning', 'Shower Heads', '6 months', 'Remove mineral deposits from shower heads. Soak in vinegar if needed.', 45, 'cleaning', 'low', true, 'pending'),
('Garbage Disposal Cleaning', 'Deep Cleaning', 'Garbage Disposal', 'Monthly (deep clean 6 months)', 'Clean garbage disposal with ice cubes and citrus. Deep clean every 6 months.', 15, 'cleaning', 'low', true, 'pending'),
('Washer and Dryer Cleaning', 'Deep Cleaning', 'Washer + Dryer', 'Annually', 'Clean washer drum, dryer lint trap, and area behind appliances.', 120, 'cleaning', 'medium', true, 'pending'),
('Grout Cleaning', 'Deep Cleaning', 'Grout', 'Annually', 'Deep clean and seal grout in bathrooms and kitchen. Remove stains and mildew.', 240, 'cleaning', 'low', true, 'pending'),
('Garage Cleaning', 'Deep Cleaning', 'Garage', 'Quarterly', 'Organize and clean garage. Remove clutter and sweep floors.', 180, 'cleaning', 'low', true, 'pending'); 