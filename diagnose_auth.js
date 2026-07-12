// Diagnostic script: Check Supabase Auth configuration
// This helps identify if email confirmation is blocking logins.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERROR: Set SUPABASE_URL and SUPABASE_ANON_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
  console.log("=== Supabase Auth Diagnostic ===\n");

  // Test 1: Check if email confirmation is blocking signups
  const testEmail = `diag_test_${Date.now()}@test.com`;
  const testPassword = "TestPass123!";

  console.log("Test 1: Creating a test account...");
  const signup = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  console.log(`  User created: ${!!signup.data.user}`);
  console.log(`  Session created: ${!!signup.data.session}`);
  console.log(`  Email confirmed at: ${signup.data.user?.email_confirmed_at || "NULL"}`);
  console.log(`  Error: ${signup.error?.message || "None"}`);

  if (!signup.data.session && signup.data.user) {
    console.log("\n  ROOT CAUSE CONFIRMED: Email confirmation is REQUIRED.");
    console.log("  New users are created but cannot log in until they confirm their email.");
    console.log("  signInWithPassword will return 'Invalid login credentials' for unconfirmed users.");
    
    console.log("\n  FIX OPTIONS:");
    console.log("  A) In Supabase Dashboard > Authentication > Providers > Email:");
    console.log("     - Disable 'Enable email confirmations' (recommended for this app)");
    console.log("  B) Or handle the unconfirmed state in the UI by showing a verification message.");
  } else if (signup.data.session) {
    console.log("\n  Email confirmation is DISABLED. Login should work.");
    
    // Test 2: Actually try to login
    console.log("\nTest 2: Signing out and signing back in...");
    await supabase.auth.signOut();
    
    const login = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    console.log(`  Login success: ${!!login.data.session}`);
    console.log(`  Login error: ${login.error?.message || "None"}`);
    console.log(`  Login error code: ${login.error?.code || "None"}`);
  }

  console.log("\n=== Diagnosis Complete ===");
}

diagnose().catch(console.error);
