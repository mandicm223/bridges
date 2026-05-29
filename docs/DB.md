# Bridges — Database Schema (Supabase / Postgres)

> Companion to `PRD.md` and `Tech.md`. This document specifies the Postgres schema, Row-Level Security policies, indexes, and migrations for Bridges.
>
> **Version:** 1.0 (May 2026)
> **Database:** Supabase Postgres (managed)
> **Project ID:** `gsjwlfseujfbavzegemp`

---

## 1. Design Principles

The schema is intentionally **minimal** — the PRD chose simplicity at every fork:

- Two app tables only: `profiles` and `saved_words`.
- **Flat columns** for saved entries (PRD §5.7, scoping decision Q19) — no JSONB blob, no joins.
- **Duplicates are allowed** in `saved_words` (PRD §5.7) — no unique constraint across `(user_id, word, source_lang, target_lang)`.
- **No notes, no tags, no favourites** (PRD §5.7).
- **No global cache table** — lookups are not persisted unless the user saves them (PRD §5.4).
- **No error/log tables** at v1 — error metadata is captured as structured server logs only (PRD §8.5, Tech.md §15).
- **RLS is enabled and `FORCE`d** on every user-owned table.
- All identifiers are **lowercase, snake_case**; tables are plural.
- `auth.uid()` is wrapped in `(select auth.uid())` inside every policy (Supabase RLS performance best practice).
- Every column used in an RLS policy is indexed.

---

## 2. Entity Diagram

```
┌────────────────────────────┐
│  auth.users                │   ← managed by Supabase Auth
│  ─────────────────────────  │
│  id           uuid (PK)    │
│  email        text         │
│  ...                       │
└──────────┬─────────────────┘
           │ 1:1
           ▼
┌──────────────────────────────────────────────────────────┐
│  public.profiles                                         │
│  ──────────────────────────────────────────────────────  │
│  id                       uuid PK,FK→auth.users.id   ON DELETE CASCADE
│  display_name             text NULL                  (optional)
│  native_language          native_language_code NOT NULL
│  onboarding_completed_at  timestamptz NULL
│  created_at               timestamptz NOT NULL DEFAULT now()
│  updated_at               timestamptz NOT NULL DEFAULT now()
└──────────┬───────────────────────────────────────────────┘
           │ 1:N
           ▼
┌────────────────────────────────────────────────────────────────┐
│  public.saved_words                                            │
│  ──────────────────────────────────────────────────────────────│
│  id                bigint PK GENERATED ALWAYS AS IDENTITY      │
│  user_id           uuid NOT NULL FK→profiles.id  ON DELETE CASCADE│
│  word              text NOT NULL                               │
│  source_lang       language_code NOT NULL                      │
│  target_lang       language_code NOT NULL                      │
│  english_meaning   text NOT NULL                               │
│  cultural_context  text NULL                                   │
│  example_sentence  text NOT NULL                               │
│  equivalent_text   text NOT NULL                               │
│  equivalent_note   text NULL                                   │
│  created_at        timestamptz NOT NULL DEFAULT now()          │
│                                                                │
│  CHECK (char_length(word) BETWEEN 1 AND 300)                   │
│  CHECK (source_lang <> target_lang)                            │
└────────────────────────────────────────────────────────────────┘
```

There is no separate `lookups` table. Un-saved lookups don't touch the database — they live in the request/response cycle and (optionally, client-side) in `localStorage` (Tech.md §8.4).

---

## 3. Enums

### 3.1 `language_code` — pair languages

The three languages that can be one half of an active language pair. English is **deliberately excluded** because English is never a pair language (PRD §1).

```sql
create type public.language_code as enum ('sr', 'hu', 'de');
```

### 3.2 `native_language_code` — captured at sign-up

The user's native language. Restricted to the three supported pair languages (PRD §5.9, scoping decision Q22). A user whose actual native tongue is neither Serbian, Hungarian, nor German picks the one closest to their relationship to the app.

```sql
create type public.native_language_code as enum ('sr', 'hu', 'de');
```

> **Note:** at v1 this enum has the same members as `language_code`. We keep two enums on purpose: their *domains* are different — `language_code` describes a pair language (where English is deliberately excluded), while `native_language_code` describes a user-profile attribute (which may evolve independently in the future, e.g. by adding `'en'` if the audience grows). Keeping them separate now avoids a destructive enum split later.

---

## 4. Tables

### 4.1 `public.profiles`

Extends `auth.users` 1:1 with Bridges-specific user attributes.

```sql
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
  'Set when the user finishes the /welcome flow (PRD §5.1, §6.5). NULL means onboarding is still pending; (app) layout uses this to gate access.';
```

Notes:

- The primary key **is** `auth.users.id` (not a separate identity column). This locks the relationship to exactly 1:1 and lets every other table reference `auth.users` indirectly via `profiles.id` for cleaner cascades.
- `on delete cascade` ensures hard account deletion (PRD §5.10) cleans up the profile row when the auth user is deleted.
- `native_language` is `not null` **with no default**. The sign-up flow always provides one of `'sr' | 'hu' | 'de'`; there is no sensible default we could pick on the user's behalf. A lazy/recovery profile creation path (rare) must therefore also collect the value first — typically by routing the user through `/welcome` with an explicit pick.
- `onboarding_completed_at` is **nullable** and starts `NULL`. The `/welcome` server action sets it to `now()` on completion. The `(app)` layout (Tech.md §4.2) redirects to `/welcome` whenever this column is null.

### 4.2 `public.saved_words`

The user's personal dictionary. Each row is a frozen snapshot of an AI lookup result the user chose to save.

```sql
create table public.saved_words (
  id                bigint primary key generated always as identity,
  user_id           uuid not null references public.profiles (id) on delete cascade,

  -- The lookup
  word              text not null,
  source_lang       public.language_code not null,
  target_lang       public.language_code not null,

  -- The AI result snapshot
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
  'Private personal dictionary entries. Each row is an immutable snapshot of the AI lookup result at the time it was saved. Duplicates are allowed by design.';

comment on column public.saved_words.equivalent_note is
  'Optional note shown when there is no direct equivalent in the target language (e.g. "No exact match — closest cousin").';
```

Notes on the design:

- **`id bigint generated always as identity`** is the SQL-standard, recommended PK for a single-database app at this scale (Supabase best practice). We do **not** use random UUIDs (v4) — they fragment the index — and we don't need UUIDv7 because IDs are never exposed outside the authenticated user's own surface.
- **`user_id` references `profiles(id)`** (which itself references `auth.users.id`). Cascading deletes propagate correctly: deleting the auth user → cascades to `profiles` → cascades to `saved_words`.
- **No unique constraint** on `(user_id, word, source_lang, target_lang)`. PRD §5.7 explicitly allows duplicate saves.
- **`cultural_context` and `equivalent_note` are nullable** because the AI result schema makes them optional (PRD §5.4, scoping decision Q5).
- **`CHECK (source_lang <> target_lang)`** mirrors the API-layer validation: a pair always has two distinct languages.
- **`CHECK (char_length(word) between 1 and 300)`** mirrors the input-length limit (PRD §5.3, scoping decision Q4).
- No `updated_at` — saved entries are immutable snapshots (PRD §5.7).

---

## 5. Row-Level Security

RLS is **enabled and forced** on both tables. Every policy uses `(select auth.uid())` instead of bare `auth.uid()` so the function is evaluated once per query, not once per row.

### 5.1 `profiles`

```sql
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Read: a user can read their own profile.
create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Update: a user can update their own profile.
create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Insert: a user can insert exactly one profile row, for themselves.
create policy profiles_insert_own on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Delete: no one can delete a profile directly. Profile deletion happens
-- via cascade when auth.users is deleted.
-- (Deliberately no DELETE policy → all DELETE attempts are rejected.)
```

### 5.2 `saved_words`

```sql
alter table public.saved_words enable row level security;
alter table public.saved_words force row level security;

-- Read: a user can read their own saved words.
create policy saved_words_select_own on public.saved_words
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Insert: a user can insert rows scoped to themselves.
create policy saved_words_insert_own on public.saved_words
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Delete: a user can delete their own saved words.
create policy saved_words_delete_own on public.saved_words
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Update: saved entries are immutable snapshots (PRD §5.7).
-- (Deliberately no UPDATE policy → all UPDATE attempts are rejected.)
```

### 5.3 Why `FORCE ROW LEVEL SECURITY`

Without `FORCE`, table owners (and roles with `BYPASSRLS`) skip policies. Supabase's `postgres` role is a table owner; `FORCE` closes that hole so the policy is always evaluated.

---

## 6. Indexes

Every column used in an RLS policy or in a common access path gets an index.

```sql
-- Fast RLS check + chronological listing on /dictionary.
create index saved_words_user_created_idx
  on public.saved_words (user_id, created_at desc);

-- Filter by language on /dictionary.
create index saved_words_user_source_lang_idx
  on public.saved_words (user_id, source_lang);

-- Filter by pair (source + target) on /dictionary.
create index saved_words_user_pair_idx
  on public.saved_words (user_id, source_lang, target_lang);
```

### 6.1 Search (deferred)

PRD §5.7 sets the search scope to **the `word` column only** — a case-insensitive substring match. At v1 dictionary sizes (tens to low hundreds of rows per user) a simple `ilike` against `word`, scoped by `user_id` (already indexed via `saved_words_user_created_idx`), is fast enough without a special index. If/when dictionaries grow, the upgrade path is a **trigram (`pg_trgm`) GIN index** on `word`:

```sql
-- Deferred. Enable when search performance becomes a concern.
-- create extension if not exists pg_trgm;
-- create index saved_words_word_trgm_idx
--   on public.saved_words using gin (word gin_trgm_ops);
```

This is not part of v1 migrations.

---

## 7. Triggers

### 7.1 Profile auto-creation on sign-up

The sign-up form **inserts the profile row explicitly from a Next.js Server Action** after `auth.signUp(...)` succeeds (Tech.md §6.2). This keeps profile creation observable in app code and lets us record `native_language` in the same transaction the user submitted.

We **do not** add a `handle_new_user` Postgres trigger on `auth.users`. Reasons:

- We need `native_language` at insert time; a trigger has no way to know that value.
- Triggers on `auth.users` are an implicit, hidden mechanism. Server-action inserts are explicit and easier to debug.

If the explicit insert ever fails (e.g. transient network error after the auth user was created), the next authenticated request can detect the missing profile and create it lazily. That recovery path is application-level, not database-level.

### 7.2 `updated_at` maintenance on `profiles`

```sql
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
```

(`saved_words` has no `updated_at` because rows never update.)

---

## 8. Migration File

The full v1 schema lives in a single migration. Path: `supabase/migrations/20260528120000_init_schema.sql`.

```sql
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
```

---

## 9. TypeScript Types (Reference)

These mirror the schema and are useful for the app code. Final source of truth will be auto-generated via `supabase gen types typescript` (or the MCP equivalent), but for documentation:

```ts
export type LanguageCode = "sr" | "hu" | "de";
export type NativeLanguageCode = "sr" | "hu" | "de";

export interface Profile {
  id: string;                              // uuid, same as auth.user.id
  display_name: string | null;
  native_language: NativeLanguageCode;
  onboarding_completed_at: string | null;  // ISO timestamp; null = still pending
  created_at: string;
  updated_at: string;
}

export interface SavedWord {
  id: number;                         // bigint
  user_id: string;                    // uuid
  word: string;
  source_lang: LanguageCode;
  target_lang: LanguageCode;
  english_meaning: string;
  cultural_context: string | null;
  example_sentence: string;
  equivalent_text: string;
  equivalent_note: string | null;
  created_at: string;
}
```

The shape of a saved word is **identical** to the AI response (`/api/lookup` — see Tech.md §5.1), with the addition of `id`, `user_id`, and `created_at`. This 1:1 mapping is intentional: saving a result is just an insert of what the user is already looking at.

---

## 10. Things Explicitly Not in the Schema (v1)

Each of these was considered and deliberately left out — these are the boundary lines for v1.

| Not present | Why |
|---|---|
| `lookups` / global result cache table | PRD §5.4: every lookup is a fresh AI call. |
| `tags`, `notes`, `favourites` columns on `saved_words` | PRD §5.7: no user-added metadata. |
| Unique constraint on saves | PRD §5.7: duplicates intentionally allowed. |
| `updated_at` on `saved_words` | Saved entries are immutable. |
| `lookup_errors` / `api_logs` tables | Error metadata is emitted as structured `console.error` JSON from the Route Handler and read via Vercel logs (Tech.md §15). No DB table at v1; the upgrade path stays open. |
| Rate-limit counters | PRD §10: no rate limits at v1. |
| `auth.users` trigger to auto-create profile | See §7.1 — server action is preferred. |
| Trigram (`pg_trgm`) indexes | See §6.1 — not needed at v1 dictionary sizes. |
| Service-role-only tables / functions | Tech.md §11: app never uses service role. |
| `is_admin` / role columns | Single-role app (PRD §2). |
| Shared / paired dictionaries between users | Explicitly out of scope (PRD §4). |

---

## 11. Operational Notes

- **Apply this migration** to the Supabase project via the Supabase MCP (`apply_migration`) or `supabase db push` once the migration file exists at `supabase/migrations/20260528120000_init_schema.sql`.
- **Disable "Confirm email"** in the Supabase Auth settings (PRD §5.9, §10).
- **Generate the auth-hook secret** in Supabase → Authentication → Hooks → Send Email, and put it in `.env.local` as `SUPABASE_AUTH_HOOK_SECRET`.
- After this migration, **regenerate Supabase TypeScript types** so `Database` types in the SSR client are up-to-date.
- **Session expiry is not configured at v1.** PRD §5.9's original "1-week sliding window" required Supabase Pro's "Inactivity timeout"; on the Free plan the setting is not available, so sessions persist until the user signs out (or changes password, or deletes account). Revisit on Pro upgrade — Tech.md §6.3.

---

*DB.md v1.1 — generated May 2026.*
