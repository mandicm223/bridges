import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Handles the one-click confirmation links embedded in auth emails.
 * Supabase sends token hashes rather than raw tokens in URLs, so we exchange
 * the hash here and then redirect the user to their intended destination.
 *
 * Expected query params:
 *   token_hash — the hashed token from the email
 *   type       — the auth action (signup, recovery, magiclink, invite, email_change, …)
 *   next        — URL to redirect to after confirmation (default: "/")
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as Parameters<
    ReturnType<typeof createClient>["auth"]["verifyOtp"]
  >[0]["type"] | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/auth-error?error=missing_params`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    const msg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/auth/auth-error?error=${msg}`);
  }

  // Redirect to an absolute URL so the browser follows it correctly.
  const redirectTo = next.startsWith("/") ? `${origin}${next}` : next;
  return NextResponse.redirect(redirectTo);
}
