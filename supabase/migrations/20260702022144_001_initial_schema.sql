/*
# Initial Schema for TSDPL BI Corporate Workflow Dashboard

1. New Tables
- `profiles` - User profiles with role-based access (Admin, Reviewer, Employee)
- `ideas` - Main idea/project submissions with workflow stages
- `workflow_stages` - Track idea progress through D0-D4 stages
- `activity_logs` - Audit trail for all actions
- `notifications` - User notification system
- `email_queue` - Queue for email notifications

2. Security
- Enable RLS on all tables
- Owner-scoped policies for authenticated users
- Admin role has elevated access

3. Important Notes
- All tables use UUID primary keys with defaults
- Timestamps for created_at and updated_at
- user_id columns default to auth.uid() for automatic ownership
- Role field supports: admin, reviewer, employee
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'reviewer', 'employee')),
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Ideas table for project submissions
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  description TEXT,
  submitter_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'd0_validation', 'd1_scoring', 'd2_d4_workflow', 'final_approval', 'approved', 'rejected', 'completed')),
  current_stage TEXT NOT NULL DEFAULT 'idea_info',
  d0_lever TEXT,
  estimated_impact TEXT CHECK (estimated_impact IN ('low', 'medium', 'high')),
  implementability TEXT CHECK (implementability IN ('high_effort', 'mid_effort', 'quick_win')),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ideas_select_own" ON ideas;
CREATE POLICY "ideas_select_own" ON ideas FOR SELECT
  TO authenticated USING (
    auth.uid() = submitter_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "ideas_insert_own" ON ideas;
CREATE POLICY "ideas_insert_own" ON ideas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "ideas_update_own" ON ideas;
CREATE POLICY "ideas_update_own" ON ideas FOR UPDATE
  TO authenticated USING (
    auth.uid() = submitter_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "ideas_delete_own" ON ideas;
CREATE POLICY "ideas_delete_own" ON ideas FOR DELETE
  TO authenticated USING (
    auth.uid() = submitter_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Workflow stages tracking
CREATE TABLE IF NOT EXISTS workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL CHECK (stage_name IN ('idea_info', 'd0_validation', 'd1_scoring', 'd2_d4_workflow', 'final_approval')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_select_own" ON workflow_stages;
CREATE POLICY "workflow_select_own" ON workflow_stages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM ideas WHERE ideas.id = workflow_stages.idea_id AND ideas.submitter_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "workflow_insert_own" ON workflow_stages;
CREATE POLICY "workflow_insert_own" ON workflow_stages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "workflow_update_own" ON workflow_stages;
CREATE POLICY "workflow_update_own" ON workflow_stages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'reviewer')
    )
  );

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_own" ON activity_logs;
CREATE POLICY "logs_select_own" ON activity_logs FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "logs_insert_own" ON activity_logs;
CREATE POLICY "logs_insert_own" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Email queue
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_queue_select" ON email_queue;
CREATE POLICY "email_queue_select" ON email_queue FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "email_queue_insert" ON email_queue;
CREATE POLICY "email_queue_insert" ON email_queue FOR INSERT
  TO authenticated WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_submitter ON ideas(submitter_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_workflow_idea ON workflow_stages(idea_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_status ON email_queue(status);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_workflow_updated_at ON workflow_stages;
CREATE TRIGGER update_workflow_updated_at
  BEFORE UPDATE ON workflow_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user signup - create profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();