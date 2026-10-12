import { getCatalogTranslations, getMessages, resolveLocale, formatMessage } from "../i18n";
import { catalogLabel, type CatalogCategory } from "../lib/catalog-labels";

export const locale = resolveLocale();
export const t = getMessages(locale);
export const catalogTranslations = getCatalogTranslations(locale);
export const label = (category: CatalogCategory, canonicalName: string) =>
  catalogLabel(category, canonicalName, catalogTranslations);

export { formatMessage };
