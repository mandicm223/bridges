# Project Brief — Bridges
### A personal language companion for couples who speak different native tongues

---

## 1. Project Overview

**Bridges** is a warm, personal web application designed for couples (or any two close people) who each speak a different native language and use English as their shared communication layer. Rather than a cold translation tool, Bridges is built around cultural understanding — helping users not just convert words, but truly grasp what a word *means* to the person who grew up with it.

The app supports three target languages — **Serbian**, **Hungarian**, and **German** — with English always present as the explanation and context layer. A user selects two languages to connect (e.g. Serbian ↔ Hungarian), and English serves as the bridge between them: explaining, contextualising, and finding the closest emotional or cultural equivalent across the pair.

The product's north-star example is the Serbian word **"merak"** — a concept with no direct English translation — where the app would explain its meaning, give it cultural weight, and surface what a Hungarian speaker would naturally reach for instead.

---

## 2. Primary Goal

To help two people understand each other more deeply by going beyond literal translation — surfacing the cultural soul of words and phrases, in a tool that feels personal and warm, not clinical.

---

## 3. Target Users

This is a **single-role application**. There are no admin or moderator roles at launch. Every authenticated user has the same access and capabilities.

**Primary persona:** A person in a relationship (romantic or close friendship) where each person has a different native language among Serbian, Hungarian, or German. They use the app during or after real conversations — on their phone mid-chat, or at the desktop reflecting on something they heard.

---

## 4. Core Features In Scope

| # | Feature | Summary |
|---|---------|---------|
| 1 | Language pair selector | User picks two languages to connect for the session (e.g. SR ↔ HU). English is always active as the explanation layer. |
| 2 | Word / phrase lookup | Type or speak a word/phrase in either selected language and receive a full cultural breakdown. |
| 3 | Voice input (STT) | Speak a word directly into the app using the browser's speech-to-text; language is set via a dropdown selector before speaking. |
| 4 | Voice output (TTS) | Hear any word or phrase pronounced in its source language via text-to-speech. |
| 5 | Rich lookup result | Each result includes: translation, English explanation, cultural context, an example sentence, and the closest equivalent in the other selected language. |
| 6 | Personal dictionary | Save any lookup result to a private collection; browse, search, and review saved words at any time. |
| 7 | Authentication | Email/password auth via Supabase. Accounts are private and personal — no pairing or sharing between users. |

---

## 5. Functional Requirements

### 5.1 Language Selection
- The user must select a **language pair** before performing a lookup (e.g. Serbian ↔ Hungarian, Hungarian ↔ German, Serbian ↔ German).
- English is **not selectable** as part of the pair — it is always the silent explanation layer.
- The selected pair persists for the session and is easily changeable.

### 5.2 Lookup
- Input field accepts free text in either language of the selected pair.
- A **language source dropdown** sits adjacent to the input to indicate which language the user is typing or speaking in.
- Lookup is triggered on submission (button or Enter key).
- The system uses **OpenRouter** (OpenAI model, e.g. GPT-4o) to generate the result.
- The AI prompt must be structured to always return:
  - The word/phrase as entered
  - Its meaning in English (plain, friendly explanation)
  - Cultural context or emotional weight (when relevant)
  - An example sentence in the source language
  - The closest equivalent word or phrase in the other selected language (with a note if no direct equivalent exists)
- Results are displayed in a clear, readable card format.
- Results are **not cached globally** — each lookup is a fresh API call.

### 5.3 Voice Input (STT)
- User selects source language from dropdown, then activates voice input.
- Uses the **Web Speech API** (browser-native) for speech-to-text.
- Recognised text populates the lookup input field for confirmation before submitting.
- Graceful fallback message displayed if the browser does not support STT.

### 5.4 Voice Output (TTS)
- Each result card includes a **play button** for any word or phrase shown.
- Uses the **Web Speech API** (SpeechSynthesis) for pronunciation.
- Speaks in the appropriate language voice (SR, HU, DE, or EN depending on which text is being read).

### 5.5 Personal Dictionary
- Any lookup result can be saved with a single tap/click.
- Saved entries are **private to the authenticated user** — no sharing, no pairing.
- The dictionary view supports:
  - Listing all saved entries (most recent first)
  - Filtering/searching by word, language, or pair
  - Viewing the full result card for any saved entry
  - Deleting entries
- Data is stored in **Supabase** (Postgres), linked to the user's account.

### 5.6 Authentication
- Email/password sign-up and log-in via **Supabase Auth**.
- Password reset via email.
- All app content (lookup, dictionary) is **only accessible when authenticated**.
- No OAuth / social login required at launch.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Responsiveness** | Fully functional on mobile (primary use case) and desktop. Layout adapts fluidly — no separate mobile app needed. |
| **Performance** | Lookup results should appear within 3–5 seconds under normal network conditions. The UI should feel snappy; loading states must be clearly communicated. |
| **Accessibility** | Meets WCAG 2.1 AA baseline. Sufficient colour contrast, keyboard navigability, readable font sizes on mobile. |
| **Privacy** | User data (saved words, account info) is private by design. No analytics or tracking beyond basic auth session management. |
| **Reliability** | Graceful degradation when the AI API is slow or unavailable — show a clear, friendly error message rather than a broken state. |
| **Security** | API keys (OpenRouter) must never be exposed on the client side. All AI calls must be proxied through a backend or serverless function. Supabase Row Level Security (RLS) enforced on all user data tables. |
| **Internationalisation** | The app UI itself can be in English. No need to localise the interface into SR/HU/DE at launch. |
| **Browser support** | Modern evergreen browsers (Chrome, Safari, Firefox, Edge). Web Speech API availability should be checked at runtime with a graceful fallback. |

---

## 7. Out of Scope (for v1)

- Shared or paired dictionary between two users
- Word-of-the-day or push notifications
- Flashcard / spaced repetition learning mode
- Community or public word contributions
- Languages beyond Serbian, Hungarian, German (+ English)
- Native iOS / Android apps
- Offline mode

---

## 8. Suggested Pages / Screens

### 8.1 Authentication screens
- **Log In** — email + password, link to sign up and password reset
- **Sign Up** — email + password + confirm password
- **Forgot Password** — email entry, confirmation message

### 8.2 App: Lookup (Home)
The primary screen. Users will land here every time they open the app.

- Language pair selector (e.g. `🇷🇸 Serbian ↔ 🇭🇺 Hungarian`) — tappable to change
- Source language dropdown (which language am I typing/speaking in?)
- Text input field with voice input button
- Submit / Look up button
- Result card (rendered below input after lookup):
  - Word / phrase (large, prominent)
  - 🔊 Pronunciation button
  - English meaning
  - Cultural context block (collapsible on mobile if long)
  - Example sentence in source language
  - Closest equivalent in the other language (with its own 🔊 button)
  - ＋ Save to dictionary button

### 8.3 App: My Dictionary
- List of saved word cards (compact view)
- Search/filter bar
- Each card expands to show the full result
- Delete entry option
- Empty state with a warm prompt encouraging first lookup

### 8.4 App: Settings / Account
- Display name (optional)
- Email address (read-only)
- Change password
- Delete account (with confirmation)
- Log out

### 8.5 Unauthenticated landing (optional for v1)
A minimal marketing-style landing page explaining what the app is, with a Log In / Sign Up CTA. Can be a simple static page or skipped entirely (redirect straight to log in).

---

*Brief version 1.0 — generated May 2026*
