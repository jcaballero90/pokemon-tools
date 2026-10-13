import type { CatalogResponse } from "@pokemon-tools/contracts";
import { catalogTranslations } from "../i18n/presentation";
import { catalogOptions, type CatalogCategory } from "../lib/catalog-labels";

const sharedCatalogCategories = ["species", "moves", "items", "abilities"] as const;

type CatalogDatalistsProps = { catalog: CatalogResponse | null };
type CatalogOptionGroup = { category: CatalogCategory; options: ReturnType<typeof catalogOptions> };

export function CatalogDatalists({ catalog }: CatalogDatalistsProps) {
  if (!catalog) return null;

  const optionGroups: CatalogOptionGroup[] = sharedCatalogCategories.map((category) => {
    const names = category === "species"
      ? catalog.species.map((entry) => entry.name)
      : catalog[category];
    return {
      category,
      options: catalogOptions(category, names, catalogTranslations)
    };
  });

  return (
    <>
      {optionGroups.map(({ category, options }) => (
        <datalist key={category} id={`${category}-list`}>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.label}
              label={option.label === option.value ? undefined : option.value}
            />
          ))}
        </datalist>
      ))}
    </>
  );
}
