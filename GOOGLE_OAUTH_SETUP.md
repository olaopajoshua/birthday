# Google OAuth Setup Guide

## Overview

Google Sign-In is now integrated into the Birthday Keepsake authentication flow. This guide documents the required configuration steps.

---

## 1. Google Cloud Console Configuration

### Create a Google Cloud Project (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**

### Create OAuth 2.0 Credentials

1. Click **Create Credentials** → **OAuth client ID**
2. Select **Web application** as the application type
3. Name it something like "Birthday Keepsake Web"

### Configure Authorized Origins

Under **Authorized JavaScript origins**, add:

| Environment | Origin |
|---|---|
| Production (Vercel) | `https://your-vercel-domain.vercel.app` |
| Local Development | `http://localhost:3000` |

### Configure Authorized Redirect URIs

Under **Authorized redirect URIs**, add:

| Environment | Redirect URI |
|---|---|
| Production (Vercel) | `https://your-vercel-domain.vercel.app/dashboard` |
| Local Development | `http://localhost:3000/dashboard` |

> **Note:** The redirect URI must match the `redirectTo` option used in the Supabase OAuth call. Currently set to `${window.location.origin}/dashboard`.

### Copy Credentials

After creation, you'll receive:

- **Client ID** (e.g., `123456789012-abcdefghijklmnopqrstuv.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abcdefghijklmnop`)

---

## 2. Supabase Auth Configuration

### Enable Google OAuth in Supabase

1. Go to your **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and click to enable it
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console
4. Click **Save**

### Configure Auth URL Settings

Go to **Authentication** → **URL Configuration** in Supabase:

| Setting | Value |
|---|---|
| **Site URL** | `https://your-vercel-domain.vercel.app` |
| **Redirect URLs** | `https://your-vercel-domain.vercel.app/dashboard` |
| | `http://localhost:3000/dashboard` |
| | `https://your-vercel-domain.vercel.app/forgot-password` |
| | `http://localhost:3000/forgot-password` |

---

## 3. Password Reset Redirect URLs

For the forgot password flow, ensure these URLs are added to Supabase Auth redirect URLs:

| Environment | Redirect URL |
|---|---|
| Production | `https://your-vercel-domain.vercel.app/forgot-password` |
| Local Development | `http://localhost:3000/forgot-password` |

---

## 4. Environment Variables (Already Present)

The following environment variables are already configured in the project and **must not be changed**:

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**No additional environment variables are needed for Google OAuth.** Supabase handles the OAuth provider configuration through its dashboard settings.

---

## 5. Authentication Flow Summary

### Login Flow

```
User visits /login
  → Enters email + password
    → signInWithPassword() → Redirect to /dashboard
  → OR clicks "Continue with Google"
    → signInWithOAuth({ provider: "google" }) → Supabase handles OAuth
    → Redirect to /dashboard with active session
```

### Signup Flow

```
User visits /signup
  → Fills in Full Name, Email, Password, Confirm Password
    → signUp() with metadata: { name: fullName }
    → Redirect to /dashboard (email confirmation may be required depending on Supabase settings)
  → OR clicks "Continue with Google"
    → signInWithOAuth({ provider: "google" }) → Redirect to /dashboard
```

### Forgot Password Flow

```
User visits /forgot-password
  → Enters email
    → resetPasswordForEmail() → "Email sent" confirmation page
  → User clicks email link
    → Supabase redirects to /forgot-password with recovery token
    → Reset password form appears
    → updateUser({ password }) → "Password updated" confirmation
    → Redirect to /login
```

### Logout Flow

```
User clicks avatar in Dashboard sidebar
  → Selects "Sign out"
    → supabase.auth.signOut() + tRPC auth.logout()
    → Redirect to /login
```

---

## 6. Route Protection

The following routes require authentication:

| Route | Protection |
|---|---|
| `/dashboard` | Redirects to `/login` if unauthenticated |
| `/editor/:id` | Redirects to `/login` if unauthenticated |
| `/moderation/:id` | Redirects to `/login` if unauthenticated |
| `/settings` | Redirects to `/login` if unauthenticated |
| `/projects` | Redirects to `/login` if unauthenticated |

Public routes (no auth required):

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login page |
| `/signup` | Signup page |
| `/forgot-password` | Password reset page |
| `/view/:url` | Public keepsake viewer |
| `/contribute/:url` | Public contribution page |

---

## 7. Security Notes

- Passwords are validated client-side (minimum 8 characters) and also enforced by Supabase
- User metadata (`name`) is stored during signup for the backend to resolve user profiles
- Google OAuth stores the Google account name as `user_metadata.name` automatically
- Password reset links expire after 1 hour by default (configurable in Supabase)
- The `rememberMe` checkbox on login is a UI-only feature (Supabase sessions persist by default)
