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
      bills: {
        Row: {
          balance_amount: number
          bill_items: Json
          bill_number: string | null
          bill_status: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          id: string
          paid_amount: number
          payment_mode: string | null
          return_amount: number | null
          tax: number | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance_amount?: number
          bill_items?: Json
          bill_number?: string | null
          bill_status?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          paid_amount?: number
          payment_mode?: string | null
          return_amount?: number | null
          tax?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance_amount?: number
          bill_items?: Json
          bill_number?: string | null
          bill_status?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          id?: string
          paid_amount?: number
          payment_mode?: string | null
          return_amount?: number | null
          tax?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_payment_history: {
        Row: {
          amount: number
          created_at: string
          entry_type: string
          id: string
          note: string | null
          pending_payment_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_type: string
          id?: string
          note?: string | null
          pending_payment_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_type?: string
          id?: string
          note?: string | null
          pending_payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_payment_history_pending_payment_id_fkey"
            columns: ["pending_payment_id"]
            isOneToOne: false
            referencedRelation: "pending_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          total_advance: number
          total_pending: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          total_advance?: number
          total_pending?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          total_advance?: number
          total_pending?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          column_number: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          item_type: string | null
          part: string | null
          price: number
          product_name: string
          quantity: number
          row_number: string | null
          section: string | null
          updated_at: string
          user_id: string | null
          warranty_available: boolean
          warranty_period: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          column_number?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          part?: string | null
          price?: number
          product_name: string
          quantity?: number
          row_number?: string | null
          section?: string | null
          updated_at?: string
          user_id?: string | null
          warranty_available?: boolean
          warranty_period?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          column_number?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          part?: string | null
          price?: number
          product_name?: string
          quantity?: number
          row_number?: string | null
          section?: string | null
          updated_at?: string
          user_id?: string | null
          warranty_available?: boolean
          warranty_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_text: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          license_end_date: string | null
          license_start_date: string | null
          license_type: string
          longitude: number | null
          max_bills_per_month: number
          max_products: number
          phone_number: string | null
          shop_name: string | null
          shop_type: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          address_text?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_end_date?: string | null
          license_start_date?: string | null
          license_type?: string
          longitude?: number | null
          max_bills_per_month?: number
          max_products?: number
          phone_number?: string | null
          shop_name?: string | null
          shop_type?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          address_text?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          license_end_date?: string | null
          license_start_date?: string | null
          license_type?: string
          longitude?: number | null
          max_bills_per_month?: number
          max_products?: number
          phone_number?: string | null
          shop_name?: string | null
          shop_type?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          payment_mode: string
          reason: string | null
          refund_amount: number
          refund_type: string
          returned_items: Json | null
          user_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          payment_mode: string
          reason?: string | null
          refund_amount?: number
          refund_type: string
          returned_items?: Json | null
          user_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          payment_mode?: string
          reason?: string | null
          refund_amount?: number
          refund_type?: string
          returned_items?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string | null
          delivery_date: string | null
          device_model: string
          estimated_cost: number
          final_cost: number
          id: string
          parts_used: string | null
          photo_url: string | null
          problem_description: string
          received_date: string
          repair_status: string
          updated_at: string
          user_id: string | null
          warranty_available: boolean
          warranty_period: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          delivery_date?: string | null
          device_model: string
          estimated_cost?: number
          final_cost?: number
          id?: string
          parts_used?: string | null
          photo_url?: string | null
          problem_description: string
          received_date?: string
          repair_status?: string
          updated_at?: string
          user_id?: string | null
          warranty_available?: boolean
          warranty_period?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_date?: string | null
          device_model?: string
          estimated_cost?: number
          final_cost?: number
          id?: string
          parts_used?: string | null
          photo_url?: string | null
          problem_description?: string
          received_date?: string
          repair_status?: string
          updated_at?: string
          user_id?: string | null
          warranty_available?: boolean
          warranty_period?: string | null
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
    Enums: {},
  },
} as const
