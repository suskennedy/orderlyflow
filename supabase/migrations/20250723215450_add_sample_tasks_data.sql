-- Add sample tasks data to match the design specifications

-- First, add the new fields to tasks table if they don't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'Monthly',
ADD COLUMN IF NOT EXISTS attach_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS attach_vendor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suggested_replace VARCHAR(255),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS vendor_id UUID,
ADD COLUMN IF NOT EXISTS assigned_user_id UUID,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS is_project BOOLEAN DEFAULT false;

-- Clear existing sample data
DELETE FROM tasks WHERE title IN (
  'Replace air filter', 'Check smoke alarms', 'Clean gutters', 
  'Deep clean baseboards', 'Clean windows', 'Fix leaky faucet', 
  'Touch up paint', 'Fridge filter', 'Kitchen renovation'
);

-- Insert sample tasks for each category matching the design
INSERT INTO tasks (title, category, frequency, description, start_date, attach_user, attach_vendor, suggested_replace, status, priority, is_project) VALUES

-- Home Maintenance
('Replace air filter', 'Home Maintenance', 'Monthly', 'Replace HVAC air filter', '2024-04-24', true, false, '6 months', 'pending', 'medium', false),
('Check smoke alarms', 'Home Maintenance', 'Monthly', 'Test smoke alarm batteries', '2024-04-24', true, false, null, 'pending', 'high', false),
('Clean gutters', 'Home Maintenance', 'Quarterly', 'Clean and inspect gutters', '2024-04-24', false, true, null, 'pending', 'medium', false),
('Flush water heater', 'Home Maintenance', 'Yearly', 'Drain and flush water heater tank', '2024-04-24', false, true, null, 'pending', 'medium', false),

-- Deep Cleaning  
('Deep clean baseboards', 'Deep Cleaning', 'Quarterly', 'Clean all baseboards throughout house', '2024-04-24', true, false, null, 'pending', 'low', false),
('Clean windows', 'Deep Cleaning', 'Monthly', 'Clean interior and exterior windows', '2024-04-24', false, true, null, 'pending', 'medium', false),
('Scrub grout', 'Deep Cleaning', 'Quarterly', 'Deep clean bathroom tile grout', '2024-04-24', true, false, null, 'pending', 'low', false),

-- Repairs
('Fix leaky faucet', 'Repairs', 'Custom', 'Repair bathroom faucet leak', '2024-04-24', false, true, null, 'pending', 'high', false),
('Touch up paint', 'Repairs', 'Yearly', 'Touch up paint scratches and scuffs', '2024-04-24', true, false, null, 'pending', 'low', false),
('Replace door handle', 'Repairs', 'Custom', 'Fix broken front door handle', '2024-04-24', false, true, null, 'pending', 'medium', false),

-- Projects
('Fridge filter', 'Projects', 'Monthly', 'Replace refrigerator water filter', '2024-04-24', true, true, '6 months', 'pending', 'medium', true),
('Kitchen renovation', 'Projects', 'Custom', 'Complete kitchen remodel project', '2024-04-24', false, true, null, 'in_progress', 'high', true),
('Install new lighting', 'Projects', 'Custom', 'Install LED recessed lighting in living room', '2024-04-24', false, true, null, 'pending', 'medium', true),
('Bathroom remodel', 'Projects', 'Custom', 'Master bathroom renovation project', '2024-04-24', false, true, null, 'pending', 'high', true)

ON CONFLICT (id) DO NOTHING;
