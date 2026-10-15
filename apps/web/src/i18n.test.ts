import { describe, expect, it } from "vitest";
import { en, type LocaleMessages } from "./locales/en";
import { formatMessage, getCatalogTranslations, getMessages, resolveLocale } from "./i18n";

describe("locale resources", () => {
  it("uses a supported browser language and falls back to English", () => {
    expect(resolveLocale("en-GB")).toBe("en");
    expect(resolveLocale(" EN_us ")).toBe("en");
    expect(resolveLocale("es-ES")).toBe("en");
    expect(getMessages("en-US")).toBe(en);
    expect(getCatalogTranslations("unsupported").types?.fire).toBe("Fire");
    expect(getCatalogTranslations("en").types?.grass).toBe("Grass");
  });

  it("allows translated message values while preserving the complete key structure", () => {
    const translated: LocaleMessages = { ...en, account: { ...en.account, welcome: "Translated greeting, {name}" } };
    expect(formatMessage(translated.account.welcome, { name: "Mira" })).toBe("Translated greeting, Mira");
  });

  it("formats resource placeholders without changing unmatched tokens", () => {
    expect(formatMessage(en.account.welcome, { name: "Mira" })).toBe("Welcome, Mira");
    expect(formatMessage("{known} {missing}", { known: 7 })).toBe("7 {missing}");
  });
});
