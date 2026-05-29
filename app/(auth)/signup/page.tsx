import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="A private space for the words that matter between you."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
