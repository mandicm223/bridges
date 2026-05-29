import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { WelcomeForm } from "@/components/welcome/welcome-form";

export default async function WelcomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);

  if (profile?.onboarding_completed_at) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="space-y-2 text-center">
        <p className="font-serif text-3xl tracking-tight text-foreground">
          Welcome to Bridges
        </p>
        <p className="text-sm text-muted-foreground">
          Let&apos;s choose the languages you want to connect first.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <WelcomeForm />
      </div>
    </div>
  );
}
