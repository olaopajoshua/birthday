# Auth Troubleshooting Guide

## Root Cause: Email Confirmation Required

The issue where new users can sign up but cannot log in is caused by **Supabase email confirmation being enabled**.

When email confirmation is enabled in Supabase, `auth.signUp()` creates the user but returns `data.session = null`. The user is stored in Supabase Authentication > Users, but they **cannot** sign in with `signInWithPassword()` until they confirm their email.

Supabase intentionally returns "Invalid login credentials" for unconfirmed emails (this is a security feature — it does not reveal whether the email exists or not).

---

## How to Fix in Supabase Dashboard

### Option A: Disable Email Confirmation (Recommended for this app)

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click on **Email** (under "Password-based" or "Email" section)
3. **Disable** "Enable email confirmations" (toggle off)
4. Click **Save**

This allows users to sign up and immediately sign in without needing to click a confirmation email.

### Option B: Keep Email Confirmation Enabled

If you want to keep email confirmation for security, the fix is already in the code:

- The Signup page now detects when confirmation is required (`data.session === null`)
- It shows a "Verify your email" page with a resend option
- The Login page shows a helpful hint about checking email for confirmation
- Users must click the confirmation link in their email before they can sign in

---

## Supabase Client Configuration (Updated)

The Supabase client now has explicit auth configuration for session persistence:

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

This ensures:
- Sessions persist in `localStorage` across page refreshes
- Tokens are automatically refreshed before expiry
- OAuth callback tokens are detected from the URL
- Sessions survive browser restarts

---

## Verification Checklist

After applying the fix, verify these flows work:

| Flow | Expected Result |
|---|---|
| Signup with email confirmation disabled | Account created, auto-logged in, redirect to `/dashboard` |
| Signup with email confirmation enabled | Account created, verification prompt shown, must confirm email |
| Login with confirmed account | Signs in successfully, redirect to `/dashboard` |
| Login with unconfirmed account | Shows helpful hint about email confirmation |
| Google Sign-In | Signs in via OAuth, redirect to `/dashboard` |
| Logout | Signs out, redirect to `/login` |
| Protected route without session | Redirects to `/login` |
| Forgot Password | Sends reset email, allows password update via link |

---

## No Backend Changes Required

This fix is purely client-side. No changes were made to:
- Supabase project configuration (other than the optional toggle above)
- Database tables or migrations
- Server-side code
- Environment variables
- Authentication provider
