import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  googleOAuthRedirect: process.env.GOOGLE_OAUTH_REDIRECT,

  frontendCallbackUrl: process.env.FRONTEND_CALLBACK_URL,
  googleProvider: process.env.GOOGLE_PROVIDER,
}));
