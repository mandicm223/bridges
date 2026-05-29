# Bridges — Technical Architecture & Implementation

> Companion to `PRD.md`. This document describes **how** Bridges is built — stack, services, folder structure, data flow, and deployment.
>
> **Version:** 1.0 (May 2026)
> **Status:** Reflects current scaffolding + planned implementation
> **Audience:** Engineers building or reviewing the app

---

## 1. Stack Summary

| Layer | Choice | Version installed | Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.2.6` | ⚠️ Next.js 16 renamed `middleware.ts` → `proxy.ts`. We use the new convention. |
| **UI runtime** | React + React DOM | `19.2.4` | RSC + Client Components. |
| **Language** | TypeScript | `^5` | `strict: true`. |
| **Styling** | Tailwind CSS v4 | `^4` | Configured via `@tailwindcss/postcss`. CSS variables for theming. |
| **Components** | shadcn/ui | `^4.8.2` | Style preset: `base-nova` (see `components.json`). Already installed: `Button`. Add others (Input, Dialog, DropdownMenu, Card, Toast, etc.) on demand via the shadcn MCP. |
| **Icons** | lucide-react | `^1.17.0` | |
| **Theme switching** | next-themes | `^0.4.6` | `ThemeProvider` already wired in `app/layout.tsx`. |
| **UI primitives helper** | `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge` | — | Already wired by shadcn. |
| **Database + Auth** | Supabase (managed Postgres) | `@supabase/supabase-js ^2.106.2`, `@supabase/ssr ^0.10.3` | Project ID: `gsjwlfseujfbavzegemp` (from `.env.local`). |
| **Email** | Resend | `^6.12.4` | Wired to Supabase's "Send Email" Auth Hook via `app/api/auth/send-email/route.ts`. |
| **Webhook verification** | `standardwebhooks` | `^1.0.0` | Verifies Supabase auth-hook signature. |
| **AI** | OpenRouter | — (HTTP only) | Called server-side from a Next.js Route Handler. Model is selected via the `OPENROUTER_MODEL` env var (default: `openai/gpt-5.4`). |
| **Voice (STT + TTS)** | Web Speech API | — | Browser-native. No server-side fallback at v1. |
| **Hosting** | Vercel + Supabase | — | Default for v1. |

There are **no test runners, no state-management libraries, no form libraries, no validation libraries** installed yet. We will add **Zod** for response validation when we wire the AI route handler (see §5.4). React Server/Client Components + native form behaviour are enough for v1.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│  ┌────────────────────────────┐    ┌─────────────────────────┐   │
│  │  React Client Components   │    │  Web Speech API         │   │
│  │  (lookup UI, mic, save)    │◄──►│  STT + TTS (local)      │   │
│  └─────────────┬──────────────┘    └─────────────────────────┘   │
└────────────────┼─────────────────────────────────────────────────┘
                 │ HTTPS (cookie session)
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                Next.js 16 (Vercel) — SSR + RSC                   │
│                                                                  │
│   proxy.ts      ─── refreshes Supabase session on every request │
│                                                                  │
│   /             ─── lookup screen (RSC shell, Client island)    │
│   /dictionary   ─── saved entries (RSC, reads via Supabase)     │
│   /settings     ─── account (RSC + Client form)                 │
│   /login etc.   ─── auth screens                                 │
│                                                                  │
│   Route Handlers:                                                │
│     POST /api/lookup          ── proxies AI calls (Bridges)     │
│     POST /api/auth/send-email ── Supabase auth hook → Resend    │
│     GET  /auth/confirm        ── exchanges email token          │
└─────┬──────────────────────────────────────┬─────────────────────┘
      │                                      │
      ▼                                      ▼
┌──────────────────┐                ┌──────────────────────────┐
│   OpenRouter     │                │  Supabase                │
│   (gpt-5.4 by    │                │  - Auth                  │
│    default)      │                │                          │
│                  │                │  - Postgres (RLS)        │
│   Server-only    │                │  - Auth Hooks → Resend   │
└──────────────────┘                └────────────┬─────────────┘
                                                 │
                                                 ▼
                                       ┌──────────────────┐
                                       │  Resend          │
                                       │  Transactional   │
                                       │  email           │
                                       └──────────────────┘
```

**Trust boundary:** anything that needs a secret (OpenRouter API key, Supabase service role, Resend API key, Supabase auth-hook secret) runs **only** inside Next.js server code — Route Handlers, Server Components, or `proxy.ts`. The browser never sees them.

---

## 3. Folder Structure (planned)

What's marked **(exists)** is already scaffolded. Everything else is to be built.

```
bridges/
├─ app/
│  ├─ layout.tsx                 (exists) ThemeProvider + fonts
│  ├─ page.tsx                   (exists, placeholder) → becomes lookup home
│  ├─ globals.css                (exists)
│  ├─ favicon.ico                (exists)
│  │
│  ├─ (auth)/                    public routes, no session required
│  │  ├─ login/page.tsx
│  │  ├─ signup/page.tsx
│  │  ├─ forgot-password/page.tsx
│  │  └─ reset-password/page.tsx
│  │
│  ├─ (app)/                     authenticated routes (RSC layout gate)
│  │  ├─ layout.tsx              checks session, redirects to /login, also redirects to /welcome if onboarding not complete
│  │  ├─ page.tsx                lookup home (re-exports the same as app/page.tsx, or replaces it)
│  │  ├─ welcome/page.tsx        one-time onboarding (pair pick); auto-redirects to / once completed
│  │  ├─ dictionary/page.tsx
│  │  └─ settings/page.tsx
│  │
│  ├─ auth/
│  │  └─ confirm/route.ts        (exists) email-token exchange
│  │
│  ├─ api/
│  │  ├─ auth/
│  │  │  └─ send-email/route.ts  (exists) Supabase → Resend bridge
│  │  └─ lookup/
│  │     └─ route.ts             NEW — OpenRouter proxy
│  │
│  └─ ...
│
├─ components/
│  ├─ theme-provider.tsx         (exists)
│  ├─ theme-toggle.tsx           (exists)
│  ├─ ui/                        (exists, has button.tsx) — shadcn primitives live here
│  │
│  ├─ lookup/                    NEW — feature components
│  │  ├─ pair-selector.tsx
│  │  ├─ lookup-form.tsx         input + mic + submit + source-lang dropdown
│  │  ├─ mic-button.tsx          Web Speech API wrapper
│  │  ├─ result-card.tsx
│  │  ├─ play-button.tsx         TTS wrapper
│  │  ├─ recent-lookups.tsx      localStorage-backed
│  │  └─ save-button.tsx
│  │
│  ├─ welcome/                   NEW
│  │  └─ welcome-form.tsx        client island for the /welcome pair picker
│  │
│  ├─ dictionary/
│  │  ├─ saved-list.tsx
│  │  ├─ saved-card.tsx
│  │  └─ search-filters.tsx
│  │
│  └─ auth/
│     ├─ login-form.tsx
│     ├─ signup-form.tsx
│     ├─ forgot-password-form.tsx
│     └─ reset-password-form.tsx
│
├─ lib/
│  ├─ utils.ts                   (exists) shadcn `cn()` helper
│  │
│  ├─ ai/                        NEW
│  │  ├─ openrouter.ts           fetch wrapper, model config
│  │  ├─ prompt.ts               system prompt + user-prompt builder
│  │  └─ schema.ts               Zod schema for AI response
│  │
│  ├─ db/                        NEW — thin typed Supabase helpers
│  │  ├─ saved-words.ts          CRUD for dictionary entries
│  │  └─ profile.ts              read/update user profile
│  │
│  ├─ speech/                    NEW
│  │  ├─ stt.ts                  Web Speech API STT wrapper + feature detect
│  │  └─ tts.ts                  SpeechSynthesis wrapper + voice picker
│  │
│  ├─ languages.ts               NEW — language metadata (code, flag, name, BCP-47)
│  ├─ recent-lookups.ts          NEW — localStorage history (max 20)
│  └─ types.ts                   NEW — shared TS types
│
├─ utils/
│  ├─ supabase/
│  │  ├─ client.ts               (exists)
│  │  ├─ server.ts               (exists)
│  │  └─ middleware.ts           (exists) named for legacy, used from proxy.ts
│  └─ email/
│     ├─ resend.ts               (exists)
│     └─ templates.ts            (exists)
│
├─ supabase/                     NEW
│  └─ migrations/                SQL migrations (see DB.md)
│
├─ proxy.ts                      (exists) — Next.js 16 replacement for middleware.ts
├─ next.config.ts                (exists)
├─ tsconfig.json                 (exists, alias @/* → ./*)
├─ components.json               (exists, shadcn config: "base-nova")
├─ eslint.config.mjs             (exists)
└─ docs/
   ├─ PRD.md
   ├─ Tech.md                    ← this file
   └─ DB.md
```

---

## 4. Routing & Rendering Strategy

### 4.1 Next.js 16 specifics (don't fall back to old habits)

- **`proxy.ts` is the new `middleware.ts`.** Same shape, same matcher config, same `NextResponse` ergonomics — just the filename and conceptual framing changed. Always read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` if in doubt. The project already has a working `proxy.ts` that calls `utils/supabase/middleware.ts` to refresh the auth session.
- **App Router only.** No `pages/` directory. All routes are under `app/`.
- **Route Handlers** (not API Routes) — `app/api/**/route.ts` with named HTTP exports (`GET`, `POST`, …).
- **Server Components by default.** Only mark a component `"use client"` when it needs interactivity (mic, TTS, save button, dropdown state, localStorage).

### 4.2 Route groups

We use two App Router **route groups** to split public vs. authenticated layouts without adding URL prefixes:

- `app/(auth)/...` — public auth pages. Layout is minimal.
- `app/(app)/...` — authenticated pages. Layout fetches the Supabase user via `createClient(cookieStore).auth.getClaims()` and:
  1. **Redirects to `/login`** if there is no session. This is the server-side authorization gate. (Proxy handles session refresh only — it does **not** decide redirects, per Next.js 16 guidance that proxy should not act as a full auth solution.)
  2. **Redirects to `/welcome`** if the session exists but the user's `profiles.onboarding_completed_at` is null — except when the requested route already *is* `/welcome`. This ensures the one-time onboarding (PRD §5.1, §6.5) gates the rest of the app exactly once.
  3. The `/welcome` page itself, on mount, checks the same flag and **redirects back to `/`** if onboarding is already complete — so visiting `/welcome` after the first run never re-shows it.

### 4.3 Rendering pattern for the lookup screen

`app/(app)/page.tsx` is a **Server Component** that:

1. Reads the authenticated user.
2. Reads the user's `native_language` from the `profiles` table.
3. Renders a Client Component island (`<LookupExperience initialNativeLanguage={...} />`) that owns the entire interactive flow: pair selector, input, mic, result, save, recent-lookups.

The result card itself is a presentational Client Component fed by state in `<LookupExperience />`. State is local React state (no Zustand / Jotai / Redux at v1).

### 4.4 Dictionary

`app/(app)/dictionary/page.tsx` is a **Server Component** that fetches the user's saved entries from Supabase with RLS-scoped queries. The list itself is rendered server-side for fast first paint; per-card interactions (delete) hit a small Client island.

---

## 5. AI Lookup Pipeline

This is the heart of the product. Every lookup follows the same path.

### 5.1 Client → server contract

The lookup form (Client Component) POSTs to `/api/lookup`. The client sends **only** session-scoped values; the user's `native_language` is read by the server from the authenticated user's profile, so the client never needs to send it (and can't tamper with it).

```ts
// Request
{
  word: string,           // up to 300 chars, trimmed
  sourceLang: "sr" | "hu" | "de",
  targetLang: "sr" | "hu" | "de"   // the *other* pair-language
}

// Response (200)
{
  word: string,
  sourceLang: "sr" | "hu" | "de",
  targetLang: "sr" | "hu" | "de",
  englishMeaning: string,
  culturalContext?: string,         // optional — see PRD §5.4
  exampleSentence: string,
  equivalent: {
    text: string,
    note?: string                   // e.g. "No direct equivalent — closest cousin"
  }
}

// Response (4xx / 5xx)
{ error: { code: string, message: string } }
```

### 5.2 Server flow (`app/api/lookup/route.ts`)

1. **Auth check.** Read the Supabase session via the SSR client. If no user → `401`.
2. **Input validation.** Zod-parse the body. `word` must be 1–300 chars after trim. `sourceLang` and `targetLang` must be different and both ∈ `{sr, hu, de}`. Reject otherwise → `400`.
3. **Read the user's `native_language`.** Single-row `select` against `public.profiles` scoped by the authenticated user. If the row is missing (recovery case), default to `sourceLang`. This is the only profile field we touch in the lookup path.
4. **Build the prompt.** `lib/ai/prompt.ts` exports `buildLookupPrompt({ word, sourceLang, targetLang, nativeLanguage })` which returns `{ system, user }` strings. The instructions are **always in English**; `nativeLanguage` is injected as a dynamic variable that tunes empathy and frame of reference (see §5.3). The system prompt asks the model to return **strict JSON** matching the response schema, with optional fields allowed to be omitted.
5. **Call OpenRouter.** Via `lib/ai/openrouter.ts`. The model is read from `OPENROUTER_MODEL` (default `openai/gpt-5.4`); see §5.4. We use the **non-streaming** chat completions endpoint for v1 (PRD §5.3 left streaming as "implementer's choice — simplest path wins").
6. **Parse + validate response.** Strip code fences if present. JSON-parse. Validate against the Zod schema. If the model returned something we can't parse → return a `502` with a friendly error code (`"AI_BAD_OUTPUT"`) and emit an error-metadata log (see §15).
7. **Return.** JSON response to the client. **No caching, no logging of query text** (PRD §8.5).

### 5.3 Prompt design (parameterised)

The prompt is **always written in English** — language of instruction is fixed. What varies per request are four dynamic variables, injected into a single template:

| Variable | Source | Purpose |
|---|---|---|
| `{{word}}` | Request body | The word/phrase the user looked up. |
| `{{sourceLang}}` | Request body | `Serbian` / `Hungarian` / `German` — the language of `{{word}}`. |
| `{{targetLang}}` | Request body | The *other* pair-language — the one the equivalent should be in. |
| `{{nativeLanguage}}` | `profiles.native_language` (server-read) | Drives the **cultural-empathy framing** without changing the language of the response. |

Cultural sensitivity is bound to the `{{nativeLanguage}}` variable, **not** to the prompt's own language. The English explanation reads the same way to all users, but the model is given the audience as context so it can choose examples and connotations that resonate.

Sketch (final wording lives in `lib/ai/prompt.ts`, which is the source of truth):

> *"You are Bridges, a warm cultural translator helping two close people whose native languages differ. The reader of your reply is a native `{{nativeLanguage}}` speaker — calibrate your tone, examples, and emotional framing for how a `{{nativeLanguage}}` speaker is likely to perceive this word.*
>
> *The user looked up the word or short phrase `{{word}}` in `{{sourceLang}}`. Reply in **English** with a JSON object containing: a friendly English meaning; a cultural or emotional context (only when the word genuinely carries cultural weight); a natural example sentence in `{{sourceLang}}`; and the closest equivalent word or phrase in `{{targetLang}}`. If there is no exact equivalent in `{{targetLang}}`, return the closest cultural cousin and set an `equivalent.note` field explaining there is no direct equivalent.*
>
> *Keep the voice intimate and human, never clinical. Never address the user in `{{nativeLanguage}}` — `{{nativeLanguage}}` only informs your empathy, never your output language."*

The prompt builder lives in `lib/ai/prompt.ts`. Its single exported function takes the four variables and returns `{ system, user }` strings ready to send to OpenRouter. The system message contains the persona + JSON-shape contract; the user message contains the literal word/phrase to look up. This split makes prompt injection harder — user input can never overwrite the system frame.

### 5.4 Model selection

The OpenRouter model is read from the `OPENROUTER_MODEL` environment variable at request time. The default is `openai/gpt-5.4`. Switching models is a config change, not a code change.

There is **no automatic fallback to a cheaper model** at v1. If the configured model fails, the user sees the friendly error from §5.5 and can retry manually. (This keeps cost predictable and stops a bad-output loop with a poorly-aligned fallback model.)

### 5.5 Validation library

We will install **Zod** when we wire `/api/lookup`. It is the only new runtime dep needed:

```bash
npm install zod
```

### 5.6 Error handling

The Route Handler maps failures to stable error codes so the client can show friendly messages:

| Code | When | HTTP | UI message |
|---|---|---|---|
| `UNAUTHENTICATED` | No Supabase session | 401 | (handled by redirect; rare) |
| `INVALID_INPUT` | Zod fails | 400 | "That input doesn't look right." |
| `AI_UPSTREAM_ERROR` | OpenRouter 5xx / timeout | 502 | "We couldn't reach the language model just now." + Try again |
| `AI_BAD_OUTPUT` | Response failed schema | 502 | "Something didn't come back right. Try again?" + Try again |
| `INTERNAL` | Anything else | 500 | "Something went wrong on our side." + Try again |

The client renders the message + a manual **Try again** button (PRD §8.4). No silent auto-retry.

---

## 6. Authentication

### 6.1 Current state (already wired)

- **Supabase SSR client** is set up in `utils/supabase/{client,server,middleware}.ts`.
- **Session refresh** happens via `proxy.ts` which calls `supabase.auth.getClaims()` on every matched request.
- **Custom email hook** is wired:
  - Supabase calls `POST /api/auth/send-email` (existing).
  - The route verifies the `standardwebhooks` signature using `SUPABASE_AUTH_HOOK_SECRET`.
  - It resolves the appropriate Bridges-branded template from `utils/email/templates.ts` and dispatches via Resend.
- **One-click email confirmation** is handled by `app/auth/confirm/route.ts` (existing) — it exchanges the `token_hash` from the email for a real session and redirects.

### 6.2 What still needs to be built

- **Sign-up form** (`/signup`) that captures email, password, and `native_language` (a 3-way dropdown: SR / HU / DE). After `supabase.auth.signUp(...)`, we **insert the user's profile row** (`profiles` table — see DB.md) with the chosen `native_language` and `onboarding_completed_at = NULL`. *(Alternatively, a Supabase trigger creates the row; we go with explicit insert from the server action for clarity, since the trigger has no access to the chosen native_language at insert time.)* The sign-up server action then redirects to `/welcome`.
- **Welcome page** (`/welcome`) — server-component shell + a client island that lets the user pick their first pair. On submit, a server action sets `profiles.onboarding_completed_at = now()` for the current user and stores the pair in session state (or a cookie) before redirecting to `/`. The `(app)` layout's onboarding gate (see §4.2) makes this route un-revisitable once completed.
- **Log-in form** (`/login`).
- **Forgot-password form** (`/forgot-password`) that calls `supabase.auth.resetPasswordForEmail()`.
- **Reset-password form** (`/reset-password`) — the user is auto-signed-in by the email link (via `/auth/confirm` with `type=recovery`), and this form just calls `supabase.auth.updateUser({ password })`.
- **No email-verification gate** at sign-up (PRD §10). The user can use the app immediately. Supabase project setting "Confirm email" must be set to **off**.

### 6.3 Sessions

- Sessions are **cookie-based**, managed by `@supabase/ssr`.
- Supabase JWT default lifetime is 1 hour; the `@supabase/ssr` client transparently refreshes them using the refresh token.
- Sessions persist until the user signs out, changes their password, or deletes their account (PRD §5.9). No server-side inactivity timeout at v1 — Supabase's "Inactivity timeout" is a Pro-plan feature and we are on Free. Revisit if/when we upgrade.

### 6.4 Authorization model

Every authenticated route in `app/(app)/...` is protected by the route-group `layout.tsx`, which:

1. Calls `createClient(await cookies()).auth.getUser()` server-side.
2. If `user` is null → `redirect("/login")`.

Per-row authorization (i.e., user A cannot read user B's saved words) is enforced by **Supabase Row Level Security** policies on every user-owned table. See `DB.md` §5.

---

## 7. Voice (Web Speech API)

### 7.1 Speech-to-Text (`lib/speech/stt.ts`)

- Wraps `window.SpeechRecognition || window.webkitSpeechRecognition`.
- `isSupported()` returns false on browsers that don't expose the API (notably Firefox on Linux).
- `recognise({ lang })` opens a single-shot recognition session, returns the transcript as a Promise.
- The `lang` parameter is the **BCP-47 tag** from `lib/languages.ts` (e.g. `sr-RS`, `hu-HU`, `de-DE`).
- The `MicButton` Client Component:
  - Calls `isSupported()` on mount and disables itself + shows a shadcn `Tooltip` if false.
  - On press-and-release: starts STT, populates the parent input with the result, never auto-submits (PRD §5.5).

### 7.2 Text-to-Speech (`lib/speech/tts.ts`)

- Wraps `window.speechSynthesis`.
- `speak({ text, lang })` enumerates `speechSynthesis.getVoices()`, picks the first voice whose `lang` starts with the requested BCP-47 prefix, falls back to the default voice.
- No voice picker, no quality enhancement (PRD §10).
- The `PlayButton` Client Component is silent (no error) if no voice is available — see PRD §5.6.

### 7.3 Why no server-side STT/TTS

OpenAI Whisper + OpenAI TTS would give us consistent quality but: (a) costs add up per-user, (b) adds latency, (c) requires audio upload, (d) increases scope. The PRD explicitly accepts OS-default voice variance as a v1 trade-off.

---

## 8. Personal Dictionary

### 8.1 Save flow

`<SaveButton>` (Client Component) calls a server action (or a thin POST endpoint) that:

1. Reads the current Supabase session.
2. Inserts a row into `saved_words` (see DB.md). All fields are taken from the result currently displayed; **no dedupe** (PRD §5.7).
3. Returns the new row ID. The UI flips to "Saved" and shows a confirmation toast.

### 8.2 List & filter

`/dictionary` is a Server Component that calls:

```ts
supabase
  .from("saved_words")
  .select("*")
  .order("created_at", { ascending: false })
```

RLS limits this automatically to the current user. Search and language/pair filters are URL-query-driven (`?q=...&lang=sr`) so the page is bookmarkable and server-rendered. Search at v1 is a case-insensitive `ilike` against the `word` column **only** (PRD §5.7; trigram index possible later — see DB.md §6).

### 8.3 Delete

`<DeleteButton>` calls a server action that issues `delete().eq("id", …)`. RLS ensures users can only delete their own rows. A toast with Undo restores the entry (client-side; if Undo isn't pressed within 5s, the row stays deleted on the server).

### 8.4 Local recent-lookups

`lib/recent-lookups.ts` exposes `getRecent()`, `pushRecent(entry)`, `clear()`, all reading/writing `localStorage` under the key `bridges.recents.v1`. Max 20 entries, FIFO. Cleared on logout by calling `clear()` from the logout action.

---

## 9. Email (Resend + Supabase Auth Hooks)

Already wired. The path:

1. Supabase Auth (e.g. user signs up or requests password reset) fires its **Send Email** hook → POSTs to our `app/api/auth/send-email/route.ts`.
2. The handler verifies the signature with `standardwebhooks` against `SUPABASE_AUTH_HOOK_SECRET`.
3. It looks up the right template from `utils/email/templates.ts` based on `email_data.email_action_type` (e.g. `signup`, `recovery`, `magiclink`).
4. It dispatches via `resend.emails.send({ from: EMAIL_FROM, to, subject, html })`.

Operational requirements for production:

- `EMAIL_FROM` must be an address on a Resend-verified domain (currently using `onboarding@resend.dev` for dev).
- `SUPABASE_AUTH_HOOK_SECRET` must be set (currently blank in `.env.local`; needs to be generated in the Supabase dashboard before the hook is enabled).

---

## 10. Environment Variables

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Already set. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Already set. The new "publishable" key (replaces the old anon key). |
| `SUPABASE_AUTH_HOOK_SECRET` | `/api/auth/send-email` | Currently blank — needs to be filled in. |
| `RESEND_API_KEY` | `lib/email/resend.ts` | Already set. |
| `EMAIL_FROM` | `lib/email/resend.ts` | Already set; move to a verified domain for prod. |
| `OPENROUTER_API_KEY` | `lib/ai/openrouter.ts` | **NEW — to add.** Server-only. |
| `OPENROUTER_MODEL` | `lib/ai/openrouter.ts` | **NEW — optional.** Defaults to `openai/gpt-5.4`. Override to swap models without code changes. |
| `NEXT_PUBLIC_APP_URL` | email templates, auth redirects | **NEW — to add.** E.g. `http://localhost:3000` in dev, the Vercel URL in prod. |

All `NEXT_PUBLIC_*` keys are safe to expose to the client. Everything else is server-only.

---

## 11. Security

| Concern | Mitigation |
|---|---|
| **AI API key leakage** | OpenRouter key is read only inside `app/api/lookup/route.ts` and never serialized into a client component prop or response body. No public env exposure. |
| **Cross-user data access** | Supabase RLS on every user-owned table (see DB.md §5). Server queries always go through the **user-scoped** SSR client (cookie auth), never a service-role key. We do **not** introduce a service-role client at v1 because we never need to act on behalf of another user. |
| **Auth-hook spoofing** | `standardwebhooks` signature verification on `/api/auth/send-email`. Returns 401 on bad signature. |
| **CSRF on state-changing routes** | Same-origin cookie auth + standard Next.js Route Handlers (no third-party form posts allowed by default). For server actions, Next.js's built-in action ID prevents tampering. |
| **Open redirect** | `/auth/confirm` only follows `next` query params that start with `/` (relative), otherwise treats them as absolute and the URL constructor protects against malformed values. |
| **Prompt injection** | The user-provided `word` is inserted into the user message of the OpenRouter call. We do not allow the user to control the system prompt. The response is always Zod-validated; we never `eval` or unsafely render it. The result card uses React (auto-escaping) — no `dangerouslySetInnerHTML` anywhere. |
| **Rate limits** | None at v1 (PRD §10). Will revisit if abuse appears. The architecture leaves room to add a per-user limiter in `/api/lookup` later (e.g. via Upstash Redis or Supabase). |

---

## 12. Performance

- **First paint:** all authenticated pages are RSC-rendered with the user's data fetched server-side. No client-side waterfall to read the user before showing the screen.
- **Interactive islands:** the lookup form, mic, save button, and result card are Client Components, but they hydrate independently from the rest of the page.
- **No global state library.** State stays in the component tree; this keeps the JS bundle small.
- **Server-side AI call is non-streaming at v1.** Lookup target is 3–5 s; we trade real-time tokens for simpler implementation. Easy to upgrade to streaming later by swapping the route handler implementation and returning a `ReadableStream`.
- **No image-heavy UI.** Mostly typography and small flag icons (Lucide / inline SVG).

---

## 13. Accessibility

- shadcn/ui primitives are built on Radix / base-ui — they ship with accessible defaults (focus management, ARIA, keyboard nav).
- Every icon-only button (`🎙`, `🔊`, `＋`, delete) gets an `aria-label`.
- Color tokens are Tailwind semantic vars (`bg-background`, `text-foreground`, …) so we don't accidentally fail contrast in dark mode.
- Forms use real `<label>` elements paired with their `<input>` via `htmlFor`.
- The lookup result card sets `aria-live="polite"` so screen readers announce new results.

---

## 14. Deployment

### 14.1 Hosting

- **Frontend / Route Handlers / Server Components:** Vercel.
- **Database / Auth / Email-hook target:** Supabase (managed Postgres).
- **Transactional email:** Resend.
- **AI:** OpenRouter (hosted; no infra of our own).

### 14.2 Environments

- **Local:** `npm run dev`. Uses `.env.local`. Supabase project is the same one as production at v1 (no separate staging project — accepted simplification). Test users live alongside real users; this is acceptable while we have no real users.
- **Production:** Vercel project pointing at `main`. Env vars set in the Vercel dashboard.

### 14.3 Database migrations

- SQL migrations live under `supabase/migrations/` (see DB.md).
- Applied to the remote Supabase project via the **Supabase MCP tool** (`apply_migration`) or, locally, via the Supabase CLI if/when we adopt local development.

### 14.4 CI

Not in scope for v1 beyond what Vercel runs on every deploy (`next build`, ESLint via `next lint`).

---

## 15. Observability

At v1, observability is **lightweight error-metadata logging** — emitted as structured `console.error` JSON from the `/api/lookup` Route Handler and surfaced through Vercel's built-in log drain. No Sentry, no analytics, no third-party trackers, no DB-backed `lookup_errors` table.

### What we log (errors only)

When a lookup call fails (`AI_UPSTREAM_ERROR`, `AI_BAD_OUTPUT`, `INTERNAL`, or a timeout):

```ts
console.error(JSON.stringify({
  event: "lookup_error",
  error_code: "AI_UPSTREAM_ERROR",   // stable code, matches §5.6 table
  status: 502,                        // HTTP status returned to the client
  upstream_status: 503,               // OpenRouter's response status, when known
  latency_ms: 4123,                   // time from request start to error
  model: "openai/gpt-5.4",            // OPENROUTER_MODEL value at the time
  user_id: "...uuid...",              // authenticated user's id
  timestamp: "2026-05-28T14:11:09Z"
}))
```

### What we **never** log

- The user's `word` (query text).
- The AI's response body.
- Any saved-word content, profile content, or email addresses.
- Successful lookups (no telemetry on happy paths at v1).

### Why this shape

- **Enough signal to debug** — model outages, schema-validation regressions, and latency spikes are all diagnosable from this metadata.
- **No persistence layer to manage** — `console.error` flows into Vercel's logs without any new infra, RLS policies, or retention concerns.
- **Privacy-preserving by construction** — query text simply isn't in the payload; there is no field to accidentally turn on.

### Upgrade path

If/when richer observability is needed: introduce Sentry (with `beforeSend` stripping any `word` field that ever appears in scope), or add a `lookup_errors` table in Supabase (RLS: insert-only for `authenticated`, no select). Both upgrades preserve the "no query text ever" invariant.

---

## 16. Things to NOT Do (Common Pitfalls)

1. **Don't create `middleware.ts`.** This Next.js version uses `proxy.ts`. (See `.cursor/rules/`-level rule and `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.)
2. **Don't call OpenRouter from a Client Component.** The API key must stay server-side. The only entry point is `/api/lookup`.
3. **Don't introduce a Supabase service-role key on the client or in Route Handlers** at v1. We have no operation that needs to bypass RLS.
4. **Don't add a result cache** (per PRD §5.4). Lookups stay fresh.
5. **Don't dedupe dictionary saves** (per PRD §5.7). Duplicates are intentional.
6. **Don't invent new UI primitives.** Check `components/ui/` first; if it's missing, pull it via the shadcn MCP using the `base-nova` preset.
7. **Don't hardcode colours.** Use Tailwind semantic tokens (`bg-card`, `text-muted-foreground`, …) so theme switching works automatically.
8. **Don't add streaming or rate-limiting** without first revisiting the PRD's "Accepted Risks" section — they're conscious v1 choices, not oversights.
9. **Don't log the user's query text.** The only telemetry at v1 is structured error metadata (see §15). The `word` field is not in that payload by design; do not add it.
10. **Don't add a `lookup_errors` table or Sentry** without revisiting §15's "Upgrade path" — both are deliberately out of v1 to keep the privacy story simple.

---

*Tech.md v1.1 — generated May 2026.*
