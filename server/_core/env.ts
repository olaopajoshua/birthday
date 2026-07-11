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
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
