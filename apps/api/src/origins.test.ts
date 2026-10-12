import { describe, expect, it } from "vitest";
import { hasTrustedOrigin, trustedOriginSet } from "./origins.js";

describe("trusted mutation origins", () => {
  const origins = trustedOriginSet("https://pokemon.example/path", "https://staging.example, http://localhost:5173/");

  it("normalizes configured URLs to their exact origins", () => {
    expect(hasTrustedOrigin("https://pokemon.example", origins)).toBe(true);
    expect(hasTrustedOrigin("https://staging.example", origins)).toBe(true);
    expect(hasTrustedOrigin("http://localhost:5173", origins)).toBe(true);
  });

  it.each([undefined, "", "null", "not an origin", "https://pokemon.example.evil", "https://pokemon.example:444", "http://pokemon.example"]) (
    "rejects an absent, malformed, or non-exact origin: %s", (origin) => {
      expect(hasTrustedOrigin(origin, origins)).toBe(false);
    }
  );
});
