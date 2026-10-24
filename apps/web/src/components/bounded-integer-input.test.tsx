import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BoundedIntegerInput } from "./bounded-integer-input";

afterEach(cleanup);

describe("bounded integer input", () => {
  it("clamps a pasted value to the allowed range", () => {
    const onValueChange = vi.fn();
    render(<BoundedIntegerInput aria-label="IV" value={31} min={0} max={31} rangeHint="Use 0–31." wholeNumberHint="Use a whole number." clampHint={(value) => `Capped at ${value}.`} onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton", { name: "IV" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });

    expect(input.value).toBe("31");
    expect(onValueChange).toHaveBeenCalledWith(31);
    expect(screen.getByText("Capped at 31.")).toBeTruthy();
  });

  it("flags malformed or fractional drafts and restores the last valid required value on blur", () => {
    const onValueChange = vi.fn();
    render(<BoundedIntegerInput aria-label="Level" value={50} min={1} max={100} rangeHint="Use 1–100." wholeNumberHint="Use a whole number." onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton", { name: "Level" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1.5" } });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Use a whole number.")).toBeTruthy();
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(input.value).toBe("50");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("allows clearing an optional override without converting blank to zero", () => {
    const onValueChange = vi.fn();
    render(<BoundedIntegerInput aria-label="EV override" value={252} min={0} max={252} allowEmpty empty rangeHint="Use 0–252." wholeNumberHint="Use a whole number." onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton", { name: "EV override" }) as HTMLInputElement;
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.change(input, { target: { value: "" } });
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(input.value).toBe("");
  });

  it("restores an optional value when the parent rejects clearing it", () => {
    const onValueChange = vi.fn();
    render(<BoundedIntegerInput aria-label="EV override" value={250} min={0} max={250} allowEmpty rangeHint="Use 0–250." wholeNumberHint="Use a whole number." onValueChange={onValueChange} />);

    const input = screen.getByRole("spinbutton", { name: "EV override" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    expect(onValueChange).toHaveBeenCalledWith(null);

    fireEvent.blur(input);
    expect(input.value).toBe("250");
  });
});
