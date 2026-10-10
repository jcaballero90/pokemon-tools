import { describe, expect, it } from "vitest";
import { apiLoggerOptions, safeRequestUrl } from "./logger.js";

describe("request URL logging", () => {
  it("omits all query parameters and reset tokens from authentication paths", () => {
    expect(safeRequestUrl("/api/auth/verify-email?token=secret&email=trainer@example.test"))
      .toBe("/api/auth/verify-email");
    expect(safeRequestUrl("/api/auth/reset-password/secret-token"))
      .toBe("/api/auth/reset-password/[redacted]");
    expect(safeRequestUrl("/api/catalog?debug=1")).toBe("/api/catalog");
    expect(apiLoggerOptions.serializers.req({ method: "GET", url: "/api/auth/verify-email?token=secret" }).url)
      .toBe("/api/auth/verify-email");
  });
});
