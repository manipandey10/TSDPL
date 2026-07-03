import { supabase } from './supabase';

export type NotificationEvent =
  | 'new_registration'
  | 'new_idea'
  | 'login_admin';

export interface NotificationPayload {
  type: NotificationEvent;
  user_id?: string;
  user_email: string;
  user_name?: string;
  registered_at?: string;
  login_time?: string;
  project_id?: string;
  project_name?: string;
  project_description?: string;
  submitted_at?: string;
}

export async function sendAppNotification(payload: NotificationPayload) {
  const response = await supabase.functions.invoke('send-notification', {
    body: JSON.stringify(payload),
  });

  if (response.error) {
    throw new Error(response.error.message || 'Notification function failed');
  }

  return response.data;
}
