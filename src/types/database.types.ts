/**
 * Tipagem do banco de dados (espelha supabase/migrations).
 *
 * Se preferir gerar automaticamente:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BusinessPlan = 'free' | 'pro' | 'enterprise';
export type BusinessStatus = 'active' | 'inactive' | 'suspended';
export type MemberRole = 'owner' | 'manager' | 'employee';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          cover_url: string | null;
          phone: string | null;
          address: string | null;
          description: string | null;
          plan: BusinessPlan;
          status: BusinessStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          cover_url?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          plan?: BusinessPlan;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          cover_url?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          plan?: BusinessPlan;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_members_business_id_fkey';
            columns: ['business_id'];
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_user_business_ids: { Args: Record<string, never>; Returns: string[] };
      is_business_member: { Args: { p_business_id: string }; Returns: boolean };
      has_business_role: {
        Args: { p_business_id: string; p_roles: MemberRole[] };
        Returns: boolean;
      };
      shares_business_with: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      business_plan: BusinessPlan;
      business_status: BusinessStatus;
      member_role: MemberRole;
    };
    CompositeTypes: Record<never, never>;
  };
}
