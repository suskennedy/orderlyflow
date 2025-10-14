-- Add suggested_use column to tasks table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='tasks'
          AND table_schema='public'
          AND column_name='suggested_use'
    ) THEN
        ALTER TABLE public.tasks
        ADD COLUMN suggested_use VARCHAR(255);
    END IF;
END $$;

-- Update existing tasks with suggested_use values based on title and description matching

-- Health + Safety tasks
UPDATE public.tasks 
SET suggested_use = 'Semi Annually' 
WHERE title = 'Emergency Kit' AND description LIKE '%Check your emergency kit twice a year%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Fire Extinguisher' AND description LIKE '%Check a fire extinguisher by ensuring the pressure gauge%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Medication' AND description LIKE '%Clear out expired or unused meds yearly%';

UPDATE public.tasks 
SET suggested_use = 'Monthly' 
WHERE title = 'Smoke / CO2 Detectors' AND description LIKE '%Test smoke/CO₂ detectors monthly%';

-- Home Maintenance tasks
UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Chimney / Fireplace' AND description LIKE '%Hire a professional to sweep out creosote%';

UPDATE public.tasks 
SET suggested_use = 'Annually (spring / summer)' 
WHERE title = 'Decks / Patio (Reseal)' AND description LIKE '%Hire a professional to sweep out creosote%';

UPDATE public.tasks 
SET suggested_use = 'Annually (spring or summer)' 
WHERE title = 'Exterior Home' AND description LIKE '%Use a soft-bristle brush or power washer%';

UPDATE public.tasks 
SET suggested_use = '30–90 days' 
WHERE title = 'Filters' AND description LIKE '%Replace air filters with the correct size%';

UPDATE public.tasks 
SET suggested_use = 'Semi-annually' 
WHERE title = 'Furniture Cleaning' AND description LIKE '%Vacuum upholstered surfaces%';

UPDATE public.tasks 
SET suggested_use = 'Twice per year (spring and fall)' 
WHERE title = 'Gutters' AND description LIKE '%Scoop out leaves and debris%';

UPDATE public.tasks 
SET suggested_use = 'Twice per year (spring and fall)' 
WHERE title = 'HVAC Service' AND description LIKE '%Replace filters, vacuum vents%';

UPDATE public.tasks 
SET suggested_use = 'Spring (start-up) / Fall (winterize)' 
WHERE title = 'Irrigation' AND description LIKE '%In spring, flush lines and check heads%';

UPDATE public.tasks 
SET suggested_use = 'Touch ups annually; full repair every 5–10 years' 
WHERE title = 'Painting' AND description LIKE '%Wipe walls with mild soap before touching up%';

UPDATE public.tasks 
SET suggested_use = 'Semi-annually' 
WHERE title = 'Rug Cleaning' AND description LIKE '%Professional rug cleaning service%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Security Systems and Cameras' AND description LIKE '%Wipe camera lenses with microfiber cloth%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Sump Pump' AND description LIKE '%Pour water into the pit to ensure it activates%';

UPDATE public.tasks 
SET suggested_use = 'Annually (late winter / early spring)' 
WHERE title = 'Tree / Shrub Trimming' AND description LIKE '%Prune dead or overgrown branches%';

UPDATE public.tasks 
SET suggested_use = 'Semi-annually (spring and fall)' 
WHERE title = 'Window Cleaning' AND description LIKE '%Wash glass with vinegar-water%';

-- Deep Cleaning tasks
UPDATE public.tasks 
SET suggested_use = 'Semi-annual' 
WHERE title = 'Baseboards and Door Frames' AND description LIKE '%Dust with a microfiber cloth%';

UPDATE public.tasks 
SET suggested_use = 'Semi-annual' 
WHERE title = 'Fridge' AND description LIKE '%Empty contents, toss expired food%';

UPDATE public.tasks 
SET suggested_use = 'Monthly (deep clean every 6 months)' 
WHERE title = 'Garbage Disposal' AND description LIKE '%Run ice cubes and citrus peels%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Garage' AND description LIKE '%Declutter unwanted items%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Grout' AND description LIKE '%Scrub with baking soda paste%';

UPDATE public.tasks 
SET suggested_use = 'Quarterly' 
WHERE title = 'Light Fixtures + Ceiling Fans' AND description LIKE '%Dust with a microfiber cloth%';

UPDATE public.tasks 
SET suggested_use = 'Weekly or bi-weekly' 
WHERE title = 'Sheets' AND description LIKE '%Wash in hot water with mild detergent%';

UPDATE public.tasks 
SET suggested_use = 'Every 6 months' 
WHERE title = 'Shower Heads' AND description LIKE '%Scrub nozzles with a toothbrush%';

UPDATE public.tasks 
SET suggested_use = 'Monthly' 
WHERE title = 'Trash Cans' AND description LIKE '%Rinse with a hose, scrub with soap%';

UPDATE public.tasks 
SET suggested_use = 'Quarterly' 
WHERE title = 'Vents + Air Returns' AND description LIKE '%Vacuum covers and wipe with damp cloth%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Washer + Dryer (below and behind)' AND description LIKE '%Run washer on hot with vinegar%';

UPDATE public.tasks 
SET suggested_use = 'Annually' 
WHERE title = 'Dryer Vents' AND description LIKE '%Disconnect vent hose, vacuum lint buildup%';
