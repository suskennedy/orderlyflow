ALTER TABLE "public"."homes"
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "state",
DROP COLUMN IF EXISTS "zip",
DROP COLUMN IF EXISTS "year_built",
DROP COLUMN IF EXISTS "purchase_date",
DROP COLUMN IF EXISTS "notes",
DROP COLUMN IF EXISTS "foundation_type",
DROP COLUMN IF EXISTS "latitude",
DROP COLUMN IF EXISTS "longitude",
DROP COLUMN IF EXISTS "warranty_info",
ADD COLUMN IF NOT EXISTS "sewer_vs_septic" text,
ADD COLUMN IF NOT EXISTS "water_source" text,
ADD COLUMN IF NOT EXISTS "water_heater_location" text;

ALTER TABLE "public"."pools"
DROP COLUMN IF EXISTS "type",
DROP COLUMN IF EXISTS "installation_type",
ADD COLUMN IF NOT EXISTS "salt_water_vs_chlorine" text,
ADD COLUMN IF NOT EXISTS "in_ground_vs_above_ground" text;

ALTER TABLE "public"."paint_colors"
RENAME COLUMN "name" TO "paint_color_name";

ALTER TABLE "public"."appliances"
DROP COLUMN IF EXISTS "name",
DROP COLUMN IF EXISTS "purchased_store",
RENAME COLUMN "room" TO "location";

ALTER TABLE "public"."materials"
DROP COLUMN IF EXISTS "name",
DROP COLUMN IF EXISTS "source",
DROP COLUMN IF EXISTS "purchase_date",
RENAME COLUMN "room" TO "location";
