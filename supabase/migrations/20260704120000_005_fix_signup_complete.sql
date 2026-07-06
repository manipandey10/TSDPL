-- Complete signup fix: auth trigger permissions, search_path, RLS, and email trigger bugs
--
-- Root cause: triggers on auth.users run as supabase_auth_admin, which cannot insert into
-- public.profiles without SECURITY DEFINER + SET search_path + proper grants.
-- Secondary bug: send_welcome_email mapped admin email_queue columns incorrectly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Allow auth admin role to resolve objects in public schema when needed
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO supabase_auth_admin;

-- Ensure profiles.id references auth.users (no random default on signup)
ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;

-- RLS: allow authenticated self-insert and service_role / trigger inserts
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_service_role" ON public.profiles;
CREATE POLICY "profiles_insert_service_role" ON public.profiles
  FOR INSERT TO service_role
  WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "notifications_insert_service_role" ON public.notifications;
CREATE POLICY "notifications_insert_service_role" ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_queue_insert" ON public.email_queue;
CREATE POLICY "email_queue_insert" ON public.email_queue
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = to_user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "email_queue_insert_service_role" ON public.email_queue;
CREATE POLICY "email_queue_insert_service_role" ON public.email_queue
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Profile creation on auth.users insert (runs as postgres via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    'employee'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Welcome / admin notification pipeline (must not block signup)
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.email_queue (to_user_id, to_email, subject, body, status, reference_id)
    VALUES (
      NEW.id,
      NEW.email,
      'Welcome to TSDPL BI Dashboard',
      'Dear ' || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1))
        || ',<br><br>Welcome to TSDPL BI Corporate Workflow Dashboard! Your account has been successfully created.'
        || '<br><br>You can now submit ideas, track project workflows, and collaborate with your team.'
        || '<br><br>Best regards,<br>TSDPL BI Team',
      'pending',
      'registration:user:' || NEW.id::text
    )
    ON CONFLICT (reference_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Welcome to TSDPL BI!',
      'Your account has been successfully created. Start by submitting your first idea!',
      'success'
    );

    INSERT INTO public.email_queue (to_user_id, to_email, subject, body, status, reference_id)
    SELECT
      p.id,
      p.email,
      'New User Registered - TSDPL BI',
      'A new user has registered:<br><br><strong>Name:</strong> '
        || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1))
        || '<br><strong>Email:</strong> ' || NEW.email
        || '<br><strong>User ID:</strong> ' || NEW.id::text
        || '<br><strong>Registered at:</strong> ' || now()::text
        || '<br><br>Review the user in the admin dashboard.',
      'pending',
      'registration:admin:' || NEW.id::text || ':' || p.email
    FROM public.profiles p
    WHERE p.role = 'admin'
    ON CONFLICT (reference_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT
      p.id,
      'New user registered',
      'A new user has signed up: '
        || COALESCE(NEW.full_name, split_part(NEW.email, '@', 1))
        || ' (' || NEW.email || ')',
      'new_registration'
    FROM public.profiles p
    WHERE p.role = 'admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'send_welcome_email non-fatal error for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.send_welcome_email() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.send_welcome_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_welcome_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.send_welcome_email() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();
