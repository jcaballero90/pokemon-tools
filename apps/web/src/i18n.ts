import { en, type LocaleMessages } from "./locales/en";
import type { CatalogTranslations } from "./lib/catalog-labels";

// Add a locale resource here when its complete translation is ready. The
// LocaleMessages type keeps every catalog aligned with the English keys.
export type LocaleResources = { messages: LocaleMessages; catalog: CatalogTranslations };
const catalogs: Record<string, LocaleResources> = { en: { messages: en, catalog: {} } };

export function resolveLocale(locale?: string | null): string {
  const browserLocale = locale ?? (typeof navigator === "undefined" ? "en" : navigator.language);
  const requested = browserLocale.trim().toLowerCase().replaceAll("_", "-");
  if (Object.hasOwn(catalogs, requested)) return requested;
  const language = requested.split("-")[0] ?? "en";
  return Object.hasOwn(catalogs, language) ? language : "en";
}

export function getMessages(locale?: string | null): LocaleMessages {
  return catalogs[resolveLocale(locale)]?.messages ?? en;
}

export function getCatalogTranslations(locale?: string | null): CatalogTranslations {
  return catalogs[resolveLocale(locale)]?.catalog ?? {};
}

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, key: string) => {
    const value = values[key];
    return value === undefined ? placeholder : String(value);
  });
}
