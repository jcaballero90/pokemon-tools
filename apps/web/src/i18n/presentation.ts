import {
  formatMessage,
  getCatalogTranslations,
  getCurrentLocale,
  getMessages,
  subscribeLocale
} from "../i18n.js";
import { catalogLabel, type CatalogCategory } from "../lib/catalog-labels.js";

export let locale = getCurrentLocale();
export let t = getMessages(locale);
export let catalogTranslations = getCatalogTranslations(locale);

subscribeLocale(() => {
  locale = getCurrentLocale();
  t = getMessages(locale);
  catalogTranslations = getCatalogTranslations(locale);
});

export const label = (category: CatalogCategory, canonicalName: string) =>
  catalogLabel(category, canonicalName, catalogTranslations);

export { formatMessage };
