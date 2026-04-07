export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appliances: {
        Row: {
          brand: string | null
          created_at: string | null
          home_id: string | null
          id: string
          location: string | null
          manual_url: string | null
          model: string | null
          notes: string | null
          type: string | null
          updated_at: string | null
          warranty_url: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          manual_url?: string | null
          model?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
          warranty_url?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          manual_url?: string | null
          model?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
          warranty_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appliances_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinets: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string | null
          home_id: string | null
          id: string
          location: string | null
          material: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          room: string | null
          serial_number: string | null
          style: string | null
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          material?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          room?: string | null
          serial_number?: string | null
          style?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          material?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          room?: string | null
          serial_number?: string | null
          style?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabinets_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          apple_event_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          google_event_id: string | null
          home_id: string | null
          home_task_id: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          project_id: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          repair_id: string | null
          start_time: string
          task_id: string | null
          task_type: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          apple_event_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          google_event_id?: string | null
          home_id?: string | null
          home_task_id?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          repair_id?: string | null
          start_time: string
          task_id?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          apple_event_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          home_id?: string | null
          home_task_id?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          repair_id?: string | null
          start_time?: string
          task_id?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_home_task_id_fkey"
            columns: ["home_task_id"]
            isOneToOne: false
            referencedRelation: "home_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          brand: string | null
          created_at: string | null
          home_id: string | null
          id: string
          last_replaced: string | null
          location: string | null
          model: string | null
          name: string
          notes: string | null
          replacement_frequency: number | null
          room: string | null
          size: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          last_replaced?: string | null
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          replacement_frequency?: number | null
          room?: string | null
          size?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          last_replaced?: string | null
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          replacement_frequency?: number | null
          room?: string | null
          size?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filters_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_calendar_events: {
        Row: {
          created_at: string
          event_id: string
          home_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          home_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          home_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_calendar_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "home_calendar_events_with_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_calendar_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_tasks: {
        Row: {
          assigned_user_id: string | null
          assigned_vendor_id: string | null
          category: string | null
          completed_at: string | null
          completed_by_external_name: string | null
          completed_by_type: string | null
          completed_by_user_id: string | null
          completed_by_vendor_id: string | null
          completion_date: string | null
          completion_notes: string | null
          completion_verification_notes: string | null
          completion_verification_status: string | null
          created_at: string | null
          custom_frequency: string | null
          description: string | null
          due_date: string | null
          equipment_required: string | null
          estimated_cost: number | null
          estimated_duration_minutes: number | null
          frequency_type: string | null
          home_id: string
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_recurring: boolean | null
          is_recurring_task: boolean | null
          last_completed: string | null
          last_modified_by: string | null
          last_reminder_sent: string | null
          next_due: string | null
          notes: string | null
          priority: string | null
          priority_level: string | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          recurrence_unit: string | null
          room_location: string | null
          safety_notes: string | null
          status: string | null
          subcategory: string | null
          suggested_frequency: string | null
          task_id: string | null
          task_type: string | null
          title: string
          updated_at: string | null
          vendor_notes: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by_external_name?: string | null
          completed_by_type?: string | null
          completed_by_user_id?: string | null
          completed_by_vendor_id?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          completion_verification_notes?: string | null
          completion_verification_status?: string | null
          created_at?: string | null
          custom_frequency?: string | null
          description?: string | null
          due_date?: string | null
          equipment_required?: string | null
          estimated_cost?: number | null
          estimated_duration_minutes?: number | null
          frequency_type?: string | null
          home_id: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          is_recurring_task?: boolean | null
          last_completed?: string | null
          last_modified_by?: string | null
          last_reminder_sent?: string | null
          next_due?: string | null
          notes?: string | null
          priority?: string | null
          priority_level?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          recurrence_unit?: string | null
          room_location?: string | null
          safety_notes?: string | null
          status?: string | null
          subcategory?: string | null
          suggested_frequency?: string | null
          task_id?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
          vendor_notes?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          assigned_vendor_id?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by_external_name?: string | null
          completed_by_type?: string | null
          completed_by_user_id?: string | null
          completed_by_vendor_id?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          completion_verification_notes?: string | null
          completion_verification_status?: string | null
          created_at?: string | null
          custom_frequency?: string | null
          description?: string | null
          due_date?: string | null
          equipment_required?: string | null
          estimated_cost?: number | null
          estimated_duration_minutes?: number | null
          frequency_type?: string | null
          home_id?: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          is_recurring_task?: boolean | null
          last_completed?: string | null
          last_modified_by?: string | null
          last_reminder_sent?: string | null
          next_due?: string | null
          notes?: string | null
          priority?: string | null
          priority_level?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          recurrence_unit?: string | null
          room_location?: string | null
          safety_notes?: string | null
          status?: string | null
          subcategory?: string | null
          suggested_frequency?: string | null
          task_id?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_completed_by_user_id_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_completed_by_vendor_id_fkey"
            columns: ["completed_by_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          sewer_vs_septic: string | null
          square_footage: number | null
          updated_at: string | null
          user_id: string | null
          water_heater_location: string | null
          water_source: string | null
        }
        Insert: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          sewer_vs_septic?: string | null
          square_footage?: number | null
          updated_at?: string | null
          user_id?: string | null
          water_heater_location?: string | null
          water_source?: string | null
        }
        Update: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sewer_vs_septic?: string | null
          square_footage?: number | null
          updated_at?: string | null
          user_id?: string | null
          water_heater_location?: string | null
          water_source?: string | null
        }
        Relationships: []
      }
      infrastructure_locations: {
        Row: {
          access_instructions: string | null
          created_at: string | null
          home_id: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          access_instructions?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          access_instructions?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infrastructure_locations_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      light_fixtures: {
        Row: {
          brand: string | null
          bulb_type: string | null
          created_at: string | null
          home_id: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          type: string | null
          updated_at: string | null
          warranty_expiration: string | null
          wattage: string | null
        }
        Insert: {
          brand?: string | null
          bulb_type?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          type?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
          wattage?: string | null
        }
        Update: {
          brand?: string | null
          bulb_type?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          type?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
          wattage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "light_fixtures_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          brand: string | null
          created_at: string | null
          home_id: string | null
          id: string
          location: string | null
          notes: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      paint_colors: {
        Row: {
          color_code: string | null
          created_at: string | null
          finish: string | null
          home_id: string | null
          id: string
          notes: string | null
          paint_color_name: string
          room: string | null
          trim_color: string | null
          updated_at: string | null
          wallpaper: boolean | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          finish?: string | null
          home_id?: string | null
          id?: string
          notes?: string | null
          paint_color_name: string
          room?: string | null
          trim_color?: string | null
          updated_at?: string | null
          wallpaper?: boolean | null
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          finish?: string | null
          home_id?: string | null
          id?: string
          notes?: string | null
          paint_color_name?: string
          room?: string | null
          trim_color?: string | null
          updated_at?: string | null
          wallpaper?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "paint_colors_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      pools: {
        Row: {
          created_at: string | null
          home_id: string
          id: string
          in_ground_vs_above_ground: string | null
          name: string
          notes: string | null
          salt_water_vs_chlorine: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          home_id: string
          id?: string
          in_ground_vs_above_ground?: string | null
          name?: string
          notes?: string | null
          salt_water_vs_chlorine?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          home_id?: string
          id?: string
          in_ground_vs_above_ground?: string | null
          name?: string
          notes?: string | null
          salt_water_vs_chlorine?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pools_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_user_ids: string[] | null
          category: string | null
          completion_date: string | null
          created_at: string | null
          current_spend: number | null
          description: string | null
          end_date: string | null
          estimated_budget: number | null
          final_cost: number | null
          home_id: string | null
          id: string
          location_in_home: string | null
          notes: string | null
          photos_inspiration: string[] | null
          priority: string | null
          project_type: string | null
          reminder_date: string | null
          reminders_enabled: boolean | null
          start_date: string | null
          status: string | null
          subtasks: Json | null
          target_completion_date: string | null
          title: string
          updated_at: string | null
          vendor_ids: string[] | null
        }
        Insert: {
          assigned_user_ids?: string[] | null
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          current_spend?: number | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          final_cost?: number | null
          home_id?: string | null
          id?: string
          location_in_home?: string | null
          notes?: string | null
          photos_inspiration?: string[] | null
          priority?: string | null
          project_type?: string | null
          reminder_date?: string | null
          reminders_enabled?: boolean | null
          start_date?: string | null
          status?: string | null
          subtasks?: Json | null
          target_completion_date?: string | null
          title: string
          updated_at?: string | null
          vendor_ids?: string[] | null
        }
        Update: {
          assigned_user_ids?: string[] | null
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          current_spend?: number | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          final_cost?: number | null
          home_id?: string | null
          id?: string
          location_in_home?: string | null
          notes?: string | null
          photos_inspiration?: string[] | null
          priority?: string | null
          project_type?: string | null
          reminder_date?: string | null
          reminders_enabled?: boolean | null
          start_date?: string | null
          status?: string | null
          subtasks?: Json | null
          target_completion_date?: string | null
          title?: string
          updated_at?: string | null
          vendor_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          cost_estimate: number | null
          created_at: string | null
          date_reported: string | null
          description: string | null
          description_issue: string | null
          final_cost: number | null
          home_id: string | null
          id: string
          location_in_home: string | null
          notes: string | null
          photos_videos: string[] | null
          reminder_date: string | null
          schedule_reminder: boolean | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          description_issue?: string | null
          final_cost?: number | null
          home_id?: string | null
          id?: string
          location_in_home?: string | null
          notes?: string | null
          photos_videos?: string[] | null
          reminder_date?: string | null
          schedule_reminder?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          description_issue?: string | null
          final_cost?: number | null
          home_id?: string | null
          id?: string
          location_in_home?: string | null
          notes?: string | null
          photos_videos?: string[] | null
          reminder_date?: string | null
          schedule_reminder?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repairs_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          completion_rating: number | null
          cost_actual: number | null
          created_at: string | null
          id: string
          notes: string | null
          photos: string[] | null
          task_id: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          completion_rating?: number | null
          cost_actual?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          task_id?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          completion_rating?: number | null
          cost_actual?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          task_id?: string | null
          time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          frequency: string | null
          id: string
          subcategory: string | null
          suggested_use: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          subcategory?: string | null
          suggested_use?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          subcategory?: string | null
          suggested_use?: string | null
          title?: string
        }
        Relationships: []
      }
      tiles: {
        Row: {
          brand: string | null
          color: string | null
          created_at: string | null
          home_id: string | null
          id: string
          material: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          room: string | null
          size: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          color?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          material?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          room?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          color?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          material?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          room?: string | null
          size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiles_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          calendar_sync_apple: boolean | null
          calendar_sync_google: boolean | null
          created_at: string | null
          default_home_id: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          notification_email: boolean | null
          notification_push: boolean | null
          notification_sms: boolean | null
          phone: string | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          calendar_sync_apple?: boolean | null
          calendar_sync_google?: boolean | null
          created_at?: string | null
          default_home_id?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          phone?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          calendar_sync_apple?: boolean | null
          calendar_sync_google?: boolean | null
          created_at?: string | null
          default_home_id?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          phone?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          calendar_sync: Json | null
          created_at: string | null
          id: string
          notification_preferences: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calendar_sync?: Json | null
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calendar_sync?: Json | null
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          category: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      warranties: {
        Row: {
          created_at: string | null
          family_account_id: string | null
          home_id: string | null
          id: string
          item_name: string
          notes: string | null
          provider: string | null
          room: string | null
          updated_at: string | null
          warranty_end_date: string | null
          warranty_start_date: string | null
        }
        Insert: {
          created_at?: string | null
          family_account_id?: string | null
          home_id?: string | null
          id?: string
          item_name: string
          notes?: string | null
          provider?: string | null
          room?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Update: {
          created_at?: string | null
          family_account_id?: string | null
          home_id?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          provider?: string | null
          room?: string | null
          updated_at?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranties_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      home_calendar_events_with_tasks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          home_id: string | null
          home_name: string | null
          home_task_id: string | null
          id: string | null
          is_active: boolean | null
          is_recurring: boolean | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          start_time: string | null
          status: string | null
          subcategory: string | null
          task_description: string | null
          task_id: string | null
          task_title: string | null
          task_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_home_task_id_fkey"
            columns: ["home_task_id"]
            isOneToOne: false
            referencedRelation: "home_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_family_invitation: {
        Args: { invitation_token: string }
        Returns: boolean
      }
      cleanup_expired_invitations: { Args: never; Returns: number }
      cleanup_orphaned_calendar_events: { Args: never; Returns: number }
      create_family_account: { Args: { account_name: string }; Returns: string }
      generate_recurring_calendar_events: {
        Args: {
          p_home_task_id: string
          p_recurrence_end_date?: string
          p_recurrence_pattern: string
          p_start_date: string
        }
        Returns: undefined
      }
      invite_family_member: { Args: { invitee_email: string }; Returns: string }
      remove_family_member: {
        Args: { member_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
