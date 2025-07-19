

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appliances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "brand" "text",
    "model" "text",
    "serial_number" "text",
    "purchase_date" "date",
    "warranty_expiration" "date",
    "manual_url" "text",
    "location" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appliances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cabinets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "brand" "text",
    "material" "text",
    "color" "text",
    "style" "text",
    "room" "text",
    "purchase_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "model" "text",
    "warranty_expiration" "date",
    "location" "text",
    "serial_number" "text"
);


ALTER TABLE "public"."cabinets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "task_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false,
    "location" "text",
    "color" "text",
    "google_event_id" "text",
    "apple_event_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_recurring" boolean,
    "recurrence_pattern" "text",
    "recurrence_end_date" "text"
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."filters" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "location" "text",
    "size" "text",
    "type" "text",
    "brand" "text",
    "replacement_frequency" integer,
    "last_replaced" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "model" "text"
);


ALTER TABLE "public"."filters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "square_footage" integer,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "year_built" integer,
    "purchase_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."homes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."infrastructure_locations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "type" "text",
    "location" "text",
    "access_instructions" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."infrastructure_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."light_fixtures" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "location" "text",
    "type" "text",
    "bulb_type" "text",
    "wattage" "text",
    "brand" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "model" "text",
    "serial_number" "text",
    "purchase_date" "date",
    "warranty_expiration" "date"
);


ALTER TABLE "public"."light_fixtures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."paint_colors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "brand" "text",
    "color_code" "text",
    "color_hex" "text",
    "room" "text",
    "date_purchased" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."paint_colors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "home_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "priority" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" "date",
    "completion_date" "date",
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "text",
    "recurrence_end_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "home_id" "uuid",
    "name" "text" NOT NULL,
    "brand" "text",
    "material" "text",
    "color" "text",
    "size" "text",
    "room" "text",
    "purchase_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "phone" "text",
    "default_home_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notification_email" boolean DEFAULT true,
    "notification_push" boolean DEFAULT false,
    "notification_sms" boolean DEFAULT false,
    "theme" character varying(10) DEFAULT 'system'::character varying,
    "calendar_sync_google" boolean DEFAULT false,
    "calendar_sync_apple" boolean DEFAULT false,
    CONSTRAINT "user_profiles_theme_check" CHECK ((("theme")::"text" = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "theme" "text" DEFAULT 'light'::"text",
    "notification_preferences" "jsonb" DEFAULT '{"push": false, "email": true}'::"jsonb",
    "calendar_sync" "jsonb" DEFAULT '{"apple": false, "google": false}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "category" "text",
    "contact_name" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appliances"
    ADD CONSTRAINT "appliances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cabinets"
    ADD CONSTRAINT "cabinets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."filters"
    ADD CONSTRAINT "filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."infrastructure_locations"
    ADD CONSTRAINT "infrastructure_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."light_fixtures"
    ADD CONSTRAINT "light_fixtures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."paint_colors"
    ADD CONSTRAINT "paint_colors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tiles"
    ADD CONSTRAINT "tiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_appliances_updated_at" BEFORE UPDATE ON "public"."appliances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cabinets_updated_at" BEFORE UPDATE ON "public"."cabinets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_calendar_events_updated_at" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_filters_updated_at" BEFORE UPDATE ON "public"."filters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_homes_updated_at" BEFORE UPDATE ON "public"."homes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_infrastructure_locations_updated_at" BEFORE UPDATE ON "public"."infrastructure_locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_light_fixtures_updated_at" BEFORE UPDATE ON "public"."light_fixtures" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_paint_colors_updated_at" BEFORE UPDATE ON "public"."paint_colors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tiles_updated_at" BEFORE UPDATE ON "public"."tiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendors_updated_at" BEFORE UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appliances"
    ADD CONSTRAINT "appliances_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cabinets"
    ADD CONSTRAINT "cabinets_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."filters"
    ADD CONSTRAINT "filters_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homes"
    ADD CONSTRAINT "homes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."infrastructure_locations"
    ADD CONSTRAINT "infrastructure_locations_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."light_fixtures"
    ADD CONSTRAINT "light_fixtures_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."paint_colors"
    ADD CONSTRAINT "paint_colors_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tiles"
    ADD CONSTRAINT "tiles_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own appliances" ON "public"."appliances" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "appliances"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own cabinets" ON "public"."cabinets" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "cabinets"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own calendar events" ON "public"."calendar_events" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own filters" ON "public"."filters" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "filters"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own homes" ON "public"."homes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own infrastructure locations" ON "public"."infrastructure_locations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "infrastructure_locations"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own light fixtures" ON "public"."light_fixtures" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "light_fixtures"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own paint colors" ON "public"."paint_colors" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "paint_colors"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own settings" ON "public"."user_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own tasks" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own tiles" ON "public"."tiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "tiles"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own vendors" ON "public"."vendors" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own appliances" ON "public"."appliances" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "appliances"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own cabinets" ON "public"."cabinets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "cabinets"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own calendar events" ON "public"."calendar_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own filters" ON "public"."filters" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "filters"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own homes" ON "public"."homes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own infrastructure locations" ON "public"."infrastructure_locations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "infrastructure_locations"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own light fixtures" ON "public"."light_fixtures" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "light_fixtures"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own paint colors" ON "public"."paint_colors" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "paint_colors"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tiles" ON "public"."tiles" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "tiles"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own vendors" ON "public"."vendors" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own appliances" ON "public"."appliances" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "appliances"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own cabinets" ON "public"."cabinets" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "cabinets"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own calendar events" ON "public"."calendar_events" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own filters" ON "public"."filters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "filters"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own homes" ON "public"."homes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own infrastructure locations" ON "public"."infrastructure_locations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "infrastructure_locations"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own light fixtures" ON "public"."light_fixtures" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "light_fixtures"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own paint colors" ON "public"."paint_colors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "paint_colors"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tiles" ON "public"."tiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "tiles"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own vendors" ON "public"."vendors" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own appliances" ON "public"."appliances" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "appliances"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own cabinets" ON "public"."cabinets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "cabinets"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own calendar events" ON "public"."calendar_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own filters" ON "public"."filters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "filters"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own homes" ON "public"."homes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own infrastructure locations" ON "public"."infrastructure_locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "infrastructure_locations"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own light fixtures" ON "public"."light_fixtures" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "light_fixtures"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own paint colors" ON "public"."paint_colors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "paint_colors"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tasks" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tiles" ON "public"."tiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."homes"
  WHERE (("homes"."id" = "tiles"."home_id") AND ("homes"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own vendors" ON "public"."vendors" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."appliances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cabinets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."filters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."infrastructure_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."light_fixtures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."paint_colors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."appliances" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."appliances" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."appliances" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cabinets" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cabinets" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."cabinets" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_events" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_events" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."calendar_events" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."filters" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."filters" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."filters" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."homes" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."homes" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."homes" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."infrastructure_locations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."infrastructure_locations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."infrastructure_locations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."light_fixtures" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."light_fixtures" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."light_fixtures" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."paint_colors" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."paint_colors" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."paint_colors" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tasks" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tasks" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tasks" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."tiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_profiles" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_settings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_settings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_settings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vendors" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vendors" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."vendors" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";






























RESET ALL;
