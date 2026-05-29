"use client";

import { useActionState } from "react";
import { signUpAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { LANGUAGES } from "@/lib/languages";
import { Input } from "@/components/ui/input";
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

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialFormState
  );

  useFormToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.ok === false && state.fieldErrors?.email)}
          aria-describedby={
            state.ok === false && state.fieldErrors?.email
              ? "email-error"
              : undefined
          }
        />
        {state.ok === false ? (
          <FieldError id="email-error" messages={state.fieldErrors?.email} />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name (optional)</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          aria-invalid={
            Boolean(state.ok === false && state.fieldErrors?.displayName)
          }
          aria-describedby={
            state.ok === false && state.fieldErrors?.displayName
              ? "displayName-error"
              : undefined
          }
        />
        {state.ok === false ? (
          <FieldError
            id="displayName-error"
            messages={state.fieldErrors?.displayName}
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nativeLanguage">Native language</Label>
        <Select name="nativeLanguage" required defaultValue="">
          <SelectTrigger id="nativeLanguage" className="w-full">
            <SelectValue placeholder="Choose your native language" />
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
          <FieldError
            id="nativeLanguage-error"
            messages={state.fieldErrors?.nativeLanguage}
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={
            Boolean(state.ok === false && state.fieldErrors?.password)
          }
          aria-describedby={
            state.ok === false && state.fieldErrors?.password
              ? "password-error"
              : undefined
          }
        />
        {state.ok === false ? (
          <FieldError
            id="password-error"
            messages={state.fieldErrors?.password}
          />
        ) : null}
        <p className="text-xs text-muted-foreground">
          At least 10 characters, with one letter and one number.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={
            Boolean(state.ok === false && state.fieldErrors?.confirmPassword)
          }
          aria-describedby={
            state.ok === false && state.fieldErrors?.confirmPassword
              ? "confirmPassword-error"
              : undefined
          }
        />
        {state.ok === false ? (
          <FieldError
            id="confirmPassword-error"
            messages={state.fieldErrors?.confirmPassword}
          />
        ) : null}
      </div>

      <SubmitButton pending={pending} label="Create account" className="w-full" />
    </form>
  );
}
