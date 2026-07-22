"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Lang, Prefs, ThemeColor } from "@/lib/types";

const DEFAULT_PREFS: Prefs = {
  lang: "th",
  themeColor: "sky",
  darkMode: false,
};

const STORAGE_KEY = "cozy-planner:prefs";

interface PrefsContextValue extends Prefs {
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setThemeColor: (c: ThemeColor) => void;
  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
  /** True once localStorage has been read, so the UI can avoid a flash. */
  hydrated: boolean;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within <Providers>");
  return ctx;
}

function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted prefs on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [prefs, hydrated]);

  const value = useMemo<PrefsContextValue>(
    () => ({
      ...prefs,
      hydrated,
      setLang: (lang) => setPrefs((p) => ({ ...p, lang })),
      toggleLang: () =>
        setPrefs((p) => ({ ...p, lang: p.lang === "th" ? "en" : "th" })),
      setThemeColor: (themeColor) => setPrefs((p) => ({ ...p, themeColor })),
      setDarkMode: (darkMode) => setPrefs((p) => ({ ...p, darkMode })),
      toggleDarkMode: () =>
        setPrefs((p) => ({ ...p, darkMode: !p.darkMode })),
    }),
    [prefs, hydrated]
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>{children}</PrefsProvider>
    </QueryClientProvider>
  );
}
