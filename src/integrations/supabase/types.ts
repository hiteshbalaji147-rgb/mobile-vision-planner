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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          points_required: number
        }
        Insert: {
          badge_type: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points_required?: number
        }
        Update: {
          badge_type?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          banner_url: string | null
          category: Database["public"]["Enums"]["club_category"]
          created_at: string
          created_by: string | null
          description: string | null
          faculty_coordinator: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category: Database["public"]["Enums"]["club_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          faculty_coordinator?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: Database["public"]["Enums"]["club_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          faculty_coordinator?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean | null
          checked_in_at: string | null
          event_id: string
          id: string
          payment_status: string | null
          qr_code: string | null
          registered_at: string
          ticket_price: number | null
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          checked_in_at?: string | null
          event_id: string
          id?: string
          payment_status?: string | null
          qr_code?: string | null
          registered_at?: string
          ticket_price?: number | null
          user_id: string
        }
        Update: {
          attended?: boolean | null
          checked_in_at?: string | null
          event_id?: string
          id?: string
          payment_status?: string | null
          qr_code?: string | null
          registered_at?: string
          ticket_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          max_capacity: number | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          banner_url?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          max_capacity?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          banner_url?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          max_capacity?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          club_id: string
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          media_type: string
          media_url: string
          title: string | null
          uploaded_by: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          media_type: string
          media_url: string
          title?: string | null
          uploaded_by: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          media_type?: string
          media_url?: string
          title?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          related_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          activity_id: string | null
          activity_type: string
          created_at: string
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          activity_id?: string | null
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: {
          _activity_id: string
          _activity_type: string
          _description: string
          _points: number
          _user_id: string
        }
        Returns: undefined
      }
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          achievements_earned: number
          avatar_url: string
          clubs_joined: number
          events_attended: number
          full_name: string
          id: string
          total_points: number
        }[]
      }
      get_user_total_points: {
        Args: { _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_leader: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "club_leader" | "admin"
      club_category:
        | "cultural"
        | "technical"
        | "sports"
        | "academic"
        | "social"
        | "other"
      event_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      membership_status: "pending" | "active" | "rejected"
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
  public: {
    Enums: {
      app_role: ["student", "club_leader", "admin"],
      club_category: [
        "cultural",
        "technical",
        "sports",
        "academic",
        "social",
        "other",
      ],
      event_status: ["upcoming", "ongoing", "completed", "cancelled"],
      membership_status: ["pending", "active", "rejected"],
    },
  },
} as const
