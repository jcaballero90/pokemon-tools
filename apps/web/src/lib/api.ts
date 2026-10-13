import type { z } from "zod";
import { getMessages } from "../i18n";
import { formatApiFailure, UserFacingError } from "./errors";

export async function api<T>(path: string, init?: RequestInit, responseSchema?: z.ZodType<T>): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { credentials: "same-origin", ...init, headers });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new UserFacingError(getMessages().errors.network);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => ({}));
    throw new UserFacingError(formatApiFailure(response.status, body), response.status);
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => { throw new UserFacingError(getMessages().errors.invalidResponse); });
  if (!responseSchema) return body as T;
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) throw new UserFacingError(getMessages().errors.invalidResponse);
  return parsed.data;
}
