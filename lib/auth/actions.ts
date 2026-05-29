"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  parseChangePasswordForm,
  parseCompleteOnboardingForm,
  parseForgotPasswordForm,
  parseLogInForm,
  parseResetPasswordForm,
  parseSignUpForm,
  parseUpdateProfileForm,
} from "@/lib/auth/schemas";
import { type FormState, zodFieldErrors } from "@/lib/auth/state";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function signUpAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseSignUpForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { email, password, nativeLanguage, displayName } = parsed.data;
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return {
      ok: false,
      formError:
        error.message === "User already registered"
          ? "An account with this email already exists."
          : "We couldn't create your account. Please try again.",
    };
  }

  if (!data.user) {
    return {
      ok: false,
      formError: "We couldn't create your account. Please try again.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    native_language: nativeLanguage,
    display_name: displayName ?? null,
  });

  if (profileError) {
    return {
      ok: false,
      formError:
        "We couldn't finish creating your account. Please try again.",
    };
  }

  redirect("/welcome");
}

export async function logInAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseLogInForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const { email, password } = parsed.data;
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, formError: "Invalid email or password." };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseForgotPasswordForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseClient();
  const redirectTo = `${getAppUrl()}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  return {
    ok: true,
    message:
      "If an account exists for that email, we sent a reset link.",
  };
}

export async function resetPasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseResetPasswordForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      formError: "Your reset link has expired.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      formError: "We couldn't update your password. Please try again.",
    };
  }

  redirect("/");
}

export async function completeOnboardingAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseCompleteOnboardingForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      formError: "We couldn't save your preferences. Please try again.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    "bridges.pending_pair",
    `${parsed.data.firstLang},${parsed.data.secondLang}`,
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    }
  );

  redirect("/");
}

export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseChangePasswordForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      ok: false,
      fieldErrors: {
        currentPassword: ["Current password is incorrect."],
      },
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return {
      ok: false,
      formError: "We couldn't update your password. Please try again.",
    };
  }

  return { ok: true, message: "Password updated." };
}

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseUpdateProfileForm(formData);

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodFieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      native_language: parsed.data.nativeLanguage,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      formError: "We couldn't update your profile. Please try again.",
    };
  }

  return { ok: true, message: "Profile updated." };
}
