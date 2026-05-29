"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/auth/state";

export function useFormToast(state: FormState) {
  useEffect(() => {
    if (!state.ok && state.formError) {
      toast.error(state.formError);
    }

    if (state.ok && state.message) {
      toast.success(state.message);
    }
  }, [state]);
}
