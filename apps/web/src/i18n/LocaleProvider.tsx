import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import {
  getCurrentLocale,
  getLocaleSnapshot,
  setLocale,
  subscribeLocale,
  type Locale
} from "../i18n.js";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleSnapshot);
  const locale = getCurrentLocale();
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
