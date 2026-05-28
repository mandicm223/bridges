import { Webhook } from "standardwebhooks";
import { type NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/utils/email/resend";
import { resolveEmails, type EmailData, type SupabaseUser } from "@/utils/email/templates";

type HookPayload = {
  user: SupabaseUser;
  email_data: EmailData;
};

export async function POST(request: NextRequest) {
  // -------------------------------------------------------------------------
  // Signature verification
  // Supabase sends a "v1,whsec_<base64>" secret; strip the prefix for the SDK.
  // -------------------------------------------------------------------------
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET ?? "";
  const secret = rawSecret.replace(/^v1,whsec_/, "");

  const body = await request.text();

  if (secret) {
    const wh = new Webhook(secret);
    try {
      wh.verify(body, Object.fromEntries(request.headers));
    } catch {
      return NextResponse.json(
        { error: { http_code: 401, message: "Invalid webhook signature" } },
        { status: 401 }
      );
    }
  }

  // -------------------------------------------------------------------------
  // Parse payload
  // -------------------------------------------------------------------------
  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return NextResponse.json(
      { error: { http_code: 400, message: "Invalid JSON payload" } },
      { status: 400 }
    );
  }

  const { user, email_data } = payload;

  // -------------------------------------------------------------------------
  // Resolve and send emails
  // -------------------------------------------------------------------------
  const sends = resolveEmails(user, email_data);

  if (sends.length === 0) {
    // Unknown action type — return 200 so Supabase doesn't retry.
    return NextResponse.json({});
  }

  const errors: string[] = [];

  for (const { to, template } of sends) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });
    if (error) {
      errors.push(`${to}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: { http_code: 500, message: errors.join("; ") } },
      { status: 500 }
    );
  }

  return NextResponse.json({});
}
