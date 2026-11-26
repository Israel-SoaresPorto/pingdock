import { useCallback, useState } from "react";
import {
  HTTP_METHODS,
  type HeaderItem,
  type HistoryItem,
  type HttpMethod,
} from "@/types/app";
import { MAX_HISTORY_ITEMS } from "@/types/app";
import useLocalStorage from "./use-local-storage";

export const HISTORY_STORAGE_KEY = "pingdock_history";

export type NewHistoryEntry = Omit<HistoryItem, "id" | "timestamp">;

function isValidHttpMethod(value: unknown): value is HttpMethod {
  return (
    typeof value === "string" &&
    (HTTP_METHODS as readonly string[]).includes(value)
  );
}

function isValidHeaderItem(value: unknown): value is HeaderItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.key === "string" &&
    typeof candidate.value === "string" &&
    typeof candidate.enabled === "boolean"
  );
}

function isValidHistoryItem(value: unknown): value is HistoryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.url === "string" &&
    isValidHttpMethod(candidate.method) &&
    Array.isArray(candidate.headers) &&
    candidate.headers.every(isValidHeaderItem) &&
    typeof candidate.body === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.durationMs === "number" &&
    typeof candidate.timestamp === "number"
  );
}

export function useHistory() {
  const { storedValue, setValue } = useLocalStorage<HistoryItem[]>(
    HISTORY_STORAGE_KEY,
    [],
  );

  const [history, setHistory] = useState<HistoryItem[]>(
    storedValue.filter(isValidHistoryItem).slice(0, MAX_HISTORY_ITEMS),
  );

  const addEntry = useCallback((entry: NewHistoryEntry): HistoryItem => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      method: entry.method,
      url: entry.url,
      headers: entry.headers.map((header) => ({ ...header })),
      body: entry.body,
      status: entry.status,
      durationMs: entry.durationMs,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const next = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      setValue(next);
      return next;
    });

    return newItem;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setValue([]);
  }, []);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
