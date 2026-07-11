# Supabase Setup

Run `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor before deploying.

The migration creates:
- Auth profile table
- Birthday keepsake projects
- Sections
- Contributions
- Notifications
- Public `birthday-keepsake` storage bucket
- RLS policies for creator-owned writes and public published reads
