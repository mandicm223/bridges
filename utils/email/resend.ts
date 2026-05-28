import { Resend } from "resend";

// Singleton so the client is only instantiated once per process.
export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
