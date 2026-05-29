"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { completeOnboardingAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { useFormToast } from "@/components/auth/use-form-toast";

export function WelcomeForm() {
  const [firstLang, setFirstLang] = useState<LanguageCode | "">("");
  const [secondLang, setSecondLang] = useState<LanguageCode | "">("");
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialFormState
  );

  useFormToast(state);

  const canSubmit = useMemo(
    () =>
      Boolean(firstLang && secondLang && firstLang !== secondLang && !pending),
    [firstLang, secondLang, pending]
  );

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        A small companion for couples whose tongues don&apos;t quite line up.
        Pick the two languages you want to bridge first.
      </p>

      <input type="hidden" name="firstLang" value={firstLang} />
      <input type="hidden" name="secondLang" value={secondLang} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstLang">First language</Label>
          <Select
            required
            value={firstLang}
            onValueChange={(value) => setFirstLang(value as LanguageCode)}
          >
            <SelectTrigger id="firstLang" className="w-full">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.flag} {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.firstLang} />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondLang">Second language</Label>
          <Select
            required
            value={secondLang}
            onValueChange={(value) => setSecondLang(value as LanguageCode)}
          >
            <SelectTrigger id="secondLang" className="w-full">
              <SelectValue placeholder="Choose a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.flag} {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.secondLang} />
          ) : null}
        </div>
      </div>

      <SubmitButton
        pending={pending}
        label="Start"
        className="w-full"
        pendingLabel="Starting…"
        disabled={!canSubmit}
      />

      {!canSubmit && firstLang && secondLang && firstLang === secondLang ? (
        <p className="text-sm text-destructive">
          Pick two different languages.
        </p>
      ) : null}
    </form>
  );
}
