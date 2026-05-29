-- ---------------------------------------------------------------------------
-- Bridges — initial schema
-- ---------------------------------------------------------------------------

-- Enums --------------------------------------------------------------------

create type public.language_code as enum ('sr', 'hu', 'de');

create type public.native_language_code as enum ('sr', 'hu', 'de');

-- Profiles -----------------------------------------------------------------

create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  display_name            text,
  native_language         public.native_language_code not null,
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.profiles is
  'Per-user profile data extending auth.users. One row per Supabase auth user.';

comment on column public.profiles.native_language is
  'User-selected native language. Used (a) to default the source-language dropdown on the lookup screen, and (b) as a parameter to the AI prompt for empathy-tuning the English explanation.';

comment on column public.profiles.onboarding_completed_at is
  'Set when the user finishes the /welcome flow. NULL means onboarding still pending.';

-- updated_at trigger function (reusable)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Saved words --------------------------------------------------------------

create table public.saved_words (
  id                bigint primary key generated always as identity,
  user_id           uuid not null references public.profiles (id) on delete cascade,

  word              text not null,
  source_lang       public.language_code not null,
  target_lang       public.language_code not null,

  english_meaning   text not null,
  cultural_context  text,
  example_sentence  text not null,
  equivalent_text   text not null,
  equivalent_note   text,

  created_at        timestamptz not null default now(),

  constraint saved_words_word_length_chk
    check (char_length(word) between 1 and 300),
  constraint saved_words_distinct_langs_chk
    check (source_lang <> target_lang)
);

comment on table public.saved_words is
  'Private personal dictionary entries. Immutable snapshots of AI lookup results. Duplicates are allowed by design.';

comment on column public.saved_words.equivalent_note is
  'Optional note shown when there is no direct equivalent in the target language (e.g. "No exact match — closest cousin").';

-- Indexes ------------------------------------------------------------------

create index saved_words_user_created_idx
  on public.saved_words (user_id, created_at desc);

create index saved_words_user_source_lang_idx
  on public.saved_words (user_id, source_lang);

create index saved_words_user_pair_idx
  on public.saved_words (user_id, source_lang, target_lang);

-- RLS: profiles ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- (No DELETE policy: profile deletion happens via cascade from auth.users.)

-- RLS: saved_words ---------------------------------------------------------

alter table public.saved_words enable row level security;
alter table public.saved_words force row level security;

create policy saved_words_select_own on public.saved_words
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy saved_words_insert_own on public.saved_words
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy saved_words_delete_own on public.saved_words
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- (No UPDATE policy: saved entries are immutable.)
