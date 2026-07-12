// This script tests the Supabase auth flow directly to diagnose the login issue.
// It uses the Supabase JS client to test signup and login.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required.");
  console.error("Set them before running: SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx node test_auth.js");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testEmail = `test_${Date.now()}@birthdaykeepsake-test.com`;
const testPassword = "TestPassword123!";
const testName = "Test User";

async function testAuthFlow() {
  console.log("=== Supabase Auth Flow Diagnostic ===\n");

  // Step 1: Check if there's an existing session
  console.log("1. Checking for existing session...");
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("   Session:", sessionData.session ? "EXISTS" : "NONE");
  console.log("");

  // Step 2: Sign up
  console.log("2. Signing up...");
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  const signupResult = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        name: testName,
      },
    },
  });

  console.log("\n   Signup response:");
  console.log("   - data.session:", signupResult.data.session ? "EXISTS (auto-logged in)" : "NULL (email confirmation required)");
  console.log("   - data.user:", signupResult.data.user ? "EXISTS" : "NULL");
  console.log("   - data.user?.email:", signupResult.data.user?.email || "N/A");
  console.log("   - data.user?.email_confirmed_at:", signupResult.data.user?.email_confirmed_at || "NULL (NOT CONFIRMED)");
  console.log("   - data.user?.identities:", signupResult.data.user?.identities?.length || 0);
  console.log("   - data.user?.identities?.length:", signupResult.data.user?.identities?.length);
  console.log("   - error:", signupResult.error?.message || "NONE");
  console.log("");

  // Step 3: Check if email confirmation is required
  if (!signupResult.data.session) {
    console.log("   DIAGNOSIS: Email confirmation is ENABLED in Supabase.");
    console.log("   The user was created but cannot log in until they confirm their email.");
    console.log("   This is the root cause of 'Invalid email or password' errors.");
    console.log("");

    // Step 4: Try to sign in anyway (will fail for unconfirmed users)
    console.log("3. Attempting to sign in with unconfirmed account...");
    const loginResult = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    console.log("   Login error:", loginResult.error?.message || "NONE");
    console.log("   Login error code:", loginResult.error?.code || "N/A");
    console.log("");
  } else {
    console.log("   DIAGNOSIS: Email confirmation is DISABLED. User was auto-confirmed.");
    console.log("   Let's try signing out and signing back in...");
    console.log("");

    // Step 4: Sign out
    console.log("3. Signing out...");
    const signOutResult = await supabase.auth.signOut();
    console.log("   Sign out error:", signOutResult.error?.message || "NONE");
    console.log("");

    // Step 5: Sign back in
    console.log("4. Signing back in...");
    const loginResult = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    console.log("   Login error:", loginResult.error?.message || "NONE");
    console.log("   Login session:", loginResult.data.session ? "EXISTS" : "NULL");
    console.log("");
  }

  // Step 6: Check Supabase Auth settings
  console.log("5. Fetching current user to inspect metadata...");
  const { data: userData } = await supabase.auth.getUser();
  console.log("   Current user:", userData.user?.email || "NONE");
  console.log("   Email confirmed:", userData.user?.email_confirmed_at ? "YES" : "NO");
  console.log("");

  console.log("=== Summary ===");
  console.log("If signup returned data.user but NO data.session:");
  console.log("  → Supabase requires email confirmation before login is allowed.");
  console.log("  → Fix: Disable 'Confirm email' in Supabase Dashboard > Authentication > Providers > Email");
  console.log("     OR set 'enable_signup' and 'enable_email_confirmations' appropriately.");
  console.log("");
  console.log("If signup returned both data.user AND data.session:");
  console.log("  → Email confirmation is disabled. The issue is elsewhere.");
  console.log("");
}

testAuthFlow().catch(console.error);
