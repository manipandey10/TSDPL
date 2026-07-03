import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  buildEmailTemplate,
  loadSmtpConfig,
  sendEmailSMTP,
  validateEmail,
  NotificationEvent,
} from "./emailService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ActionType = 'queue' | 'process_queue';

interface NotificationRequest {
  action?: ActionType;
  type?: NotificationEvent;
  recipient_id?: string;
  recipient_email?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  project_id?: string;
  project_name?: string;
  project_description?: string;
  registered_at?: string;
  submission_time?: string;
  login_time?: string;
  details?: Record<string, unknown>;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const payload: NotificationRequest = await req.json();
    const action: ActionType = payload.action || 'queue';
    const smtpConfig = loadSmtpConfig();
    console.log('SMTP configuration loaded:', Boolean(smtpConfig));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'process_queue') {
      return await processPendingQueue(supabase, smtpConfig, payload.limit ?? 10);
    }

    if (!payload.type) {
      return new Response(
        JSON.stringify({ error: 'Notification type is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRows = buildQueueRows(payload);
    if (emailRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid email recipients found for this notification' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: insertedEmails, error: insertError } = await supabase
      .from('email_queue')
      .insert(emailRows)
      .select('id, to_user_id, to_email, subject, body, reference_id');

    if (insertError) {
      console.error('Error queuing emails:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to queue email notifications' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ to: string; status: string; error?: string }> = [];
    if (smtpConfig && Array.isArray(insertedEmails)) {
      for (const row of insertedEmails) {
        const to = String(row.to_email || '');
        if (!validateEmail(to)) {
          results.push({ to, status: 'skipped', error: 'Invalid email address' });
          continue;
        }

        try {
          await sendEmailSMTP(to, String(row.subject), String(row.body));
          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
            .eq('id', row.id);
          results.push({ to, status: 'sent' });
        } catch (sendError) {
          console.error('SMTP send failed for', to, sendError);
          await supabase
            .from('email_queue')
            .update({ status: 'failed', error_message: String(sendError) })
            .eq('id', row.id);
          results.push({ to, status: 'failed', error: String(sendError) });
        }
      }
    }

    if (payload.recipient_id || payload.user_id) {
      const notification = {
        user_id: payload.recipient_id || payload.user_id!,
        title: `New notification from ${Deno.env.get('APP_NAME') || 'TSDPL BI Portal'}`,
        message: `You received a new notification for ${payload.type}.`,
        type: payload.type,
        read: false,
      };

      const { error: notifError } = await supabase.from('notifications').insert(notification);
      if (notifError) {
        console.error('Error creating in-app notification:', notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        queued: Array.isArray(insertedEmails) ? insertedEmails.length : 0,
        smtpConfigured: Boolean(smtpConfig),
        sendResults: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildQueueRows(payload: NotificationRequest) {
  const now = new Date().toISOString();
  const recipientEmail = payload.recipient_email || payload.user_email;
  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  const rows: Array<Record<string, unknown>> = [];
  const appName = Deno.env.get('APP_NAME') || 'TSDPL BI Portal';
  const appLogoUrl = Deno.env.get('APP_LOGO_URL') || undefined;

  if (payload.type === 'new_registration') {
    if (recipientEmail && validateEmail(recipientEmail)) {
      rows.push({
        to_user_id: payload.user_id || payload.recipient_id,
        to_email: recipientEmail,
        subject: `Welcome to ${appName}`,
        body: buildEmailTemplate('new_registration', {
          appName,
          appLogoUrl,
          recipientName: payload.user_name || recipientEmail,
          userName: payload.user_name || recipientEmail,
          userEmail: recipientEmail,
          registeredAt: payload.registered_at || now,
        }).html,
        status: 'pending',
        reference_id: `registration:user:${payload.user_email || recipientEmail}`,
      });
    }

    if (adminEmail && validateEmail(adminEmail)) {
      rows.push({
        to_email: adminEmail,
        subject: `New User Registered | ${appName}`,
        body: buildEmailTemplate('new_registration', {
          appName,
          appLogoUrl,
          recipientName: 'Admin',
          userName: payload.user_name || recipientEmail || 'Unknown',
          userEmail: recipientEmail || 'Unknown',
          registeredAt: payload.registered_at || now,
        }).html,
        status: 'pending',
        reference_id: `registration:admin:${payload.user_email || recipientEmail || 'unknown'}:${adminEmail}`,
      });
    }
  }

  if (payload.type === 'new_idea') {
    if (recipientEmail && validateEmail(recipientEmail)) {
      rows.push({
        to_user_id: payload.user_id || payload.recipient_id,
        to_email: recipientEmail,
        subject: `Idea Submitted | ${appName}`,
        body: buildEmailTemplate('new_idea', {
          appName,
          appLogoUrl,
          recipientName: payload.user_name || recipientEmail,
          projectTitle: payload.project_name || 'Untitled Idea',
          projectDescription: payload.project_description || 'No description provided',
          submissionTime: payload.submission_time || now,
        }).html,
        status: 'pending',
        reference_id: `idea:user:${payload.project_id || payload.project_name || 'unknown'}:${recipientEmail}`,
      });
    }

    if (adminEmail && validateEmail(adminEmail)) {
      rows.push({
        to_email: adminEmail,
        subject: `New Idea Submitted | ${appName}`,
        body: buildEmailTemplate('new_idea', {
          appName,
          appLogoUrl,
          recipientName: 'Admin',
          userName: payload.user_name || recipientEmail || 'Unknown',
          userEmail: recipientEmail || 'Unknown',
          projectTitle: payload.project_name || 'Untitled Idea',
          projectDescription: payload.project_description || 'No description provided',
          submissionTime: payload.submission_time || now,
        }).html,
        status: 'pending',
        reference_id: `idea:admin:${payload.project_id || payload.project_name || 'unknown'}:${adminEmail}`,
      });
    }
  }

  if (payload.type === 'login_admin' && adminEmail && validateEmail(adminEmail)) {
    rows.push({
      to_email: adminEmail,
      subject: `User Signed In | ${appName}`,
      body: buildEmailTemplate('login_admin', {
        appName,
        appLogoUrl,
        recipientName: 'Admin',
        userName: payload.user_name || payload.user_email || 'Unknown',
        userEmail: payload.user_email || 'Unknown',
        loginTime: payload.login_time || now,
      }).html,
      status: 'pending',
      reference_id: `login_admin:${payload.user_email || 'unknown'}:${adminEmail}`,
    });
  }

  return rows;
}

async function processPendingQueue(
  supabase: ReturnType<typeof createClient>,
  smtpConfig: ReturnType<typeof loadSmtpConfig> | null,
  limit: number,
) {
  if (!smtpConfig) {
    return new Response(
      JSON.stringify({ error: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: pendingEmails, error } = await supabase
    .from('email_queue')
    .select('id, to_email, subject, body')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error reading pending email queue:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to load pending emails' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const results: Array<{ id: string; to: string; status: string; error?: string }> = [];

  if (!Array.isArray(pendingEmails) || pendingEmails.length === 0) {
    return new Response(
      JSON.stringify({ success: true, processed: 0, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  for (const emailRow of pendingEmails) {
    const to = String(emailRow.to_email || '');
    if (!validateEmail(to)) {
      const errorMessage = 'Invalid recipient email';
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', emailRow.id);
      results.push({ id: emailRow.id, to, status: 'failed', error: errorMessage });
      continue;
    }

    try {
      await sendEmailSMTP(to, String(emailRow.subject), String(emailRow.body));
      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
        .eq('id', emailRow.id);
      results.push({ id: emailRow.id, to, status: 'sent' });
    } catch (sendError) {
      console.error('Error sending queued email:', sendError);
      await supabase
        .from('email_queue')
        .update({ status: 'failed', error_message: String(sendError) })
        .eq('id', emailRow.id);
      results.push({ id: emailRow.id, to, status: 'failed', error: String(sendError) });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
