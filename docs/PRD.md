# Bridges — Product Requirements Document (PRD)

> A personal language companion for couples who speak different native tongues.
>
> **Version:** 1.0 (May 2026)
> **Status:** Draft for build
> **Scope:** v1 launch

---

## 1. Vision & Positioning

Bridges is a warm, personal web application for two close people — typically a couple — who each speak a different native language and use English as their shared communication layer.

It is **not** a translation tool. It is a **cultural understanding tool**. Where a translator answers *"what is the word?"*, Bridges answers *"what does that word **mean** to the person who grew up with it?"*

The product's north-star example is the Serbian word **"merak"** — a concept with no direct English translation. Bridges explains its emotional weight, gives it cultural context, and surfaces what a Hungarian speaker would naturally reach for instead.

### Supported languages

- **Serbian (SR)**
- **Hungarian (HU)**
- **German (DE)**

**English (EN)** is always the silent explanation layer. It is never one half of a translation pair, but it is always present as the language the app uses to explain meaning.

### Primary goal

Help two people understand each other more deeply by going beyond literal translation — surfacing the cultural soul of words and phrases, in a tool that feels personal and warm, not clinical.

---

## 2. Target Users

Bridges is a **single-role application**. There are no admins, moderators, or shared accounts. Every authenticated user has the same access and the same capabilities.

### Primary persona

A person in a close relationship (romantic partnership or close friendship) where each side has a different native language among Serbian, Hungarian, or German. They use the app:

- **On their phone, mid-conversation** — to look something up the moment a word surfaces.
- **On the desktop, reflecting later** — revisiting a word from earlier and saving it.

### Out of persona

- Language learners cramming vocabulary (not the target use case).
- Tourists needing fast phrasebook translations.
- Linguists or academics needing rigorous etymology.

The tone everywhere should feel **intimate and curious**, not pedagogical.

---

## 3. Core Features (v1)

| # | Feature | Summary |
|---|---------|---------|
| 1 | **Language pair selector** | User picks two of {SR, HU, DE} for the session. English is always active as the explanation layer. |
| 2 | **Word / phrase lookup** | Type (or speak) a word or short phrase in either selected language and receive a full cultural breakdown. |
| 3 | **Voice input (STT)** | Speak the word into the app using the browser's speech-to-text. Source language is set via a dropdown before speaking. |
| 4 | **Voice output (TTS)** | Hear any word or phrase pronounced in its source language. |
| 5 | **Rich result card** | Translation, English explanation, cultural context (when relevant), an example sentence, and the closest equivalent in the other selected language. |
| 6 | **Personal dictionary** | Save lookups privately. Browse, search, and delete saved entries. |
| 7 | **Recent lookups (local)** | Last 20 lookups on this device are remembered automatically. |
| 8 | **Authentication** | Email + password via Supabase. Private, single-user accounts. |

---

## 4. Out of Scope (v1)

The following are explicitly **not** part of v1:

- Shared or paired dictionaries between two users.
- Word-of-the-day, push notifications, or email digests.
- Flashcards or spaced repetition.
- Community submissions or public word contributions.
- Languages beyond Serbian, Hungarian, German (+ English).
- Native iOS / Android apps.
- Offline mode.
- OAuth / social login.
- Email verification at sign-up (accepted risk for v1 — see §10).
- Per-user usage limits / rate limiting (accepted risk for v1 — see §10).
- Re-translating or refreshing saved entries (saved = immutable snapshot).
- Tags, notes, or any user-added metadata on saved entries.

---

## 5. Functional Requirements

### 5.1 Onboarding & first run

- After sign-up, the user is sent to a **dedicated full-screen welcome route** (`/welcome`).
- The welcome screen introduces Bridges in a couple of warm sentences and walks the user through picking their **first language pair** (e.g. SR ↔ HU).
- Once a pair is picked the user is redirected to the home screen (`/`) with that pair active for the session.
- The welcome screen is shown **exactly once** per account — completion is recorded on the user's profile (see §5.10 and DB schema) and the route auto-redirects to `/` on subsequent visits.
- From that point on, every session starts with **no pair selected** (per §5.2). Picking a pair becomes a 1-tap action on the home screen, not a special onboarding moment.

### 5.2 Language pair selector

- The user must pick a **pair** from `{SR, HU, DE}`. Three valid combinations exist: SR↔HU, SR↔DE, HU↔DE.
- English is **not selectable** as part of the pair.
- The active pair is **per-session only** — it does not persist across reloads, sessions, or devices. Each visit starts fresh.
- The pair is **easily changeable mid-session** from the lookup screen.
- Changing the pair does **not** clear the result card on screen (the user may want to keep reading), but the next lookup uses the new pair.

### 5.3 Lookup input

- Single text input on the home screen.
- Accepts **free text up to ~300 characters** (word, short phrase, or sentence-length input).
- A **source-language dropdown** sits adjacent to the input. Its value tells the app which of the two pair-languages the user is typing or speaking in.
- Source-language dropdown **defaults to the user's native language** (captured at sign-up; see §5.8). If the user's native language is English or not one of the supported three, the default falls back to the left-hand language of the active pair.
- Lookup is triggered by:
  - Pressing Enter, or
  - Tapping the **Look up** button.
- While a lookup is in flight, the input is **locked** and a clear loading state is shown. There is **no Cancel button** — the user simply waits for the result or the timeout. This keeps the UX calm and the implementation simple at v1.

### 5.4 The result card

Every lookup returns a single result card with the following fields. **Fields are optional** — the AI may omit a field when it isn't relevant (e.g. no cultural note for a word like "cat"). The explanation is **always in English**, but its tone is calibrated by the user's `native_language` so the explanation reads with empathy for how that native speaker is likely to perceive the word (see Tech.md §5.3 for how this is implemented).

| Field | Always present? | Description |
|-------|-----------------|-------------|
| **Word / phrase** (as entered) | Yes | Rendered large and prominent. |
| **Source language** | Yes | Shown with flag + name. |
| **English meaning** | Yes | A plain, friendly, everyday explanation. |
| **Cultural / emotional context** | No | When the word carries cultural weight, this block explains it. Collapsible on mobile if long. |
| **Example sentence** | Yes | A natural sentence in the **source language**, demonstrating use. |
| **Closest equivalent** in the other pair-language | Yes | The closest cultural cousin, with a clear note when no exact equivalent exists. |
| **🔊 Pronounce buttons** | Yes | One on the source word, one on the equivalent. |
| **＋ Save to dictionary** | Yes | Adds the result to the user's private dictionary. |

#### When there is no direct equivalent

When the other pair-language has no exact match (the "merak" case), the card **must** still show a closest cultural cousin **and** an explicit note that it isn't an exact equivalent. The card never refuses to answer.

#### Result rendering

- Results are displayed in a clear, readable **card** format directly below the input.
- Results are **not cached globally** between users. Each lookup is a fresh AI call.
- Results are **not cached per user** either — the same user looking up the same word again triggers a new call (this keeps cultural notes feeling alive and avoids stale cache bugs at v1 scale).

### 5.5 Voice input (Speech-to-Text)

- Microphone button is adjacent to the text input.
- The **source-language dropdown** determines which language the speech recogniser listens for.
- Uses the **browser-native Web Speech API**.
- Recognised speech populates the text input — the user **confirms by pressing Look up**, not by speaking the trigger. This avoids accidental lookups and preserves the "review before submitting" flow.
- On browsers that don't support the API: the mic button is **visible but disabled**, with a tooltip explaining why (e.g. "Voice input isn't supported in this browser — try Chrome or Safari").

### 5.6 Voice output (Text-to-Speech)

- A 🔊 button appears next to:
  - The source word/phrase in the result card.
  - The closest equivalent in the other language.
- Uses the **browser-native Web Speech API** (SpeechSynthesis).
- The voice is selected per-language based on what's available on the user's device — **the OS default for that language is used as-is**. No voice picker, no quality fallback at v1.
- If a language voice isn't available locally, the button gracefully does nothing visible beyond a brief shake / muted state.

### 5.7 Personal dictionary

The dictionary is the user's **private, persistent** collection of saved lookups.

#### Saving

- Tapping **＋ Save** on any result card immediately persists it.
- **Duplicates are allowed.** If the user looks up and saves the same word twice, two entries exist. No dedupe, no "already saved" toast.
- A saved entry is a **frozen snapshot** of the AI result at the moment of saving — including all fields the AI returned. The saved card never re-fetches or refreshes.
- **No user-added metadata.** No personal notes, no tags, no favourites. The brief explicitly chose minimalism here.

#### Browsing

The dictionary view (`/dictionary`) supports:

- **Listing** all saved entries, most recent first.
- **Search** by the word/phrase itself only — a case-insensitive substring match against the saved word. Search does not look inside the English meaning, cultural context, example, or equivalent fields.
- **Filter** by language (any of SR/HU/DE) and/or by pair.
- **Expand** any card to see the full result (same shape as the original lookup card, minus the Save button — which becomes "Saved").
- **Delete** any entry, with a single-step confirmation (toast with Undo).
- **Empty state** when there are zero entries: a warm prompt encouraging the user to do their first lookup, with a CTA back to the home screen.

#### Privacy

All saved entries are **private to the authenticated user**. No sharing, no pairing, no public links, no cross-user discovery. Enforced at the database level (see DB.md).

### 5.8 Recent lookups (local history)

- The **last 20 lookups** on the current device are kept in the browser locally.
- This is **separate** from the saved dictionary — every lookup goes into recent history automatically, regardless of whether the user saved it.
- Recents are **device-local** (not synced across devices) and are cleared on logout or when the browser data is cleared.
- Surfaced as a small "Recent" section on the home screen, below the lookup card.

### 5.9 Authentication

- Email + password sign-up and log-in.
- **No email verification gate** at launch — users can use the app immediately after sign-up. *(Accepted risk — see §10.)*
- **Password reset via email** is supported (Supabase magic-link flow → "set new password" page).
- All app content (lookup, dictionary, settings) is **only accessible when authenticated**. Unauthenticated requests to any in-app route redirect to `/login`.
- Sessions persist until the user signs out, changes their password, or deletes their account. *(A sliding-window inactivity expiry was considered and deferred — it requires Supabase Pro's "Inactivity timeout" feature, which is not available on the Free plan. Acceptable for v1 given the private, single-user nature of the app; revisit if/when we upgrade.)*

#### Sign-up captures

At sign-up, the user provides:

1. **Email**
2. **Password** (with confirm)
3. **Native language** — required. One of `Serbian`, `Hungarian`, or `German`. This is used to (a) default the source-language dropdown on the lookup screen, and (b) tune the warmth of the AI's English explanation (see §5.4).

The native language is only ever one of the three supported pair languages; a user whose actual native language is none of those picks the one that best matches their relationship to the app.

### 5.10 Settings

A simple `/settings` page exposes:

- **Display name** (optional, free text).
- **Email** (read-only).
- **Native language** (editable dropdown — SR / HU / DE only, per §5.9).
- **Change password** (current → new → confirm).
- **Delete account** (with a confirmation step). Deletion is a **hard delete** — the user's auth record, profile, and all saved entries are removed immediately and cannot be recovered. No export-before-delete at v1.
- **Log out**.

### 5.11 Landing & unauthenticated routes

- The **root URL** (`/`) is the lookup screen for authenticated users. Unauthenticated visitors hitting any route are **redirected straight to `/login`** — there is no marketing landing page at v1.
- Public routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, and the auth callback route.

---

## 6. Screens

### 6.1 Sign Up
Email, password, confirm password, native-language dropdown. Link to Log In.

### 6.2 Log In
Email, password. Links to Sign Up and Forgot Password.

### 6.3 Forgot Password
Email entry, sends a reset link via Resend. Confirmation message.

### 6.4 Reset Password
Lands here from the email link. New password + confirm.

### 6.5 Welcome (one-time onboarding)

Shown exactly once, immediately after a user's first sign-up. Cannot be revisited.

- Two or three sentences of warm copy that frame what Bridges is for ("a small companion for couples whose tongues don't quite line up…").
- A **language pair picker** rendered prominently — two language slots, each picking from SR / HU / DE.
- A single primary CTA: **Start** (disabled until both slots are picked and the two languages differ).
- On submit: profile is marked as onboarded, the chosen pair becomes the active session pair, and the user is redirected to `/`.

### 6.6 Home / Lookup
The primary screen — users land here every time they open the app.

Layout, top to bottom:

1. **Language pair selector** — e.g. `🇷🇸 Serbian ↔ 🇭🇺 Hungarian`. Tappable to change either side.
2. **Source-language dropdown + text input + 🎙 mic button + Look up button** (one cohesive row on desktop; stacked on mobile).
3. **Result card** (appears after lookup):
   - Large word/phrase + 🔊 pronunciation button.
   - English meaning.
   - Cultural context block (collapsible on mobile when long).
   - Example sentence in the source language.
   - Closest equivalent in the other language + 🔊 button + "no direct equivalent" note when applicable.
   - ＋ Save button.
4. **Recent lookups** (compact row of the last few from local history).

### 6.7 My Dictionary
- Search bar + language/pair filter chips at the top.
- Vertical list of compact saved cards (most recent first).
- Tap a card → expanded view of the full result.
- Delete affordance per card.
- Warm empty state when there are no entries.

### 6.8 Settings / Account
As described in §5.10.

---

## 7. Visual & Tone Direction

The app's surface should feel **warm and editorial**, not clinical or productivity-app.

- **Type:** Serif for headings (giving words the weight they deserve when they appear large on the result card). Clean sans-serif for body and UI controls.
- **Palette:** Soft cream / sand background, deep ink for text, a single restrained accent. Light-mode-first; dark mode supported.
- **Layout:** Generous whitespace, single-column on mobile, comfortable max-widths on desktop.
- **Microcopy:** Personal, second-person, gentle. Errors are friendly and human, never technical.
- **Built on:** shadcn/ui primitives (`base-nova` preset already installed) — buttons, dialogs, dropdowns, inputs, etc. should reuse the existing component library rather than be reinvented. Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, …) are used everywhere so theme-switching works automatically.

---

## 8. UX Requirements

### 8.1 Responsiveness
Fully functional on mobile (primary use case) **and** desktop. Layout adapts fluidly. No separate mobile app — this is a responsive web app that should feel native on a phone in portrait.

### 8.2 Performance perception
- Lookup results should appear within **3–5 seconds** under normal network conditions.
- A clear loading state is shown during the AI call.
- The UI feels **snappy** — no janky transitions, no blocked taps.

### 8.3 Accessibility
- Targets **WCAG 2.1 AA** baseline.
- Sufficient colour contrast (cream + ink palette must be checked).
- Full keyboard navigation: tab order is sensible, Enter triggers lookup, Esc closes dialogs.
- Readable font sizes on mobile (no <14px body text).
- Screen-reader labels on all icon-only buttons (🎙, 🔊, ＋, delete).

### 8.4 Reliability
- When the AI call fails, times out, or returns malformed data, the user sees a **friendly, contextual error message + a "Try again" button** — never a broken state, never a raw error.
- The retry is **manual**, not automatic. (Calmer UX; cheaper if something is genuinely broken.)
- All other parts of the app (auth, dictionary browsing) continue to work even when AI is down.

### 8.5 Privacy
- Saved entries and account info are private by design.
- **No analytics or third-party tracking** beyond what's required for basic auth session management.
- When an AI call fails or stalls, the server logs **error metadata only** — HTTP status, latency, model name, error code, and the authenticated user's ID. The user's query text, the AI's response body, and any saved-word content are **never** logged.

---

## 9. User Flows (Happy Paths)

### Flow A — First-time user, first lookup
1. User signs up at `/signup` (email, password, native language ∈ {SR, HU, DE}).
2. Is redirected to `/welcome` — sees a short framing message and picks SR ↔ HU as their first pair.
3. Lands on `/` with the chosen pair active and the source-language dropdown pre-filled to their native language.
4. Types "merak" → presses Enter.
5. Loading state for 3–4 seconds (input is locked; no cancel option).
6. Result card appears with translation, cultural note about "merak", example sentence, and the closest Hungarian cousin (with "no direct equivalent" note).
7. User taps 🔊 on "merak" — hears it pronounced.
8. User taps ＋ Save.
9. A toast confirms it was saved.
10. User taps "My Dictionary" — sees the new entry at the top.
11. On their next visit, `/welcome` is skipped entirely and they land on `/` with the pair selector active again.

### Flow B — Returning user, voice lookup mid-conversation
1. User opens the app on phone, already logged in.
2. Picks DE ↔ HU.
3. Selects "German" in the source-language dropdown.
4. Taps 🎙, says "Heimat".
5. Recognised text "Heimat" lands in the input. User confirms by tapping Look up.
6. Result card appears with the cultural weight of "Heimat" and the closest Hungarian equivalent.
7. User listens to the Hungarian pronunciation, doesn't save, closes the app.

### Flow C — Browsing the dictionary later
1. User opens `/dictionary`.
2. Sees a chronological list of compact cards.
3. Types "tisz" in the search bar → list filters to Hungarian-rooted entries matching the substring.
4. Taps one to expand — sees the full cultural breakdown they originally saw.
5. Decides it's a duplicate, taps Delete → confirms via undo-toast.

### Flow D — Forgot password
1. User clicks "Forgot password" on `/login`.
2. Enters email → submits.
3. Receives a reset link (via Resend, triggered by Supabase Auth Hook).
4. Clicks the link → lands on `/reset-password`.
5. Sets a new password → redirected to `/` and signed in.

---

## 10. Accepted Risks (Explicitly Chosen for v1)

These are conscious trade-offs, not oversights:

| Risk | Decision | Why this is OK for v1 |
|------|----------|------------------------|
| No email verification | Accepted | Small, intimate user base. Verification adds friction that hurts the "personal companion" feel. Can add later if abuse appears. |
| No per-user rate limit on AI calls | Accepted | Tiny user base, OpenRouter cost per lookup is small, and abuse vectors are low without public sign-up promotion. Will revisit if/when usage grows. |
| No global result cache | Accepted | Each lookup feels fresh. Cost is low. Removes a class of staleness bugs. |
| TTS voice quality varies by OS | Accepted | The Web Speech API's voice quality is OS-dependent and out of our control. Acceptable for v1; can swap in server-side TTS later. |
| Pair selection doesn't persist between sessions | Accepted | Picking a pair is a 1-tap gesture, and forcing it each session reinforces the "I'm starting a conversation" framing. |
| No in-flight Cancel during AI lookup | Accepted | At 3–5s typical latency, a Cancel button is more clutter than value. A timeout still bounds the wait. |
| Error-metadata logging only (no query text, no Sentry) | Accepted | Enough to diagnose model/upstream issues without persisting any user content. Sentry / a dedicated `lookup_errors` table is an obvious upgrade path. |
| Native language locked to SR/HU/DE | Accepted | Keeps the data model tight; users whose actual native tongue is elsewhere pick the supported language closest to their relationship to the app. |

---

## 11. Success Criteria (v1)

Bridges v1 is "done" when:

- A user can sign up, pick a pair, perform a lookup (typed or spoken), hear pronunciations, save the result, find it later in their dictionary, and delete it — all on mobile and desktop, without friction.
- A "merak"-style word produces a card with cultural context and a flagged "no direct equivalent" note in the other pair-language.
- A failed AI call shows a friendly error with a Try again button.
- The app feels warm and editorial — not like a translator.
- All non-functional baselines in §8 are met.

---

*PRD v1.1 — generated May 2026, derived from the project brief and 30 scoping decisions.*
