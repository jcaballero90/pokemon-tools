export function safeRequestUrl(value: string): string {
  const pathname = value.split(/[?#]/, 1)[0] ?? "/";
  return pathname.replace(/(\/reset-password\/)[^/]+/g, "$1[redacted]").slice(0, 512);
}

export const apiLoggerOptions = {
  serializers: {
    req(request: { id?: string; method?: string; url?: string; hostname?: string; remoteAddress?: string }) {
      return {
        id: request.id,
        method: request.method,
        url: safeRequestUrl(request.url ?? "/"),
        hostname: request.hostname,
        remoteAddress: request.remoteAddress
      };
    },
    err(error: { name?: string; statusCode?: number }) {
      const name = /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(error.name ?? "") ? error.name : "Error";
      return { type: name ?? "Error", message: "Request failed", stack: "" };
    }
  }
};
