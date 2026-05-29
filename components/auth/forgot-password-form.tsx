"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { useFormToast } from "@/components/auth/use-form-toast";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
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

      <SubmitButton
        pending={pending}
        label="Send reset link"
        className="w-full"
      />
    </form>
  );
}
