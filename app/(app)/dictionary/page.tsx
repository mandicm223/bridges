import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { parseFiltersFromSearchParams } from "@/lib/dictionary/filters";
import { countSavedWords, listSavedWords } from "@/lib/dictionary/queries";
import { DictionaryExperience } from "@/components/dictionary/dictionary-experience";

type DictionaryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DictionaryPage({
  searchParams,
}: DictionaryPageProps) {
  const params = await searchParams;
  const filters = parseFiltersFromSearchParams(params);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [entries, totalCount] = await Promise.all([
    listSavedWords(supabase, filters),
    countSavedWords(supabase),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="font-serif text-4xl tracking-tight text-foreground">
          My dictionary
        </h1>
        <p className="text-sm text-muted-foreground">
          Words you have saved — search, filter, and revisit them any time.
        </p>
      </div>

      <DictionaryExperience
        entries={entries}
        filters={filters}
        totalCount={totalCount}
      />
    </div>
  );
}
