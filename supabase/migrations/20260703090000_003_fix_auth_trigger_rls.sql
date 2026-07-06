-- Fix auth trigger row-level security policies and ensure UUID generation extension availability

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Allow service_role / internal trigger insertions for profiles during sign-up
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "profiles_insert_service_role" ON profiles;
CREATE POLICY "profiles_insert_service_role" ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow internal trigger insertions for notifications during welcome email / signup pipeline
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR auth.role() = 'service_role'
  );
DROP POLICY IF EXISTS "notifications_insert_service_role" ON notifications;
CREATE POLICY "notifications_insert_service_role" ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow auth-triggered inserts into email_queue from the signup pipeline
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_queue_insert" ON email_queue;
CREATE POLICY "email_queue_insert" ON email_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = to_user_id);
DROP POLICY IF EXISTS "email_queue_insert_service_role" ON email_queue;
CREATE POLICY "email_queue_insert_service_role" ON email_queue FOR INSERT
  TO service_role
  WITH CHECK (true);
