"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logInAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { useFormToast } from "@/components/auth/use-form-toast";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    logInAction,
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
      </div>

      <SubmitButton pending={pending} label="Log in" className="w-full" />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-foreground underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
