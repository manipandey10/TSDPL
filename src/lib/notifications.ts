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
    body: payload,
  });

  if (response.error) {
    console.error('[Notifications] Edge function error:', {
      message: response.error.message,
      name: response.error.name,
      context: response.error.context,
      payload,
    });
    throw new Error(response.error.message || 'Notification function failed');
  }

  if (response.data && typeof response.data === 'object' && 'error' in response.data) {
    const backendError = String((response.data as { error?: string }).error || 'Notification function failed');
    console.error('[Notifications] Backend returned error:', backendError, response.data);
    throw new Error(backendError);
  }

  return response.data;
}
