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
            email_log: {
                Row: {
                    attempts: number;
                    created_at: string;
                    id: string;
                    idempotency_key: string;
                    last_error: string | null;
                    registration_id: string;
                    requested_by: string | null;
                    resend_message_id: string | null;
                    sent_at: string | null;
                    status: Database["public"]["Enums"]["email_status"];
                    template: Database["public"]["Enums"]["email_template"];
                    to_address: string;
                    trigger: Database["public"]["Enums"]["email_trigger"];
                    updated_at: string;
                };
                Insert: {
                    attempts?: number;
                    created_at?: string;
                    id?: string;
                    idempotency_key: string;
                    last_error?: string | null;
                    registration_id: string;
                    requested_by?: string | null;
                    resend_message_id?: string | null;
                    sent_at?: string | null;
                    status?: Database["public"]["Enums"]["email_status"];
                    template: Database["public"]["Enums"]["email_template"];
                    to_address: string;
                    trigger: Database["public"]["Enums"]["email_trigger"];
                    updated_at?: string;
                };
                Update: {
                    attempts?: number;
                    created_at?: string;
                    id?: string;
                    idempotency_key?: string;
                    last_error?: string | null;
                    registration_id?: string;
                    requested_by?: string | null;
                    resend_message_id?: string | null;
                    sent_at?: string | null;
                    status?: Database["public"]["Enums"]["email_status"];
                    template?: Database["public"]["Enums"]["email_template"];
                    to_address?: string;
                    trigger?: Database["public"]["Enums"]["email_trigger"];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "email_log_registration_id_fkey";
                        columns: ["registration_id"];
                        isOneToOne: false;
                        referencedRelation: "registrations";
                        referencedColumns: ["id"];
                    },
                ];
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
            registration_audit_log: {
                Row: {
                    action: Database["public"]["Enums"]["audit_action"];
                    actor: Database["public"]["Enums"]["audit_actor"];
                    actor_user_id: string | null;
                    after: NonNullable<Json>;
                    before: NonNullable<Json>;
                    created_at: string;
                    from_status:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                    id: number;
                    registration_id: string;
                    stripe_event_id: string | null;
                    to_status:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                };
                Insert: {
                    action: Database["public"]["Enums"]["audit_action"];
                    actor: Database["public"]["Enums"]["audit_actor"];
                    actor_user_id?: string | null;
                    after?: NonNullable<Json>;
                    before?: NonNullable<Json>;
                    created_at?: string;
                    from_status?:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                    id?: never;
                    registration_id: string;
                    stripe_event_id?: string | null;
                    to_status?:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                };
                Update: {
                    action?: Database["public"]["Enums"]["audit_action"];
                    actor?: Database["public"]["Enums"]["audit_actor"];
                    actor_user_id?: string | null;
                    after?: NonNullable<Json>;
                    before?: NonNullable<Json>;
                    created_at?: string;
                    from_status?:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                    id?: never;
                    registration_id?: string;
                    stripe_event_id?: string | null;
                    to_status?:
                        | Database["public"]["Enums"]["registration_status"]
                        | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "registration_audit_log_registration_id_fkey";
                        columns: ["registration_id"];
                        isOneToOne: false;
                        referencedRelation: "registrations";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "registration_audit_log_stripe_event_id_fkey";
                        columns: ["stripe_event_id"];
                        isOneToOne: false;
                        referencedRelation: "stripe_events";
                        referencedColumns: ["id"];
                    },
                ];
            };
            registration_private_details: {
                Row: {
                    access_requirements: string | null;
                    created_at: string;
                    dietary: Database["public"]["Enums"]["dietary_requirement"][];
                    dietary_details: string | null;
                    registration_id: string;
                    updated_at: string;
                };
                Insert: {
                    access_requirements?: string | null;
                    created_at?: string;
                    dietary: Database["public"]["Enums"]["dietary_requirement"][];
                    dietary_details?: string | null;
                    registration_id: string;
                    updated_at?: string;
                };
                Update: {
                    access_requirements?: string | null;
                    created_at?: string;
                    dietary?: Database["public"]["Enums"]["dietary_requirement"][];
                    dietary_details?: string | null;
                    registration_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "registration_private_details_registration_id_fkey";
                        columns: ["registration_id"];
                        isOneToOne: true;
                        referencedRelation: "registrations";
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
            registrations: {
                Row: {
                    amount_paid_cents: number | null;
                    audience: Database["public"]["Enums"]["audience"];
                    cancelled_at: string | null;
                    checkout_expires_at: string;
                    connection_to_gestalt:
                        | Database["public"]["Enums"]["gestalt_connection"]
                        | null;
                    created_at: string;
                    currency: string;
                    email: string;
                    full_name: string;
                    heard_about:
                        Database["public"]["Enums"]["heard_about"] | null;
                    id: string;
                    membership_choice: Database["public"]["Enums"]["membership_choice"];
                    membership_decided_at: string | null;
                    membership_decided_by: string | null;
                    membership_email: string | null;
                    membership_name: string | null;
                    paid_at: string | null;
                    phone: string | null;
                    policy_accepted_at: string;
                    policy_text_sha256: string;
                    policy_version: string;
                    price_cents: number;
                    pronouns: string | null;
                    public_ref: string;
                    refunded_amount_cents: number;
                    refunded_at: string | null;
                    status: Database["public"]["Enums"]["registration_status"];
                    stripe_checkout_session_id: string | null;
                    stripe_payment_intent_id: string | null;
                    ticket_option: Database["public"]["Enums"]["ticket_option"];
                    tier: Database["public"]["Enums"]["price_tier"];
                    updated_at: string;
                };
                Insert: {
                    amount_paid_cents?: number | null;
                    audience?: never;
                    cancelled_at?: string | null;
                    checkout_expires_at: string;
                    connection_to_gestalt?:
                        | Database["public"]["Enums"]["gestalt_connection"]
                        | null;
                    created_at?: string;
                    currency?: string;
                    email: string;
                    full_name: string;
                    heard_about?:
                        Database["public"]["Enums"]["heard_about"] | null;
                    id?: string;
                    membership_choice: Database["public"]["Enums"]["membership_choice"];
                    membership_decided_at?: string | null;
                    membership_decided_by?: string | null;
                    membership_email?: string | null;
                    membership_name?: string | null;
                    paid_at?: string | null;
                    phone?: string | null;
                    policy_accepted_at?: string;
                    policy_text_sha256: string;
                    policy_version: string;
                    price_cents: number;
                    pronouns?: string | null;
                    public_ref?: string;
                    refunded_amount_cents?: number;
                    refunded_at?: string | null;
                    status?: Database["public"]["Enums"]["registration_status"];
                    stripe_checkout_session_id?: string | null;
                    stripe_payment_intent_id?: string | null;
                    ticket_option: Database["public"]["Enums"]["ticket_option"];
                    tier: Database["public"]["Enums"]["price_tier"];
                    updated_at?: string;
                };
                Update: {
                    amount_paid_cents?: number | null;
                    audience?: never;
                    cancelled_at?: string | null;
                    checkout_expires_at?: string;
                    connection_to_gestalt?:
                        | Database["public"]["Enums"]["gestalt_connection"]
                        | null;
                    created_at?: string;
                    currency?: string;
                    email?: string;
                    full_name?: string;
                    heard_about?:
                        Database["public"]["Enums"]["heard_about"] | null;
                    id?: string;
                    membership_choice?: Database["public"]["Enums"]["membership_choice"];
                    membership_decided_at?: string | null;
                    membership_decided_by?: string | null;
                    membership_email?: string | null;
                    membership_name?: string | null;
                    paid_at?: string | null;
                    phone?: string | null;
                    policy_accepted_at?: string;
                    policy_text_sha256?: string;
                    policy_version?: string;
                    price_cents?: number;
                    pronouns?: string | null;
                    public_ref?: string;
                    refunded_amount_cents?: number;
                    refunded_at?: string | null;
                    status?: Database["public"]["Enums"]["registration_status"];
                    stripe_checkout_session_id?: string | null;
                    stripe_payment_intent_id?: string | null;
                    ticket_option?: Database["public"]["Enums"]["ticket_option"];
                    tier?: Database["public"]["Enums"]["price_tier"];
                    updated_at?: string;
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
            stripe_events: {
                Row: {
                    attempts: number;
                    detail: string | null;
                    id: string;
                    livemode: boolean;
                    object_id: string | null;
                    outcome: Database["public"]["Enums"]["stripe_event_outcome"];
                    processed_at: string | null;
                    received_at: string;
                    registration_id: string | null;
                    stripe_created_at: string;
                    type: string;
                };
                Insert: {
                    attempts?: number;
                    detail?: string | null;
                    id: string;
                    livemode: boolean;
                    object_id?: string | null;
                    outcome: Database["public"]["Enums"]["stripe_event_outcome"];
                    processed_at?: string | null;
                    received_at?: string;
                    registration_id?: string | null;
                    stripe_created_at: string;
                    type: string;
                };
                Update: {
                    attempts?: number;
                    detail?: string | null;
                    id?: string;
                    livemode?: boolean;
                    object_id?: string | null;
                    outcome?: Database["public"]["Enums"]["stripe_event_outcome"];
                    processed_at?: string | null;
                    received_at?: string;
                    registration_id?: string | null;
                    stripe_created_at?: string;
                    type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "stripe_events_registration_id_fkey";
                        columns: ["registration_id"];
                        isOneToOne: false;
                        referencedRelation: "registrations";
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
            array_is_distinct: { Args: { values_: unknown }; Returns: boolean };
            audience_for: {
                Args: {
                    choice: Database["public"]["Enums"]["membership_choice"];
                };
                Returns: Database["public"]["Enums"]["audience"];
            };
            create_pending_registration: {
                Args: {
                    p_access_requirements?: string;
                    p_connection_to_gestalt?: Database["public"]["Enums"]["gestalt_connection"];
                    p_dietary: Database["public"]["Enums"]["dietary_requirement"][];
                    p_dietary_details?: string;
                    p_email: string;
                    p_full_name: string;
                    p_heard_about?: Database["public"]["Enums"]["heard_about"];
                    p_membership_choice: Database["public"]["Enums"]["membership_choice"];
                    p_membership_email?: string;
                    p_membership_name?: string;
                    p_phone?: string;
                    p_policy_text_sha256: string;
                    p_policy_version: string;
                    p_pronouns?: string;
                    p_quoted_tier: Database["public"]["Enums"]["price_tier"];
                    p_ticket_option: Database["public"]["Enums"]["ticket_option"];
                };
                Returns: {
                    checkout_expires_at: string;
                    price_cents: number;
                    public_ref: string;
                    registration_id: string;
                    tier: Database["public"]["Enums"]["price_tier"];
                }[];
            };
            is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
            registration_holds_place: {
                Args: {
                    checkout_expires_at: string;
                    status: Database["public"]["Enums"]["registration_status"];
                };
                Returns: boolean;
            };
            workshop_places_left: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
        };
        Enums: {
            audience: "member" | "non_member";
            audit_action:
                | "registration_created"
                | "payment_received"
                | "checkout_abandoned"
                | "membership_approved"
                | "membership_rejected"
                | "refund_recorded"
                | "partial_refund_recorded"
                | "registration_cancelled"
                | "attendee_details_corrected";
            audit_actor: "admin" | "system" | "stripe_webhook";
            dietary_requirement:
                "none" | "vegetarian" | "vegan" | "gluten_free" | "other";
            email_status: "queued" | "sent" | "failed";
            email_template:
                | "non_member_confirmation"
                | "member_payment_received"
                | "membership_approved"
                | "membership_not_verified"
                | "refund_processed"
                | "admin_new_registration_alert";
            email_trigger: "automatic" | "manual";
            gestalt_connection:
                | "gestalt_practitioner"
                | "gestalt_student"
                | "educator_supervisor"
                | "researcher_academic"
                | "interested_not_practising"
                | "other_mental_health_professional"
                | "other";
            heard_about:
                | "ganz_newsletter"
                | "social_media"
                | "colleague_friend"
                | "training_institute"
                | "other";
            membership_choice:
                "current_member" | "joining_member" | "non_member";
            price_tier: "early_bird" | "full";
            registration_status:
                | "pending_payment"
                | "confirmed"
                | "awaiting_verification"
                | "approved"
                | "rejected"
                | "refunded"
                | "abandoned"
                | "cancelled";
            stripe_event_outcome:
                "processed" | "ignored" | "needs_review" | "error";
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
            audit_action: [
                "registration_created",
                "payment_received",
                "checkout_abandoned",
                "membership_approved",
                "membership_rejected",
                "refund_recorded",
                "partial_refund_recorded",
                "registration_cancelled",
                "attendee_details_corrected",
            ],
            audit_actor: ["admin", "system", "stripe_webhook"],
            dietary_requirement: [
                "none",
                "vegetarian",
                "vegan",
                "gluten_free",
                "other",
            ],
            email_status: ["queued", "sent", "failed"],
            email_template: [
                "non_member_confirmation",
                "member_payment_received",
                "membership_approved",
                "membership_not_verified",
                "refund_processed",
                "admin_new_registration_alert",
            ],
            email_trigger: ["automatic", "manual"],
            gestalt_connection: [
                "gestalt_practitioner",
                "gestalt_student",
                "educator_supervisor",
                "researcher_academic",
                "interested_not_practising",
                "other_mental_health_professional",
                "other",
            ],
            heard_about: [
                "ganz_newsletter",
                "social_media",
                "colleague_friend",
                "training_institute",
                "other",
            ],
            membership_choice: [
                "current_member",
                "joining_member",
                "non_member",
            ],
            price_tier: ["early_bird", "full"],
            registration_status: [
                "pending_payment",
                "confirmed",
                "awaiting_verification",
                "approved",
                "rejected",
                "refunded",
                "abandoned",
                "cancelled",
            ],
            stripe_event_outcome: [
                "processed",
                "ignored",
                "needs_review",
                "error",
            ],
            ticket_option: ["conference_only", "conference_workshop"],
        },
    },
} as const;
