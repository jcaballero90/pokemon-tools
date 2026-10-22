import { describe, expect, it } from "vitest";
import { en, type LocaleMessages } from "./locales/en";
import { esES } from "./locales/es-ES";
import {
  formatMessage, getCatalogTranslations, getMessages, readLocalePreference,
  resolveInitialLocale, resolveLocale, setApiCatalogTranslations, setLocale
} from "./i18n";

describe("locale resources", () => {
  it("resolves supported browser languages and falls back to English", () => {
    expect(resolveLocale("en-GB")).toBe("en");
    expect(resolveLocale(" EN_us ")).toBe("en");
    expect(resolveLocale("es-ES")).toBe("es-ES");
    expect(resolveLocale("es-MX")).toBe("es-ES");
    expect(resolveLocale("unsupported")).toBe("en");
    expect(getMessages("en-US")).toBe(en);
    expect(getCatalogTranslations("unsupported").types?.fire).toBe("Fire");
    expect(getCatalogTranslations("en").types?.grass).toBe("Grass");
    expect(getMessages("es-ES")).toBe(esES);
  });

  it("prefers an explicit saved language, then the first supported browser language", () => {
    expect(resolveInitialLocale("es-ES", ["en-US"])).toBe("es-ES");
    expect(resolveInitialLocale("fr-FR", ["fr-FR", "es-MX", "en-US"])).toBe("es-ES");
    expect(resolveInitialLocale(null, ["fr-FR", "en-GB"])).toBe("en");
    expect(resolveInitialLocale(null, ["fr-FR"])).toBe("en");
  });

  it("uses generated Spain Spanish catalogs without changing canonical values", () => {
    setApiCatalogTranslations({
      types: { grass: "Planta" }, moves: { tackle: "Placaje" },
      evolutionLocations: { en: { mtcoronet: "Mt. Coronet" }, "es-ES": { mtcoronet: "Monte Corona" } }
    });
    expect(getCatalogTranslations("es-ES")).toMatchObject({ types: { grass: "Planta" }, moves: { tackle: "Placaje" } });
    expect(getCatalogTranslations("es-ES").evolutionLocations?.mtcoronet).toBe("Monte Corona");
    expect(getCatalogTranslations("en").evolutionLocations?.mtcoronet).toBe("Mt. Coronet");
    expect(getCatalogTranslations("en").types?.grass).toBe("Grass");
    setApiCatalogTranslations(undefined);
  });

  it("persists an explicit switch and keeps working when browser storage is unavailable", () => {
    setLocale("en");
    expect(setLocale("es-ES")).toBe("es-ES");
    expect(readLocalePreference()).toBe("es-ES");

    const savedStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw new Error("storage blocked"); } });
    expect(readLocalePreference()).toBeNull();
    expect(() => setLocale("en")).not.toThrow();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: savedStorage });
  });

  it("allows translated message values while preserving the complete key structure", () => {
    const translated: LocaleMessages = { ...en, account: { ...en.account, welcome: "Translated greeting, {name}" } };
    expect(formatMessage(translated.account.welcome, { name: "Mira" })).toBe("Translated greeting, Mira");
  });

  it("keeps message keys and interpolation placeholders aligned across locales", () => {
    function messageEntries(value: unknown, path = ""): Record<string, string> {
      if (typeof value === "string") return { [path]: [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort().join(",") };
      if (!value || typeof value !== "object") return {};
      return Object.entries(value).reduce<Record<string, string>>((entries, [key, child]) => ({
        ...entries, ...messageEntries(child, path ? `${path}.${key}` : key)
      }), {});
    }
    expect(messageEntries(esES)).toEqual(messageEntries(en));
  });

  it("formats resource placeholders without changing unmatched tokens", () => {
    expect(formatMessage(en.account.welcome, { name: "Mira" })).toBe("Welcome, Mira");
    expect(formatMessage("{known} {missing}", { known: 7 })).toBe("7 {missing}");
  });
});
