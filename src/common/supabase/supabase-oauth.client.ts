import { createClient } from '@supabase/supabase-js';

export const createSupabaseOAuthClient = (supabaseUrl: string, supabaseAnonKey: string) =>
  createClient(supabaseUrl, supabaseAnonKey);
