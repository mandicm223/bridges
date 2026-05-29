import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile) {
    redirect("/welcome");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <SettingsForm profile={profile} email={user.email} />
    </div>
  );
}
