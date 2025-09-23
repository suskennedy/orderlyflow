-- Clear existing tasks and populate with new data
DELETE FROM tasks;

-- Health + Safety Tasks
INSERT INTO tasks (title, category, description, priority) VALUES
('Emergency Kit', 'Health + Safety', 'Check your emergency kit twice a year; replace expired items, test gear, update documents, and restock so it''s ready to go.', 'high'),
('Fire Extinguisher', 'Health + Safety', 'Check a fire extinguisher by ensuring the pressure gauge is in the green, the pin and seal are intact, and the canister shows no damage or corrosion', 'high'),
('Medication', 'Health + Safety', 'Clear out expired or unused meds yearly and dispose of them safely.', 'medium'),
('Smoke / CO2 Detectors', 'Health + Safety', 'Test smoke/CO₂ detectors monthly and replace batteries yearly.', 'high');

-- Home Maintenance Tasks
INSERT INTO tasks (title, category, description, priority) VALUES
('Chimney / Fireplace', 'Home Maintenance', 'Hire a professional to sweep out creosote and soot; wipe down glass doors and vacuum ash. This is usually done in the Fall.', 'medium'),
('Decks / Patio (Reseal)', 'Home Maintenance', 'Hire a professional to sweep out creosote and soot; wipe down glass doors and vacuum ash.', 'medium'),
('Exterior Home', 'Home Maintenance', 'Use a soft-bristle brush or power washer with mild detergent to clean siding, brick, or stucco.', 'medium'),
('Filters', 'Home Maintenance', 'Replace air filters with the correct size; vacuum or wipe reusable filters before reinserting.', 'medium'),
('Furniture Cleaning', 'Home Maintenance', 'Vacuum upholstered surfaces, spot clean stains, and polish wood with appropriate cleaner.', 'low'),
('Gutters', 'Home Maintenance', 'Scoop out leaves and debris, flush with a hose, and check downspouts for clogs.', 'medium'),
('HVAC Service', 'Home Maintenance', 'Replace filters, vacuum vents, and have a technician clean coils and check refrigerant.', 'high'),
('Irrigation', 'Home Maintenance', 'In spring, flush lines and check heads; in fall, blow out water with air compressor to prevent freezing.', 'medium'),
('Painting', 'Home Maintenance', 'Wipe walls with mild soap before touching up; sand and repaint peeling or damaged spots.', 'low'),
('Rug Cleaning', 'Home Maintenance', 'Professional rug cleaning service.', 'low'),
('Security Systems and Cameras', 'Home Maintenance', 'Wipe camera lenses with microfiber cloth, test alarms, and replace backup batteries.', 'high'),
('Sump Pump', 'Home Maintenance', 'Pour water into the pit to ensure it activates, clean debris from the pit and pump screen.', 'high'),
('Tree / Shrub Trimming', 'Home Maintenance', 'Prune dead or overgrown branches with sharp shears; shape after blooming for healthy growth.', 'low'),
('Window Cleaning', 'Home Maintenance', 'Wash glass with vinegar-water or glass cleaner and a squeegee; wipe frames and tracks.', 'low');

-- Deep Cleaning Tasks
INSERT INTO tasks (title, category, description, priority) VALUES
('Baseboards and Door Frames', 'Deep Cleaning', 'Dust with a microfiber cloth, then wipe with warm soapy water or a vinegar solution.', 'low'),
('Fridge', 'Deep Cleaning', 'Empty contents, toss expired food, wipe shelves and drawers with warm soapy water, and vacuum coils.', 'medium'),
('Garbage Disposal', 'Deep Cleaning', 'Run ice cubes and citrus peels to freshen; for deep cleaning, scrub the rubber guard and use baking soda + vinegar.', 'low'),
('Garage', 'Deep Cleaning', 'Declutter unwanted items, sweep floors, wipe shelves, and power wash if needed.', 'low'),
('Grout', 'Deep Cleaning', 'Scrub with baking soda paste or a grout cleaner; reseal to prevent stains and mildew.', 'medium'),
('Light Fixtures + Ceiling Fans', 'Deep Cleaning', 'Dust with a microfiber cloth; wash glass shades and reverse fan direction seasonally.', 'low'),
('Sheets', 'Deep Cleaning', 'Wash in hot water with mild detergent; dry fully to prevent mildew.', 'medium'),
('Shower Heads', 'Deep Cleaning', 'Scrub nozzles with a toothbrush to clear mineral buildup.', 'low'),
('Trash Cans', 'Deep Cleaning', 'Rinse with a hose, scrub with soap or vinegar, and let dry before lining with bags.', 'low'),
('Vents + Air Returns', 'Deep Cleaning', 'Vacuum covers and wipe with damp cloth; replace or clean filters if needed', 'medium'),
('Washer + Dryer (below and behind)', 'Deep Cleaning', 'Run washer on hot with vinegar or cleaner; wipe drum and seals; pull units out to clean behind.', 'medium'),
('Dryer Vents', 'Deep Cleaning', 'Disconnect vent hose, vacuum lint buildup, and check outside vent flap for blockages.', 'high');
