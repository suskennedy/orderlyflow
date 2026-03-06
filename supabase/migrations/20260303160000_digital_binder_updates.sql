-- Create Pools table
CREATE TABLE IF NOT EXISTS "public"."pools" (
    "id" uuid DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" uuid NOT NULL,
    "type" text, -- salt water vs chlorine
    "installation_type" text, -- in-ground vs above-ground
    "notes" text,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."pools" OWNER TO "postgres";
ALTER TABLE "public"."pools" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pools" ON "public"."pools"
    FOR SELECT USING (
        "home_id" IN (SELECT "id" FROM "public"."homes" WHERE "user_id" = "auth"."uid"())
    );

CREATE POLICY "Users can insert their own pools" ON "public"."pools"
    FOR INSERT WITH CHECK (
        "home_id" IN (SELECT "id" FROM "public"."homes" WHERE "user_id" = "auth"."uid"())
    );

CREATE POLICY "Users can update their own pools" ON "public"."pools"
    FOR UPDATE USING (
        "home_id" IN (SELECT "id" FROM "public"."homes" WHERE "user_id" = "auth"."uid"())
    );

CREATE POLICY "Users can delete their own pools" ON "public"."pools"
    FOR DELETE USING (
        "home_id" IN (SELECT "id" FROM "public"."homes" WHERE "user_id" = "auth"."uid"())
    );

-- Modify Paint Colors table
ALTER TABLE "public"."paint_colors"
  ADD COLUMN IF NOT EXISTS "finish" text,
  ADD COLUMN IF NOT EXISTS "wallpaper" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "trim_color" text;

ALTER TABLE "public"."paint_colors"
  DROP COLUMN IF EXISTS "brand",
  DROP COLUMN IF EXISTS "color_hex",
  DROP COLUMN IF EXISTS "date_purchased";


-- Modify Appliances table
ALTER TABLE "public"."appliances"
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "warranty_url" text;

ALTER TABLE "public"."appliances"
  DROP COLUMN IF EXISTS "serial_number",
  DROP COLUMN IF EXISTS "purchase_date",
  DROP COLUMN IF EXISTS "warranty_expiration";


-- Modify Materials table
ALTER TABLE "public"."materials"
  RENAME COLUMN "room" TO "location";

ALTER TABLE "public"."materials"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "source",
  DROP COLUMN IF EXISTS "purchase_date";
