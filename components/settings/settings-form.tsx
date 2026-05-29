"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  signOutAction,
  updateProfileAction,
} from "@/lib/auth/actions";
import { initialFormState } from "@/lib/auth/state";
import { LANGUAGES } from "@/lib/languages";
import type { Profile } from "@/lib/db/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { useFormToast } from "@/components/auth/use-form-toast";

type SettingsFormProps = {
  profile: Profile;
  email: string;
};

function ProfileSection({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialFormState
  );

  useFormToast(state);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="font-serif text-xl text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how Bridges addresses you and tunes explanations.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" value={email} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile.display_name ?? ""}
            aria-invalid={
              Boolean(state.ok === false && state.fieldErrors?.displayName)
            }
          />
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.displayName} />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nativeLanguage">Native language</Label>
          <Select
            name="nativeLanguage"
            defaultValue={profile.native_language}
          >
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
            <FieldError messages={state.fieldErrors?.nativeLanguage} />
          ) : null}
        </div>

        <SubmitButton pending={pending} label="Save profile" />
      </form>
    </section>
  );
}

function PasswordSection() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialFormState
  );

  useFormToast(state);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="font-serif text-xl text-foreground">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a new password with at least 10 characters, one letter, and one
          number.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={
              Boolean(state.ok === false && state.fieldErrors?.currentPassword)
            }
          />
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.currentPassword} />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={
              Boolean(state.ok === false && state.fieldErrors?.newPassword)
            }
          />
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.newPassword} />
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <Input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={
              Boolean(
                state.ok === false && state.fieldErrors?.confirmNewPassword
              )
            }
          />
          {state.ok === false ? (
            <FieldError messages={state.fieldErrors?.confirmNewPassword} />
          ) : null}
        </div>

        <SubmitButton pending={pending} label="Change password" />
      </form>
    </section>
  );
}

function AccountSection() {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="font-serif text-xl text-foreground">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign out or manage your account lifecycle.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>

        <Button type="button" variant="destructive" disabled>
          Delete account — coming soon
        </Button>
      </div>
    </section>
  );
}

export function SettingsForm({ profile, email }: SettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{email}</p>
      </div>

      <ProfileSection profile={profile} email={email} />
      <PasswordSection />
      <AccountSection />
    </div>
  );
}
