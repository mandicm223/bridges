"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { useFormToast } from "@/components/auth/use-form-toast";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialFormState
  );

  useFormToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
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

      <SubmitButton pending={pending} label="Set new password" className="w-full" />
    </form>
  );
}
