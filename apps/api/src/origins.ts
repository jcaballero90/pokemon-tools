export function trustedOriginSet(publicBaseUrl: string, configuredOrigins: string): ReadonlySet<string> {
  return new Set([publicBaseUrl, ...configuredOrigins.split(",").map((origin) => origin.trim())]
    .flatMap((origin) => {
      try {
        const parsed = new URL(origin);
        return parsed.origin === "null" ? [] : [parsed.origin];
      } catch {
        return [];
      }
    }));
}

export function hasTrustedOrigin(origin: string | undefined, trustedOrigins: ReadonlySet<string>): boolean {
  if (!origin || origin === "null") return false;
  try {
    const parsed = new URL(origin);
    return parsed.origin === origin && trustedOrigins.has(parsed.origin);
  } catch {
    return false;
  }
}
