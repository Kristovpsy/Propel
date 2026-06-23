/**
 * Email notification service
 * All emails are sent via Supabase Edge Functions which securely call Resend.
 * The RESEND_API_KEY is stored as a Supabase secret and never exposed to the browser.
 */

import { supabase } from './supabase';

// ─── Helper ───────────────────────────────────────────────────────────────────

async function invokeEmailFunction(
  functionName: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });
    if (error) {
      // Log but don't throw — email failures should never block the main action
      console.warn(`[email] ${functionName} failed (non-fatal):`, error.message);
    }
  } catch (err) {
    console.warn(`[email] ${functionName} threw (non-fatal):`, err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify a mentor when a mentee sends them a connection request.
 */
export async function notifyConnectionRequest(params: {
  mentorId: string;
  menteeId: string;
  connectionId: string;
  requestMessage?: string;
}): Promise<void> {
  await invokeEmailFunction('send-connection-request-email', params);
}

/**
 * Notify a mentee when their connection request is accepted or rejected.
 * @param status 'active' = accepted, 'rejected' = declined
 */
export async function notifyConnectionStatus(params: {
  connectionId: string;
  status: 'active' | 'rejected';
}): Promise<void> {
  await invokeEmailFunction('send-connection-status-email', params);
}

/**
 * Notify a user when they receive a new message.
 * Pass a short preview of the message for context in the email.
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  senderId: string;
  senderName: string;
  messagePreview?: string;
  connectionId?: string;
}): Promise<void> {
  await invokeEmailFunction('send-message-notification-email', params);
}

/**
 * Notify a user when they are invited to an event.
 */
export async function notifyEventInvitation(params: {
  eventId: string;
  recipientId: string;
}): Promise<void> {
  await invokeEmailFunction('send-event-invitation-email', params);
}

// Generic Resend email sender
export async function sendResendEmail(payload: { to: string; subject: string; html: string }): Promise<void> {
  await invokeEmailFunction('resend-email', payload);
}

/**
 * Send a welcome email to a new user after onboarding.
 */
export async function sendWelcomeEmail(params: { userId: string; email: string; fullName: string; role: 'mentor' | 'mentee'; }): Promise<void> {
  const { email, fullName, role } = params;
  const subject = role === 'mentor' ? 'Welcome to Propel, Mentor!' : 'Welcome to Propel, Mentee!';
  const html = `<p>Hi ${fullName},</p><p>Welcome to Propel as a ${role}. We're excited to have you on board!</p>`;
  await sendResendEmail({ to: email, subject, html });
}
  userId: string;
  email: string;
  fullName: string;
  role: 'mentor' | 'mentee';
}): Promise<void> {
  await invokeEmailFunction('send-welcome-email', params);
}
