# Supabase Setup

This is the production persistence starting point for Querix.

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy values into `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

The current app still uses in-memory DuckDB for live uploaded data analysis. The Supabase schema is for durable product data: profiles, uploaded dataset metadata, sessions, chat messages, and query runs. Backend persistence wiring should use the service-role key only on the server.
