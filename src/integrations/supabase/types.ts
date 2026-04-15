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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_files: {
        Row: {
          analysis_id: string
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_files_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "feedback_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_attention_flags: {
        Row: {
          collaborator_id: string
          created_at: string
          description: string
          flag_date: string
          id: string
          resolution_notes: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          description: string
          flag_date?: string
          id?: string
          resolution_notes?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          description?: string
          flag_date?: string
          id?: string
          resolution_notes?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_attention_flags_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_profiles: {
        Row: {
          collaborator_id: string
          communication_level: number | null
          created_at: string
          id: string
          main_difficulties: string[] | null
          technical_level: number | null
          updated_at: string
          work_days: string[] | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          collaborator_id: string
          communication_level?: number | null
          created_at?: string
          id?: string
          main_difficulties?: string[] | null
          technical_level?: number | null
          updated_at?: string
          work_days?: string[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          collaborator_id?: string
          communication_level?: number | null
          created_at?: string
          id?: string
          main_difficulties?: string[] | null
          technical_level?: number | null
          updated_at?: string
          work_days?: string[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_profiles_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: true
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_warnings: {
        Row: {
          collaborator_id: string
          created_at: string
          created_by: string | null
          details: string | null
          id: string
          reason: string
          type: string
          warning_date: string
        }
        Insert: {
          collaborator_id: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          reason: string
          type: string
          warning_date?: string
        }
        Update: {
          collaborator_id?: string
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: string
          reason?: string
          type?: string
          warning_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_warnings_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_plans: {
        Row: {
          category: string
          collaborator_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          collaborator_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          collaborator_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_analyses: {
        Row: {
          analysis_date: string
          client_sentiment_end: string | null
          client_sentiment_start: string | null
          collaborator_id: string
          complaints_count: number | null
          created_at: string
          efficiency_conclusion: string | null
          engagement_level: string | null
          feedback: string | null
          id: string
          improvements: string[] | null
          insights: string[] | null
          instance_code_requested: boolean | null
          patterns: string[] | null
          processes_executed: string[] | null
          questions_count: number | null
          resolution_status: string | null
          robotic_communication: boolean | null
          robotic_communication_details: string | null
          strengths: string[] | null
          summary: string | null
          tone_attendant: string | null
          tone_client: string | null
          top_phrases: string[] | null
          transfer_detected: boolean | null
          transfer_reason: string | null
          week_start: string
        }
        Insert: {
          analysis_date?: string
          client_sentiment_end?: string | null
          client_sentiment_start?: string | null
          collaborator_id: string
          complaints_count?: number | null
          created_at?: string
          efficiency_conclusion?: string | null
          engagement_level?: string | null
          feedback?: string | null
          id?: string
          improvements?: string[] | null
          insights?: string[] | null
          instance_code_requested?: boolean | null
          patterns?: string[] | null
          processes_executed?: string[] | null
          questions_count?: number | null
          resolution_status?: string | null
          robotic_communication?: boolean | null
          robotic_communication_details?: string | null
          strengths?: string[] | null
          summary?: string | null
          tone_attendant?: string | null
          tone_client?: string | null
          top_phrases?: string[] | null
          transfer_detected?: boolean | null
          transfer_reason?: string | null
          week_start: string
        }
        Update: {
          analysis_date?: string
          client_sentiment_end?: string | null
          client_sentiment_start?: string | null
          collaborator_id?: string
          complaints_count?: number | null
          created_at?: string
          efficiency_conclusion?: string | null
          engagement_level?: string | null
          feedback?: string | null
          id?: string
          improvements?: string[] | null
          insights?: string[] | null
          instance_code_requested?: boolean | null
          patterns?: string[] | null
          processes_executed?: string[] | null
          questions_count?: number | null
          resolution_status?: string | null
          robotic_communication?: boolean | null
          robotic_communication_details?: string | null
          strengths?: string[] | null
          summary?: string | null
          tone_attendant?: string | null
          tone_client?: string | null
          top_phrases?: string[] | null
          transfer_detected?: boolean | null
          transfer_reason?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_analyses_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_feedbacks: {
        Row: {
          category: string | null
          collaborator_id: string
          created_at: string
          feedback_date: string
          id: string
          observations: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          collaborator_id: string
          created_at?: string
          feedback_date?: string
          id?: string
          observations?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          collaborator_id?: string
          created_at?: string
          feedback_date?: string
          id?: string
          observations?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_feedbacks_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_imports: {
        Row: {
          id: string
          imported_by: string
          filename: string
          imported_at: string
          tickets: Json
          ticket_count: number
          is_active: boolean
        }
        Insert: {
          id?: string
          imported_by: string
          filename: string
          imported_at?: string
          tickets: Json
          ticket_count?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          imported_by?: string
          filename?: string
          imported_at?: string
          tickets?: Json
          ticket_count?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ticket_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limit_logs: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
    },
  },
} as const
