"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteSavedWordAction } from "@/lib/dictionary/actions";
import type { SavedWord } from "@/lib/dictionary/types";

const DELETE_DELAY_MS = 5000;

// If the user navigates away before the timer fires, the in-memory timer is
// lost and the entry stays in the database. Acceptable v1 trade-off.
export function useDeferredDelete() {
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const timersRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const requestDelete = useCallback((entry: SavedWord) => {
    const id = entry.id;

    setPendingIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      timersRef.current.delete(id);
      void deleteSavedWordAction(id);
    }, DELETE_DELAY_MS);

    timersRef.current.set(id, timer);

    toast(`"${entry.word}" removed`, {
      action: {
        label: "Undo",
        onClick: () => {
          const activeTimer = timersRef.current.get(id);
          if (activeTimer) {
            clearTimeout(activeTimer);
            timersRef.current.delete(id);
          }

          setPendingIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        },
      },
      duration: DELETE_DELAY_MS,
    });
  }, []);

  return { pendingIds, requestDelete };
}
