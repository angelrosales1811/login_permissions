export interface SupabaseOAuthUser {
  id: string;

  email?: string;

  email_confirmed_at?: string;

  user_metadata?: {
    full_name?: string;

    avatar_url?: string;

    email?: string;
  };
}
