import Link from "next/link";
import { cookies } from "next/headers";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/utils/supabase/server";

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        title="Reset your password"
        description="Choose a new password for your account."
        footer={
          <p>
            <Link
              href="/forgot-password"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
        }
      >
        <p className="text-sm text-destructive" role="alert">
          This reset link has expired — request a new one.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Choose a new password for your account."
      footer={
        <p>
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
