export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          updated_at: string | null
          warranty_expiration: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          manual_url?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          manual_url?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          updated_at?: string | null
          warranty_expiration?: string | null
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
          material: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          room: string | null
          style: string | null
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
          style?: string | null
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
          style?: string | null
          updated_at?: string | null
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
          id: string
          location: string | null
          start_time: string
          task_id: string | null
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
          id?: string
          location?: string | null
          start_time: string
          task_id?: string | null
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
          id?: string
          location?: string | null
          start_time?: string
          task_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
          name: string
          notes: string | null
          replacement_frequency: number | null
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
          name: string
          notes?: string | null
          replacement_frequency?: number | null
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
          name?: string
          notes?: string | null
          replacement_frequency?: number | null
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
      homes: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          square_footage: number | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          square_footage?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          square_footage?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          year_built?: number | null
          zip?: string | null
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
          name: string
          notes: string | null
          type: string | null
          updated_at: string | null
          wattage: string | null
        }
        Insert: {
          brand?: string | null
          bulb_type?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          type?: string | null
          updated_at?: string | null
          wattage?: string | null
        }
        Update: {
          brand?: string | null
          bulb_type?: string | null
          created_at?: string | null
          home_id?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          type?: string | null
          updated_at?: string | null
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
      paint_colors: {
        Row: {
          brand: string | null
          color_code: string | null
          color_hex: string | null
          created_at: string | null
          date_purchased: string | null
          home_id: string | null
          id: string
          name: string
          notes: string | null
          room: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          color_code?: string | null
          color_hex?: string | null
          created_at?: string | null
          date_purchased?: string | null
          home_id?: string | null
          id?: string
          name: string
          notes?: string | null
          room?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          color_code?: string | null
          color_hex?: string | null
          created_at?: string | null
          date_purchased?: string | null
          home_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          room?: string | null
          updated_at?: string | null
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
      tasks: {
        Row: {
          category: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          home_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          home_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          home_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
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
          full_name: string | null
          id: string
          notification_email: boolean | null
          notification_push: boolean | null
          notification_sms: boolean | null
          phone: string | null
          theme: string | null
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
          full_name?: string | null
          id: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          phone?: string | null
          theme?: string | null
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
          full_name?: string | null
          id?: string
          notification_email?: boolean | null
          notification_push?: boolean | null
          notification_sms?: boolean | null
          phone?: string | null
          theme?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
