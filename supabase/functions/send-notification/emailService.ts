import { SmtpClient } from "https://deno.land/x/smtp@v0.10.0/mod.ts";

export type NotificationEvent =
  | 'new_registration'
  | 'new_idea'
  | 'login_admin'
  | 'approval_request'
  | 'approved'
  | 'rejected'
  | 'status_update'
  | 'password_reset';

export interface EmailTemplateData {
  appName: string;
  appLogoUrl?: string;
  recipientName: string;
  userName?: string;
  userEmail?: string;
  registeredAt?: string;
  loginTime?: string;
  projectTitle?: string;
  projectDescription?: string;
  submissionTime?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  adminEmail?: string;
  appName: string;
  appLogoUrl?: string;
}

import { toFileUrl } from "https://deno.land/std@0.203.0/path/mod.ts";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEnvFile(contents: string) {
  const result: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function loadLocalEnv() {
  const candidates = [
    new URL('../../../mani.env', import.meta.url),
    new URL('../../../.env', import.meta.url),
    toFileUrl(`${Deno.cwd()}/mani.env`),
    toFileUrl(`${Deno.cwd()}/.env`),
  ];

  for (const fileUrl of candidates) {
    try {
      const contents = Deno.readTextFileSync(fileUrl);
      const parsed = parseEnvFile(contents);
      if (Object.keys(parsed).length > 0) {
        console.log(`Loaded local env from ${fileUrl.href}`);
        return parsed;
      }
    } catch (_err) {
      // ignore missing files
    }
  }
  return {};
}

export function validateEmail(email: string) {
  return typeof email === 'string' && emailRegex.test(email.trim());
}

export function loadSmtpConfig(): SmtpConfig | null {
  const localEnv = loadLocalEnv();
  const host = Deno.env.get('SMTP_HOST') || localEnv.SMTP_HOST;
  const portValue = Deno.env.get('SMTP_PORT') || localEnv.SMTP_PORT;
  const username = Deno.env.get('SMTP_USER') || localEnv.SMTP_USER;
  const password = Deno.env.get('SMTP_PASS') || localEnv.SMTP_PASS;
  const from = Deno.env.get('SMTP_FROM') || localEnv.SMTP_FROM;
  const adminEmail = Deno.env.get('ADMIN_EMAIL') || localEnv.ADMIN_EMAIL;
  const appName = Deno.env.get('APP_NAME') || localEnv.APP_NAME || 'TSDPL BI Portal';
  const appLogoUrl = Deno.env.get('APP_LOGO_URL') || localEnv.APP_LOGO_URL || '';

  if (!host || !portValue || !username || !password || !from) {
    console.error('SMTP is not configured. Missing one or more of SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.');
    return null;
  }

  const port = Number(portValue);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('SMTP_PORT must be a valid number');
  }

  return {
    host,
    port,
    username,
    password,
    from,
    adminEmail: adminEmail || undefined,
    appName,
    appLogoUrl,
  };
}

export function buildEmailTemplate(type: NotificationEvent, data: EmailTemplateData) {
  const titleHeader = data.appLogoUrl
    ? `<img src="${data.appLogoUrl}" alt="${data.appName}" style="width: 120px; height: auto; object-fit: contain; margin-bottom: 18px;" />`
    : `<div style="font-size: 20px; font-weight: 700; color: #0f172a;">${data.appName}</div>`;

  const commonFooter = `
    <p style="font-size: 14px; color: #94a3b8; margin: 24px 0 0;">This message was sent by ${data.appName}. If you did not expect this email, please contact your administrator.</p>
  `;

  const templates: Record<NotificationEvent, { subject: string; html: string; preview: string }> = {
    new_registration: {
      subject: `New User Registered | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">New User Registration</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 20px;">Hello ${data.recipientName},</p>
              <p style="font-size: 16px; margin: 0 0 16px;">A new user has registered in ${data.appName}. Details are below.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Name</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.userName || 'Unknown'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.userEmail || 'Unknown'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Registered</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.registeredAt || 'Unknown'}</td></tr>
              </table>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `${data.userName || data.userEmail || 'A user'} registered on ${data.registeredAt || 'unknown date'}`,
    },
    new_idea: {
      subject: `Idea Submitted | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Idea Submitted</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 20px;">Hello ${data.recipientName},</p>
              <p style="font-size: 16px; margin: 0 0 16px;">Your idea has been received and is queued for review.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Idea Title</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.projectTitle || 'Untitled'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Description</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.projectDescription || 'No description provided'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Submitted</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.submissionTime || 'Unknown'}</td></tr>
              </table>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `Your idea "${data.projectTitle || 'Untitled'}" was submitted successfully.`,
    },
    login_admin: {
      subject: `User Signed In | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Login Notification</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px;">A user has signed into ${data.appName}.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Name</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.userName || 'Unknown'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.userEmail || 'Unknown'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Signed In</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.loginTime || 'Unknown'}</td></tr>
              </table>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `User ${data.userName || data.userEmail || 'Unknown'} signed in at ${data.loginTime || 'unknown'}.`,
    },
    approval_request: {
      subject: `Approval Required | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Approval Required</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px;">An idea requires your review.</p>
              <p style="font-size: 15px; margin: 0 0 24px;"><strong>Project:</strong> ${data.projectTitle || 'Unknown'}</p>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `Approval required for ${data.projectTitle || 'an idea'}.`,
    },
    approved: {
      subject: `Idea Approved | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Idea Approved</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 20px;">Congratulations! The idea below has been approved.</p>
              <p style="font-size: 15px; margin: 0; font-weight: 600;">${data.projectTitle || 'Untitled'}</p>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `Your idea ${data.projectTitle || 'has been approved'}.`,
    },
    rejected: {
      subject: `Idea Rejected | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Idea Update</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px;">The idea below was not approved.</p>
              <p style="font-size: 15px; margin: 0; font-weight: 600;">${data.projectTitle || 'Untitled'}</p>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `Your idea ${data.projectTitle || 'has an update'}.`,
    },
    status_update: {
      subject: `Workflow Status Update | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Workflow Update</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 20px;">The workflow status for your idea has changed.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Project</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.projectTitle || 'Unknown'}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><strong>Updated</strong></td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">${data.submissionTime || 'Unknown'}</td></tr>
              </table>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: `Workflow update for ${data.projectTitle || 'your idea'}.`,
    },
    password_reset: {
      subject: `Password Reset | ${data.appName}`,
      html: `
        <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 24px; background: #f8fafc;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
            <div style="padding: 32px; text-align: center; background: #0f172a; color: #ffffff;">
              ${titleHeader}
              <h1 style="font-size: 24px; margin: 0;">Password Reset Request</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 16px;">A password reset request was received for your account.</p>
              <p style="font-size: 15px; margin: 0 0 24px;">If you requested this reset, please use the secure link provided in the dashboard.</p>
              ${commonFooter}
            </div>
          </div>
        </div>
      `,
      preview: 'A password reset request was made for your account.',
    },
  };

  return templates[type];
}

export async function sendEmailSMTP(to: string, subject: string, html: string): Promise<void> {
  const config = loadSmtpConfig();
  if (!config) {
    throw new Error('SMTP settings are not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.');
  }

  if (!validateEmail(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }

  const client = new SmtpClient();
  await client.connect({
    hostname: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    tls: config.port !== 25,
  });

  try {
    await client.send({
      from: config.from,
      to,
      subject,
      content: html,
      html,
    });
  } finally {
    await client.close();
  }
}
