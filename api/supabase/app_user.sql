  -- Create a non-superuser role for your Node/Prisma app so RLS is actually enforced.
  -- Run this in Supabase SQL Editor.

-- Choose a strong password and store it in your env vars.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    -- IMPORTANT: replace <APP_USER_PASSWORD> before running.
    CREATE ROLE app_user LOGIN PASSWORD '<APP_USER_PASSWORD>' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

-- Allow connecting and using the public schema
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CONNECT ON DATABASE postgres TO app_user;

-- Allow CRUD on existing tables (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Ensure future tables/sequences are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;
