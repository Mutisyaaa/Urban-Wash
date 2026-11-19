export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      notifications: {
        Row: {
          channel: string;
          created_at: string;
          id: number;
          is_read: boolean;
          message: string;
          order_id: number | null;
          title: string;
          user_id: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          id?: never;
          is_read?: boolean;
          message: string;
          order_id?: number | null;
          title: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: never;
          is_read?: boolean;
          message?: string;
          order_id?: number | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: number;
          line_total: number;
          order_id: number;
          quantity: number;
          service_id: number | null;
          service_name: string;
          unit_label: string;
          unit_price: number;
          variant_label: string | null;
        };
        Insert: {
          created_at?: string;
          id?: never;
          line_total: number;
          order_id: number;
          quantity: number;
          service_id?: number | null;
          service_name: string;
          unit_label?: string;
          unit_price: number;
          variant_label?: string | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          line_total?: number;
          order_id?: number;
          quantity?: number;
          service_id?: number | null;
          service_name?: string;
          unit_label?: string;
          unit_price?: number;
          variant_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: [
              "id",
            ];
          },
          {
            foreignKeyName: "order_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string;
          customer_name: string;
          customer_phone: string;
          delivered_at: string | null;
          discount_amount: number;
          id: number;
          in_cleaning_at: string | null;
          is_demo: boolean;
          mpesa_phone: string | null;
          mpesa_reference: string | null;
          order_code: string;
          out_for_delivery_at: string | null;
          payment_method: string;
          payment_status: string;
          picked_up_at: string | null;
          pickup_address: string;
          pickup_date: string;
          pickup_time_slot: string;
          placed_at: string;
          rider_id: string | null;
          special_instructions: string | null;
          status: string;
          subtotal: number;
          total_amount: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          delivered_at?: string | null;
          discount_amount?: number;
          id?: never;
          in_cleaning_at?: string | null;
          is_demo?: boolean;
          mpesa_phone?: string | null;
          mpesa_reference?: string | null;
          order_code?: string;
          out_for_delivery_at?: string | null;
          payment_method?: string;
          payment_status?: string;
          picked_up_at?: string | null;
          pickup_address: string;
          pickup_date: string;
          pickup_time_slot?: string;
          placed_at?: string;
          rider_id?: string | null;
          special_instructions?: string | null;
          status?: string;
          subtotal: number;
          total_amount: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          delivered_at?: string | null;
          discount_amount?: number;
          id?: never;
          in_cleaning_at?: string | null;
          is_demo?: boolean;
          mpesa_phone?: string | null;
          mpesa_reference?: string | null;
          order_code?: string;
          out_for_delivery_at?: string | null;
          payment_method?: string;
          payment_status?: string;
          picked_up_at?: string | null;
          pickup_address?: string;
          pickup_date?: string;
          pickup_time_slot?: string;
          placed_at?: string;
          rider_id?: string | null;
          special_instructions?: string | null;
          status?: string;
          subtotal?: number;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_rider_id_fkey";
            columns: ["rider_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_address: string | null;
          email: string;
          email_notifications: boolean;
          full_name: string;
          id: string;
          phone: string | null;
          role: string;
          sms_notifications: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_address?: string | null;
          email?: string;
          email_notifications?: boolean;
          full_name?: string;
          id: string;
          phone?: string | null;
          role?: string;
          sms_notifications?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          default_address?: string | null;
          email?: string;
          email_notifications?: boolean;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: string;
          sms_notifications?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          bulk_threshold: number | null;
          bulk_unit_price: number | null;
          created_at: string;
          description: string;
          icon_key: string;
          id: number;
          is_active: boolean;
          name: string;
          price_label: string;
          pricing_unit: string;
          slug: string;
          sort_order: number;
          subtitle: string;
          unit_price: number;
        };
        Insert: {
          bulk_threshold?: number | null;
          bulk_unit_price?: number | null;
          created_at?: string;
          description: string;
          icon_key: string;
          id?: never;
          is_active?: boolean;
          name: string;
          price_label: string;
          pricing_unit: string;
          slug: string;
          sort_order?: number;
          subtitle: string;
          unit_price: number;
        };
        Update: {
          bulk_threshold?: number | null;
          bulk_unit_price?: number | null;
          created_at?: string;
          description?: string;
          icon_key?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          price_label?: string;
          pricing_unit?: string;
          slug?: string;
          sort_order?: number;
          subtitle?: string;
          unit_price?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_order: {
        Args: {
          p_add_stain_removal?: boolean;
          p_customer_name?: string;
          p_customer_phone?: string;
          p_duvet_size?: string;
          p_mpesa_phone?: string;
          p_mpesa_reference?: string;
          p_payment_method?: string;
          p_pickup_address?: string;
          p_pickup_date?: string;
          p_pickup_time_slot?: string;
          p_quantity: number;
          p_service_slug: string;
          p_special_instructions?: string;
        };
        Returns: Json;
      };
      track_order_by_code: {
        Args: { p_order_code: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
