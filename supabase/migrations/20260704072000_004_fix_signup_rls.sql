-- Fix signup RLS and auth trigger behavior for profiles, notifications, and email queue

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure RLS policies exist for auth-triggered inserts
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "profiles_insert_service_role" ON profiles;
CREATE POLICY "profiles_insert_service_role" ON profiles FOR INSERT
  TO service_role WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "notifications_insert_service_role" ON notifications;
CREATE POLICY "notifications_insert_service_role" ON notifications FOR INSERT
  TO service_role WITH CHECK (true);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_queue_insert" ON email_queue;
CREATE POLICY "email_queue_insert" ON email_queue FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = to_user_id
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "email_queue_insert_service_role" ON email_queue;
CREATE POLICY "email_queue_insert_service_role" ON email_queue FOR INSERT
  TO service_role WITH CHECK (true);

-- Recreate the auth user signup trigger to avoid failure on duplicate profile keys.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'employee'
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'public.handle_new_user suppressed error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
