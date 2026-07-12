export const ENV = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "local-anon-key",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "local-service-role-key",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "birthday-keepsake",
  ownerEmail: process.env.OWNER_EMAIL || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Birthday Keepsake <onboarding@resend.dev>",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || "",
} as const;

export function validateRuntimeEnv() {
  // Log environment variable status for debugging
  // On Vercel, env vars are set at deploy time and available in process.env
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseAnon = !!process.env.SUPABASE_ANON_KEY;
  const hasSupabaseServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.NODE_ENV === 'development') {
    // In local development, check that Supabase is configured
    if (!hasSupabaseUrl || !hasSupabaseAnon || !hasSupabaseServiceRole) {
      const missing: string[] = [];
      if (!hasSupabaseUrl) missing.push('SUPABASE_URL');
      if (!hasSupabaseAnon) missing.push('SUPABASE_ANON_KEY');
      if (!hasSupabaseServiceRole) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      console.error(`[ENV] Missing required environment variables for development: ${missing.join(", ")}`);
      console.error('[ENV] Please create a .env file based on .env.example');
      console.error('[ENV] Server will start but Supabase operations will fail');
    }
  }
  // On Vercel (production), env vars are set by the platform.
  // If they're missing, requests will fail gracefully rather than crashing the function.
  console.log(`[ENV] Supabase URL configured: ${hasSupabaseUrl}, Anon: ${hasSupabaseAnon}, Service Role: ${hasSupabaseServiceRole}`);
}
