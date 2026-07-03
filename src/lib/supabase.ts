import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'reviewer' | 'employee';
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Idea = {
  id: string;
  project_id: string;
  project_name: string;
  description: string | null;
  submitter_id: string;
  status: 'submitted' | 'd0_validation' | 'd1_scoring' | 'd2_d4_workflow' | 'final_approval' | 'approved' | 'rejected' | 'completed';
  current_stage: 'idea_info' | 'd0_validation' | 'd1_scoring' | 'd2_d4_workflow' | 'final_approval';
  d0_lever: string | null;
  estimated_impact: 'low' | 'medium' | 'high' | null;
  implementability: 'high_effort' | 'mid_effort' | 'quick_win' | null;
  score: number;
  created_at: string;
  updated_at: string;
};

export type WorkflowStage = {
  id: string;
  idea_id: string;
  stage_name: 'idea_info' | 'd0_validation' | 'd1_scoring' | 'd2_d4_workflow' | 'final_approval';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  reviewer_id: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
};
