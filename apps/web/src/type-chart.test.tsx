import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypeChart } from "./main";

describe("type chart", () => {
  it("renders effectiveness for each defending type", () => {
    render(<TypeChart chart={[{ attack: "Fire", against: { Grass: 2, Water: 0.5 } }]} types={["Grass", "Water"]} />);
    expect(screen.getByText("2×")).toBeTruthy();
    expect(screen.getByText("0.5×")).toBeTruthy();
  });
});
