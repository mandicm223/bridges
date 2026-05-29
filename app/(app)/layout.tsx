import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { AppHeader } from "@/components/app/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile?.onboarding_completed_at && pathname !== "/welcome") {
    redirect("/welcome");
  }

  const showHeader = pathname !== "/welcome";

  return (
    <div className="flex min-h-full flex-col bg-background">
      {showHeader ? (
        <AppHeader
          email={user.email}
          displayName={profile?.display_name ?? null}
        />
      ) : null}
      <main className="flex-1">{children}</main>
    </div>
  );
}
