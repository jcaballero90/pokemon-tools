import { afterEach, describe, expect, it, vi } from "vitest";
import { damageResponseSchema } from "@pokemon-tools/contracts";
import { api } from "./api.js";

describe("shared API response validation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses successful JSON responses through the shared contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ generation: 9, min: 2, max: 4, minPercent: 1, maxPercent: 2, koChanceOnHit: 0.1, defenderHp: 200, description: "A safe result" }) }));

    await expect(api("/damage", undefined, damageResponseSchema)).resolves.toMatchObject({ generation: 9, max: 4 });
  });

  it("rejects a success payload that does not match the shared contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ min: "not-a-number" }) }));

    await expect(api("/damage", undefined, damageResponseSchema)).rejects.toThrow();
  });

  it("does not label a bodyless delete as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api("/me/teams/team-1", { method: "DELETE" })).resolves.toBeUndefined();

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).has("content-type")).toBe(false);
  });

  it("keeps JSON content type for requests that have a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    await api("/me/teams", { method: "POST", body: "{}" });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("content-type")).toBe("application/json");
  });

  it("uses error codes without exposing untranslated server messages", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "server sentence", code: "sign-in-required" }) }));
    await expect(api("/me/teams")).rejects.toThrow("Sign in required");
  });

  it("formats connection failures through the locale catalog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("browser-specific sentence")));
    await expect(api("/catalog")).rejects.toThrow("The server could not be reached. Please try again.");
  });
});
