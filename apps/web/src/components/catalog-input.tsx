import { useId, useMemo, type InputHTMLAttributes } from "react";
import {
  catalogOptions,
  resolveCatalogInput,
  type CatalogCategory,
  type CatalogTranslations
} from "../lib/catalog-labels.js";

export type CatalogInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> & {
  value: string;
  category: CatalogCategory;
  options: readonly string[];
  translations?: CatalogTranslations;
  onChange: (canonicalOrDraft: string) => void;
};

export function CatalogInput({ value, category, options, translations, onChange, list, ...inputProps }: CatalogInputProps) {
  const generatedListId = useId();
  const listId = list ?? generatedListId;
  const suggestions = useMemo(
    () => catalogOptions(category, options, translations),
    [category, options, translations]
  );
  const displayValue = suggestions.find((option) => option.value === value)?.label ?? value;

  function handleInputChange(inputValue: string) {
    onChange(resolveCatalogInput(category, inputValue, options, translations));
  }

  return (
    <>
      <input
        {...inputProps}
        list={listId}
        value={displayValue}
        onChange={(event) => handleInputChange(event.target.value)}
      />
      {list === undefined && (
        <datalist id={listId}>
          {suggestions.map((option) => (
            <option
              key={option.value}
              value={option.label}
              label={option.label === option.value ? undefined : option.value}
            />
          ))}
        </datalist>
      )}
    </>
  );
}
