export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      coach_connect_submissions: {
        Row: {
          id: string
          user_id: string
          had_coach_before: boolean | null
          support_needed: string | null
          life_stage: string | null
          coach_gender_preference: string | null
          coach_language_preference: string | null
          coaching_style_preference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          had_coach_before?: boolean | null
          support_needed?: string | null
          life_stage?: string | null
          coach_gender_preference?: string | null
          coach_language_preference?: string | null
          coaching_style_preference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          had_coach_before?: boolean | null
          support_needed?: string | null
          life_stage?: string | null
          coach_gender_preference?: string | null
          coach_language_preference?: string | null
          coaching_style_preference?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_connect_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_base_chunks: {
        Row: {
          chunk_text: string
          created_at: string
          embedding: string | null
          id: string
          source_document_name: string | null
          subtopic_id: string | null
          topic_id: string
        }
        Insert: {
          chunk_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_document_name?: string | null
          subtopic_id?: string | null
          topic_id: string
        }
        Update: {
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_document_name?: string | null
          subtopic_id?: string | null
          topic_id?: string
        }
        Relationships: []
      }
      point_logs: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          reason_code: string
          reason_message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded: number
          reason_code: string
          reason_message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          reason_code?: string
          reason_message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          full_name: string | null
          id: string
          points: number
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          full_name?: string | null
          id: string
          points?: number
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          full_name?: string | null
          id?: string
          points?: number
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          id: string
          points_awarded: number
          questions_answered: number | null
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          total_questions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          points_awarded?: number
          questions_answered?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: string
          total_questions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          points_awarded?: number
          questions_answered?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: string
          total_questions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_text: string
          question_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          option_text: string
          question_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          media_position: string | null
          order_num: number
          points: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          media_position?: string | null
          order_num: number
          points?: number
          question_text: string
          question_type?: string
          quiz_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          media_position?: string | null
          order_num?: number
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          card_image_url: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          subtopic_id: string | null
          title: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          card_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          subtopic_id?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          card_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          subtopic_id?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          target_date: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: { user_id_input: string; points_to_add: number }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_user_points: {
        Args: { user_id_param: string; points_to_add: number }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_knowledge_chunks: {
        Args: {
          query_embedding: string
          match_topic_id: string
          match_subtopic_id?: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          chunk_text: string
          topic_id: string
          subtopic_id: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
  public: {
    Enums: {},
  },
} as const