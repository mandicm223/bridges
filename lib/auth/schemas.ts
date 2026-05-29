import { z } from "zod";

export const nativeLanguageSchema = z.enum(["sr", "hu", "de"]);
export const languageCodeSchema = z.enum(["sr", "hu", "de"]);

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .regex(/[A-Za-z]/, "Password must include at least one letter.")
  .regex(/\d/, "Password must include at least one number.");

export const signUpSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    nativeLanguage: nativeLanguageSchema,
    displayName: z
      .string()
      .trim()
      .max(80, "Display name must be 80 characters or fewer.")
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const logInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80, "Display name must be 80 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : null)),
  nativeLanguage: nativeLanguageSchema,
});

export const completeOnboardingSchema = z
  .object({
    firstLang: languageCodeSchema,
    secondLang: languageCodeSchema,
  })
  .refine((data) => data.firstLang !== data.secondLang, {
    message: "Pick two different languages.",
    path: ["secondLang"],
  });

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseSignUpForm(formData: FormData) {
  return signUpSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
    nativeLanguage: getString(formData, "nativeLanguage"),
    displayName: getString(formData, "displayName") || undefined,
  });
}

export function parseLogInForm(formData: FormData) {
  return logInSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });
}

export function parseForgotPasswordForm(formData: FormData) {
  return forgotPasswordSchema.safeParse({
    email: getString(formData, "email"),
  });
}

export function parseResetPasswordForm(formData: FormData) {
  return resetPasswordSchema.safeParse({
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });
}

export function parseChangePasswordForm(formData: FormData) {
  return changePasswordSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newPassword: getString(formData, "newPassword"),
    confirmNewPassword: getString(formData, "confirmNewPassword"),
  });
}

export function parseUpdateProfileForm(formData: FormData) {
  return updateProfileSchema.safeParse({
    displayName: getString(formData, "displayName") || undefined,
    nativeLanguage: getString(formData, "nativeLanguage"),
  });
}

export function parseCompleteOnboardingForm(formData: FormData) {
  return completeOnboardingSchema.safeParse({
    firstLang: getString(formData, "firstLang"),
    secondLang: getString(formData, "secondLang"),
  });
}
