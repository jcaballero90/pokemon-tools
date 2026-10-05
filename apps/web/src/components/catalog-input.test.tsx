import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogInput } from "./catalog-input.js";
import type { CatalogTranslations } from "../lib/catalog-labels.js";

const options = ["Thunderbolt", "Protect"];
const translations: CatalogTranslations = { moves: { thunderbolt: "Rayo", protect: "Protección" } };

afterEach(cleanup);

describe("localized catalog input", () => {
  it("shows a translated canonical value and suggestions with accessible native attributes", () => {
    const onChange = vi.fn();
    render(<label>Move<CatalogInput category="moves" value="Thunderbolt" options={options} translations={translations}
      onChange={onChange} placeholder="Choose a move" required /></label>);
    const input = screen.getByRole("combobox", { name: "Move" }) as HTMLInputElement;
    expect(input.value).toBe("Rayo");
    expect(input.placeholder).toBe("Choose a move");
    expect(input.required).toBe(true);
    expect(Array.from(input.list?.options ?? []).map((option) => [option.value, option.label])).toEqual([
      ["Rayo", "Thunderbolt"], ["Protección", "Protect"]
    ]);
    fireEvent.change(input, { target: { value: "Protección" } });
    expect(onChange).toHaveBeenCalledWith("Protect");
  });

  it("preserves incomplete and ambiguous edits in the rendered input and controlled draft", () => {
    const onChange = vi.fn();
    function Editor() {
      const [value, setValue] = useState("Thunderbolt");
      return <label>Move<CatalogInput category="moves" value={value} options={options}
        translations={{ moves: { thunderbolt: "Shared", protect: "Shared" } }}
        onChange={(next) => { onChange(next); setValue(next); }} /></label>;
    }
    render(<Editor />);
    const input = screen.getByRole("combobox", { name: "Move" }) as HTMLInputElement;
    expect(input.value).toBe("Shared (Thunderbolt)");
    expect(Array.from(input.list?.options ?? []).map((option) => option.value)).toEqual(["Shared (Thunderbolt)", "Shared (Protect)"]);
    for (const edit of ["  incomplete  ", "Shared", ""]) {
      fireEvent.change(input, { target: { value: edit } });
      expect(onChange).toHaveBeenLastCalledWith(edit);
      expect(input.value).toBe(edit);
    }
    fireEvent.change(input, { target: { value: "thunderbolt" } });
    expect(onChange).toHaveBeenLastCalledWith("Thunderbolt");
    expect(input.value).toBe("Shared (Thunderbolt)");
    fireEvent.change(input, { target: { value: "Shared (Protect)" } });
    expect(onChange).toHaveBeenLastCalledWith("Protect");
    expect(input.value).toBe("Shared (Protect)");
  });

  it("round trips a suggestion whose translated label collides with another canonical move", () => {
    const onChange = vi.fn();
    function Editor() {
      const [value, setValue] = useState("Thunderbolt");
      return <CatalogInput aria-label="Move" category="moves" value={value} options={options}
        translations={{ moves: { thunderbolt: "Protect" } }}
        onChange={(next) => { onChange(next); setValue(next); }} />;
    }
    render(<Editor />);
    const input = screen.getByRole("combobox", { name: "Move" }) as HTMLInputElement;
    expect(input.value).toBe("Protect (Thunderbolt)");
    fireEvent.change(input, { target: { value: "Protect" } });
    expect(onChange).toHaveBeenLastCalledWith("Protect");
    fireEvent.change(input, { target: { value: "Protect (Thunderbolt)" } });
    expect(onChange).toHaveBeenLastCalledWith("Thunderbolt");
  });

  it("changes only display labels when locale resources change", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CatalogInput aria-label="Move" category="moves" value="Thunderbolt" options={options} onChange={onChange} />);
    expect((screen.getByRole("combobox", { name: "Move" }) as HTMLInputElement).value).toBe("Thunderbolt");
    rerender(<CatalogInput aria-label="Move" category="moves" value="Thunderbolt" options={options} translations={translations} onChange={onChange} />);
    expect((screen.getByRole("combobox", { name: "Move" }) as HTMLInputElement).value).toBe("Rayo");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reuses a shared translated datalist without rendering duplicate suggestion nodes", () => {
    const onChange = vi.fn();
    const collision: CatalogTranslations = { moves: { thunderbolt: "Protect" } };
    const { container } = render(<>
      <datalist id="shared-moves"><option value="Protect (Thunderbolt)" /><option value="Protect" /></datalist>
      <CatalogInput aria-label="First move" list="shared-moves" category="moves" value="Protect" options={options} translations={collision} onChange={onChange} />
      <CatalogInput aria-label="Second move" list="shared-moves" category="moves" value="Protect" options={options} translations={collision} onChange={onChange} />
    </>);
    expect(container.querySelectorAll("datalist")).toHaveLength(1);
    const input = screen.getByRole("combobox", { name: "First move" }) as HTMLInputElement;
    expect(input.list?.id).toBe("shared-moves");
    fireEvent.change(input, { target: { value: "Protect (Thunderbolt)" } });
    expect(onChange).toHaveBeenCalledWith("Thunderbolt");
  });
});
