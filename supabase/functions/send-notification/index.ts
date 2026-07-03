import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  type: 'new_idea' | 'approval_request' | 'approved' | 'rejected' | 'status_update' | 'password_reset';
  recipient_email: string;
  recipient_name?: string;
  project_id?: string;
  project_name?: string;
  details?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipient_email, recipient_name, project_id, project_name, details }: NotificationRequest = await req.json();

    if (!recipient_email) {
      return new Response(
        JSON.stringify({ error: "Recipient email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate email content based on notification type
    const emailContent = getEmailContent(type, {
      recipient_name: recipient_name || 'User',
      project_id: project_id || '',
      project_name: project_name || '',
      details: details || {},
    });

    // Store email in queue for sending
    const { error: insertError } = await supabase
      .from('email_queue')
      .insert({
        to_email: recipient_email,
        subject: emailContent.subject,
        body: emailContent.body,
        status: 'pending',
      });

    if (insertError) {
      console.error("Error inserting email:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to queue email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification in database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: null, // Will be set by the caller if known
        title: emailContent.subject,
        message: emailContent.preview,
        type: type,
        read: false,
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email queued successfully",
        email: {
          to: recipient_email,
          subject: emailContent.subject,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getEmailContent(type: string, data: {
  recipient_name: string;
  project_id: string;
  project_name: string;
  details: Record<string, unknown>;
}): { subject: string; body: string; preview: string } {
  const templates: Record<string, { subject: string; body: string; preview: string }> = {
    new_idea: {
      subject: "New Idea Submitted - TSDPL BI Portal",
      body: `
        <h2>New Idea Submitted</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>A new idea has been submitted to the TSDPL BI Corporate Workflow system:</p>
        <ul>
          <li><strong>Project ID:</strong> ${data.project_id}</li>
          <li><strong>Project Name:</strong> ${data.project_name}</li>
        </ul>
        <p>Please review this submission at your earliest convenience.</p>
        <p><a href="https://tsdpl-portal.example.com/dashboard/ideas">View in Dashboard</a></p>
      `,
      preview: `New idea "${data.project_name}" has been submitted for review.`,
    },
    approval_request: {
      subject: "Approval Required - TSDPL BI Portal",
      body: `
        <h2>Approval Request</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>An idea requires your approval:</p>
        <ul>
          <li><strong>Project ID:</strong> ${data.project_id}</li>
          <li><strong>Project Name:</strong> ${data.project_name}</li>
          <li><strong>Current Stage:</strong> ${data.details.current_stage || 'N/A'}</li>
        </ul>
        <p>Please review and take action.</p>
        <p><a href="https://tsdpl-portal.example.com/dashboard/workflow">Review Now</a></p>
      `,
      preview: `Project "${data.project_name}" requires your approval.`,
    },
    approved: {
      subject: "Idea Approved - TSDPL BI Portal",
      body: `
        <h2>Great News!</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>Your idea has been approved:</p>
        <ul>
          <li><strong>Project ID:</strong> ${data.project_id}</li>
          <li><strong>Project Name:</strong> ${data.project_name}</li>
        </ul>
        <p>It will now proceed to the next stage of the workflow.</p>
        <p><a href="https://tsdpl-portal.example.com/dashboard/ideas">View Details</a></p>
      `,
      preview: `Your idea "${data.project_name}" has been approved!`,
    },
    rejected: {
      subject: "Idea Status Update - TSDPL BI Portal",
      body: `
        <h2>Status Update</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>Your idea submission has been updated:</p>
        <ul>
          <li><strong>Project ID:</strong> ${data.project_id}</li>
          <li><strong>Project Name:</strong> ${data.project_name}</li>
          <li><strong>Status:</strong> Rejected</li>
          ${data.details.reason ? `<li><strong>Feedback:</strong> ${data.details.reason}</li>` : ''}
        </ul>
        <p>Please review any feedback and consider resubmitting with improvements.</p>
        <p><a href="https://tsdpl-portal.example.com/dashboard/ideas">View Details</a></p>
      `,
      preview: `Your idea "${data.project_name}" requires attention.`,
    },
    status_update: {
      subject: "Workflow Status Update - TSDPL BI Portal",
      body: `
        <h2>Status Update</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>Your project status has been updated:</p>
        <ul>
          <li><strong>Project ID:</strong> ${data.project_id}</li>
          <li><strong>Project Name:</strong> ${data.project_name}</li>
          <li><strong>New Stage:</strong> ${data.details.current_stage || 'N/A'}</li>
        </ul>
        <p><a href="https://tsdpl-portal.example.com/dashboard/ideas">View Progress</a></p>
      `,
      preview: `Project "${data.project_name}" has progressed to a new stage.`,
    },
    password_reset: {
      subject: "Password Reset - TSDPL BI Portal",
      body: `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.recipient_name},</p>
        <p>We received a request to reset your password for the TSDPL BI Corporate Workflow Portal.</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="${data.details.reset_link || '#'}">Reset Password</a></p>
        <p>If you did not request this reset, please ignore this email.</p>
      `,
      preview: "A password reset was requested for your account.",
    },
  };

  return templates[type] || templates.status_update;
}
