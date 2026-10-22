export type CatalogCategory = "species" | "moves" | "items" | "abilities" | "natures" | "types";

// These optional labels never replace canonical names in drafts or API requests.
type CatalogCategoryTranslations = Partial<Record<CatalogCategory, Readonly<Record<string, string>>>>;
export type CatalogTranslations = CatalogCategoryTranslations & {
  evolutionLocations?: Readonly<Record<string, string>>;
};
export type CatalogTranslationSource = CatalogCategoryTranslations & {
  evolutionLocations?: Partial<Record<"en" | "es-ES", Readonly<Record<string, string>>>>;
};

export type CatalogOption = { value: string; label: string };

export function catalogId(canonicalName: string): string {
  return canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function catalogLabel(category: CatalogCategory, canonicalName: string, translations?: CatalogTranslations): string {
  return translations?.[category]?.[catalogId(canonicalName)] || canonicalName;
}

export function catalogOptions(category: CatalogCategory, canonicalOptions: readonly string[], translations?: CatalogTranslations): CatalogOption[] {
  const suggestions = [...new Set(canonicalOptions)].map((value) => ({ value, label: catalogLabel(category, value, translations) }));
  const names = new Map<string, Set<string>>();
  const labels = new Map<string, Set<string>>();
  const normalize = (name: string) => name.trim().toLowerCase();
  for (const { value, label } of suggestions) {
    const nameKey = normalize(value);
    const labelKey = normalize(label);
    if (!names.has(nameKey)) names.set(nameKey, new Set());
    if (!labels.has(labelKey)) labels.set(labelKey, new Set());
    names.get(nameKey)?.add(value);
    labels.get(labelKey)?.add(value);
  }
  const reserved = new Set([...names.keys(), ...labels.keys()]);
  return suggestions.map(({ value, label }) => {
    const labelKey = normalize(label);
    const collides = (labels.get(labelKey)?.size ?? 0) > 1 || [...(names.get(labelKey) ?? [])].some((name) => name !== value);
    if (label === value || !collides) return { value, label };
    // Disambiguate the actual suggestion, preserving canonical English input.
    let display = `${label} (${value})`;
    while (reserved.has(normalize(display))) display = `${display} (${value})`;
    reserved.add(normalize(display));
    return { value, label: display };
  });
}

export function resolveCatalogInput(category: CatalogCategory, input: string, canonicalOptions: readonly string[], translations?: CatalogTranslations): string {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return input;
  const canonicalMatches = new Set<string>();
  for (const canonicalName of canonicalOptions) {
    if (canonicalName.trim().toLowerCase() === normalized) canonicalMatches.add(canonicalName);
  }
  if (canonicalMatches.size === 1) return [...canonicalMatches][0] ?? input;
  if (canonicalMatches.size > 1) return input;
  const labelMatches = catalogOptions(category, canonicalOptions, translations).filter((option) => option.label.trim().toLowerCase() === normalized);
  return labelMatches.length === 1 ? labelMatches[0]?.value ?? input : input;
}
