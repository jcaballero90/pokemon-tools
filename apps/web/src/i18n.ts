import { en, typeCatalog, type LocaleMessages } from "./locales/en.js";
import { esES } from "./locales/es-ES.js";
import type { CatalogTranslationSource, CatalogTranslations } from "./lib/catalog-labels.js";

export type Locale = "en" | "es-ES";
export type LocaleResources = { messages: LocaleMessages; catalog: CatalogTranslations };

const englishTypeLabels: NonNullable<CatalogTranslations["types"]> = Object.fromEntries(
  Object.entries(typeCatalog).map(([typeId, type]) => [typeId, type.label])
);
const catalogs: Record<Locale, LocaleResources> = {
  en: { messages: en, catalog: { types: englishTypeLabels } },
  "es-ES": { messages: esES, catalog: {} }
};

const localeStorageKey = "pokemon-tools-locale";
let activeLocale: Locale;
let apiCatalogTranslations: CatalogTranslationSource = {};
let revision = 0;
const listeners = new Set<() => void>();

function supportedLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "es" || normalized.startsWith("es-")) return "es-ES";
  return null;
}

function safeStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readLocalePreference(): Locale | null {
  try {
    return supportedLocale(safeStorage()?.getItem(localeStorageKey));
  } catch {
    return null;
  }
}

function browserLocales(): string[] {
  if (typeof globalThis.navigator === "undefined") return [];
  try {
    const languages = Array.isArray(globalThis.navigator.languages) ? globalThis.navigator.languages : [];
    return [...languages, globalThis.navigator.language].filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function resolveInitialLocale(savedPreference: string | null | undefined, browserLanguages: readonly string[]): Locale {
  const saved = supportedLocale(savedPreference);
  if (saved) return saved;
  for (const language of browserLanguages) {
    const supported = supportedLocale(language);
    if (supported) return supported;
  }
  return "en";
}

activeLocale = resolveInitialLocale(readLocalePreference(), browserLocales());

function notifyLocaleChange() {
  revision += 1;
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocaleSnapshot() {
  return `${activeLocale}:${revision}`;
}

export function getCurrentLocale(): Locale {
  return activeLocale;
}

export function setLocale(value: string): Locale {
  const nextLocale = supportedLocale(value) ?? "en";
  if (nextLocale === activeLocale) {
    try { safeStorage()?.setItem(localeStorageKey, nextLocale); } catch { /* locale changes still work without storage */ }
    return activeLocale;
  }

  activeLocale = nextLocale;
  try { safeStorage()?.setItem(localeStorageKey, nextLocale); } catch { /* locale changes still work without storage */ }
  notifyLocaleChange();
  return activeLocale;
}

export function setApiCatalogTranslations(translations: CatalogTranslationSource | undefined) {
  apiCatalogTranslations = translations ?? {};
  notifyLocaleChange();
}

export function resolveLocale(value?: string | null): Locale {
  if (value === undefined || value === null) return activeLocale;
  return supportedLocale(value) ?? "en";
}

export function getMessages(value?: string | null): LocaleMessages {
  return catalogs[resolveLocale(value)].messages;
}

export function getCatalogTranslations(value?: string | null): CatalogTranslations {
  const selectedLocale = resolveLocale(value);
  const { evolutionLocations, ...generatedSpanishCatalog } = apiCatalogTranslations;
  const catalog = selectedLocale === "en"
    ? catalogs.en.catalog
    : { ...catalogs[selectedLocale].catalog, ...generatedSpanishCatalog };
  const locationLabels = evolutionLocations?.[selectedLocale];
  return { ...catalog, ...(locationLabels ? { evolutionLocations: locationLabels } : {}) };
}

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, key: string) => {
    const value = values[key];
    return value === undefined ? placeholder : String(value);
  });
}
