export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
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
    public: {
        Tables: {
            cms_edits: {
                Row: {
                    after: NonNullable<Json>;
                    before: NonNullable<Json>;
                    created_at: string;
                    id: string;
                    label: string;
                    reverted_at: string | null;
                    row_id: string;
                    table_name: string;
                    user_id: string;
                };
                Insert: {
                    after: NonNullable<Json>;
                    before: NonNullable<Json>;
                    created_at?: string;
                    id?: string;
                    label?: string;
                    reverted_at?: string | null;
                    row_id: string;
                    table_name: string;
                    user_id?: string;
                };
                Update: {
                    after?: NonNullable<Json>;
                    before?: NonNullable<Json>;
                    created_at?: string;
                    id?: string;
                    label?: string;
                    reverted_at?: string | null;
                    row_id?: string;
                    table_name?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            files: {
                Row: {
                    created_at: string;
                    file_ref: string;
                    folder: string;
                    id: string;
                    mime_type: string;
                    name: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    file_ref: string;
                    folder?: string;
                    id?: string;
                    mime_type: string;
                    name: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    file_ref?: string;
                    folder?: string;
                    id?: string;
                    mime_type?: string;
                    name?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            people: {
                Row: {
                    description: string | null;
                    id: string;
                    image: string | null;
                    link: string | null;
                    location: string | null;
                    name: string;
                    section_id: string;
                    sort_order: number;
                    style: string;
                    title: string | null;
                    updated_at: string;
                };
                Insert: {
                    description?: string | null;
                    id?: string;
                    image?: string | null;
                    link?: string | null;
                    location?: string | null;
                    name: string;
                    section_id: string;
                    sort_order?: number;
                    style?: string;
                    title?: string | null;
                    updated_at?: string;
                };
                Update: {
                    description?: string | null;
                    id?: string;
                    image?: string | null;
                    link?: string | null;
                    location?: string | null;
                    name?: string;
                    section_id?: string;
                    sort_order?: number;
                    style?: string;
                    title?: string | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "people_image_fkey";
                        columns: ["image"];
                        isOneToOne: false;
                        referencedRelation: "files";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "people_section_id_fkey";
                        columns: ["section_id"];
                        isOneToOne: false;
                        referencedRelation: "sections";
                        referencedColumns: ["id"];
                    },
                ];
            };
            registration_settings: {
                Row: {
                    current_tier: Database["public"]["Enums"]["price_tier"];
                    early_bird_closes_on: string | null;
                    id: boolean;
                    updated_at: string;
                    workshop_capacity: number;
                };
                Insert: {
                    current_tier?: Database["public"]["Enums"]["price_tier"];
                    early_bird_closes_on?: string | null;
                    id?: boolean;
                    updated_at?: string;
                    workshop_capacity: number;
                };
                Update: {
                    current_tier?: Database["public"]["Enums"]["price_tier"];
                    early_bird_closes_on?: string | null;
                    id?: boolean;
                    updated_at?: string;
                    workshop_capacity?: number;
                };
                Relationships: [];
            };
            sections: {
                Row: {
                    body: string | null;
                    created_at: string;
                    excerpt: string | null;
                    heading: string | null;
                    id: string;
                    image_id: string | null;
                    is_published: boolean;
                    sort_order: number;
                    subheading: string | null;
                    type: string;
                    updated_at: string;
                };
                Insert: {
                    body?: string | null;
                    created_at?: string;
                    excerpt?: string | null;
                    heading?: string | null;
                    id?: string;
                    image_id?: string | null;
                    is_published?: boolean;
                    sort_order?: number;
                    subheading?: string | null;
                    type: string;
                    updated_at?: string;
                };
                Update: {
                    body?: string | null;
                    created_at?: string;
                    excerpt?: string | null;
                    heading?: string | null;
                    id?: string;
                    image_id?: string | null;
                    is_published?: boolean;
                    sort_order?: number;
                    subheading?: string | null;
                    type?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "sections_image_id_fkey";
                        columns: ["image_id"];
                        isOneToOne: false;
                        referencedRelation: "files";
                        referencedColumns: ["id"];
                    },
                ];
            };
            stat_items: {
                Row: {
                    description: string | null;
                    id: string;
                    image: string | null;
                    label: string;
                    parent_id: string | null;
                    section_id: string;
                    sort_order: number;
                    style: string;
                    updated_at: string;
                    value: string;
                };
                Insert: {
                    description?: string | null;
                    id?: string;
                    image?: string | null;
                    label: string;
                    parent_id?: string | null;
                    section_id: string;
                    sort_order?: number;
                    style?: string;
                    updated_at?: string;
                    value: string;
                };
                Update: {
                    description?: string | null;
                    id?: string;
                    image?: string | null;
                    label?: string;
                    parent_id?: string | null;
                    section_id?: string;
                    sort_order?: number;
                    style?: string;
                    updated_at?: string;
                    value?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "stat_items_image_fkey";
                        columns: ["image"];
                        isOneToOne: false;
                        referencedRelation: "files";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "stat_items_parent_id_fkey";
                        columns: ["parent_id"];
                        isOneToOne: false;
                        referencedRelation: "stat_items";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "stat_items_section_id_fkey";
                        columns: ["section_id"];
                        isOneToOne: false;
                        referencedRelation: "sections";
                        referencedColumns: ["id"];
                    },
                ];
            };
            ticket_prices: {
                Row: {
                    amount_cents: number;
                    audience: Database["public"]["Enums"]["audience"];
                    created_at: string;
                    currency: string;
                    id: string;
                    is_active: boolean;
                    ticket_option: Database["public"]["Enums"]["ticket_option"];
                    tier: Database["public"]["Enums"]["price_tier"];
                    updated_at: string;
                };
                Insert: {
                    amount_cents: number;
                    audience: Database["public"]["Enums"]["audience"];
                    created_at?: string;
                    currency?: string;
                    id?: string;
                    is_active?: boolean;
                    ticket_option: Database["public"]["Enums"]["ticket_option"];
                    tier: Database["public"]["Enums"]["price_tier"];
                    updated_at?: string;
                };
                Update: {
                    amount_cents?: number;
                    audience?: Database["public"]["Enums"]["audience"];
                    created_at?: string;
                    currency?: string;
                    id?: string;
                    is_active?: boolean;
                    ticket_option?: Database["public"]["Enums"]["ticket_option"];
                    tier?: Database["public"]["Enums"]["price_tier"];
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
        };
        Enums: {
            audience: "member" | "non_member";
            price_tier: "early_bird" | "full";
            ticket_option: "conference_only" | "conference_workshop";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    "public"
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
            DefaultSchema["Views"])
      ? (DefaultSchema["Tables"] &
            DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema["Enums"]
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends (DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema["CompositeTypes"]
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            audience: ["member", "non_member"],
            price_tier: ["early_bird", "full"],
            ticket_option: ["conference_only", "conference_workshop"],
        },
    },
} as const;
