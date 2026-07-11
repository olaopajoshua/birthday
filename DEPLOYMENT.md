# Deployment Guide

## 1. Create a Supabase project

Create a new project in Supabase. Copy the project URL, anon key, and service role key from Project Settings -> API.

## 2. Create tables and run SQL migrations

Open Supabase SQL Editor and run:

`supabase/migrations/0001_initial_schema.sql`

This creates profiles, projects, sections, contributions, notifications, enums, indexes, RLS policies, and the `birthday-keepsake` storage bucket.

## 3. Configure Auth

In Supabase Auth -> URL Configuration:

- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URLs:
  - `https://your-vercel-domain.vercel.app/dashboard`
  - `http://localhost:3000/dashboard`

Email magic-link auth works without extra code. Optional OAuth providers can be enabled in Supabase later.

## 4. Configure RLS policies

The migration enables RLS. Creator-owned records are writable only by the authenticated creator. Published projects and their sections are publicly readable. Contributions can be inserted publicly and moderated by the project owner.

## 5. Configure Storage

The migration creates a public bucket named `birthday-keepsake`. If you use a different bucket name, set `SUPABASE_STORAGE_BUCKET` to that name and update the bucket/policies accordingly.

## 6. Add Vercel environment variables

Add every value from `.env.example` in Vercel Project Settings -> Environment Variables. Use the same Supabase URL/key values for both server and Vite variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OWNER_EMAIL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `VITE_GOOGLE_MAPS_API_KEY`

`RESEND_API_KEY`, `OPENAI_API_KEY`, and `VITE_GOOGLE_MAPS_API_KEY` are optional unless you need email notifications, AI suggestions, or maps.

## 7. Connect GitHub and deploy to Vercel

Import the repository in Vercel.

Vercel settings:

- Framework Preset: Other
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Node.js Version: 22.x

The included `vercel.json` also sets the API rewrite to the Express serverless function.

## 8. Verify deployment

After deploy:

1. Open `/`.
2. Click Sign In and complete the Supabase magic-link flow.
3. Create a keepsake in `/dashboard`.
4. Upload a cover image.
5. Publish the keepsake.
6. Open `/view/:publicUrl`.
7. Submit a contribution from `/contribute/:publicUrl`.
8. Review the contribution in moderation.

## 9. Common issues

- Magic link returns to the wrong URL: add the exact Vercel URL to Supabase Auth redirect URLs.
- Upload fails: confirm `SUPABASE_SERVICE_ROLE_KEY` is present and the storage bucket exists.
- AI suggestions fail: set `OPENAI_API_KEY`.
- Email notifications do not send: set `RESEND_API_KEY`, verify your Resend sending domain, and update `EMAIL_FROM`.
- API routes return 404: confirm `vercel.json` was deployed and `/api/(.*)` rewrites to `/api/index`.
