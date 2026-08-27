export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatusDb = "pending" | "preparing" | "ready" | "completed";
export type PlanIdDb = "starter" | "pro" | "enterprise";

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo: string | null;
          currency: string;
          plan: PlanIdDb;
          owner_id: string | null;
          phone: string | null;
          default_locale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo?: string | null;
          currency?: string;
          plan?: PlanIdDb;
          owner_id?: string | null;
          phone?: string | null;
          default_locale?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo?: string | null;
          currency?: string;
          plan?: PlanIdDb;
          owner_id?: string | null;
          phone?: string | null;
          default_locale?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      dishes: {
        Row: {
          id: string;
          restaurant_id: string;
          title_ar: string;
          title_fr: string;
          title_en: string;
          description: Json;
          price: number;
          category: string;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title_ar?: string;
          title_fr?: string;
          title_en?: string;
          description?: Json;
          price: number;
          category: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title_ar?: string;
          title_fr?: string;
          title_en?: string;
          description?: Json;
          price?: number;
          category?: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: string | null;
          items: Json;
          status: OrderStatusDb;
          total_amount: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_number?: string | null;
          items?: Json;
          status?: OrderStatusDb;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_number?: string | null;
          items?: Json;
          status?: OrderStatusDb;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurant_admins: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string | null;
          email: string;
          full_name: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id?: string | null;
          email: string;
          full_name?: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string | null;
          email?: string;
          full_name?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          restaurant_id: string;
          rating: number;
          comment: string | null;
          table_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          rating: number;
          comment?: string | null;
          table_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          rating?: number;
          comment?: string | null;
          table_number?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatusDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
