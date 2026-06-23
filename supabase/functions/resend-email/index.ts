// supabase/functions/resend-email/index.ts
import { Resend } from "https://esm.sh/@resend/resend@0.7.0";

export default async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { to, subject, html } = body as { to: string; subject: string; html: string };
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: "no-reply@propelapp.com",
      to,
      subject,
      html,
    });
    if (result.error) {
      console.warn("Resend error", result.error);
      return new Response(JSON.stringify({ error: result.error.message || "Failed to send" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Resend function failed", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
