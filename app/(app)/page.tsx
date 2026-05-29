import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/db/profile";
import { LookupExperience } from "@/components/lookup/lookup-experience";
import type { LanguageCode } from "@/lib/languages";
import { defaultPair, parsePendingPair } from "@/lib/lookup/pair";

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(supabase, user.id) : null;
  const nativeLanguage = (profile?.native_language ?? "sr") as LanguageCode;
  const pendingPair = parsePendingPair(
    cookieStore.get("bridges.pending_pair")?.value
  );
  const initialPair = pendingPair ?? defaultPair(nativeLanguage);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="font-serif text-4xl tracking-tight text-foreground">
          Look up a word
        </h1>
        <p className="text-sm text-muted-foreground">
          Type or speak a word in either language — Bridges explains what it
          really means.
        </p>
      </div>

      <LookupExperience
        initialNativeLanguage={nativeLanguage}
        initialPair={initialPair}
      />
    </div>
  );
}
