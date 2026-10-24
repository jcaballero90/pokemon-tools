import { describe, expect, it } from "vitest";
import { isValidUsername } from "./auth.js";

describe("username format", () => {
  it("allows 3–30 ASCII letters, digits, underscores and periods", () => {
    expect(isValidUsername("Abc")).toBe(true);
    expect(isValidUsername("trainer_02.test")).toBe(true);
    expect(isValidUsername("a".repeat(30))).toBe(true);
  });

  it("rejects missing, short, long, spaced and non-ASCII usernames", () => {
    for (const value of [undefined, null, "", "ab", "a".repeat(31), "trainer name", "usuarioñ"]) {
      expect(isValidUsername(value)).toBe(false);
    }
  });
});
