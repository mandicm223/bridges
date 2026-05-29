export type FieldErrors = Record<string, string[] | undefined>;

export type FormState =
  | { ok: true; message?: string }
  | { ok: false; fieldErrors?: FieldErrors; formError?: string };

export const initialFormState: FormState = { ok: true };

export function zodFieldErrors(error: {
  flatten: () => { fieldErrors: FieldErrors };
}): FieldErrors {
  return error.flatten().fieldErrors;
}
