import { ZodError } from "zod";
import { apiErrorResponseSchema, zodValidationIssues, type ApiErrorCode, type ApiValidationIssue } from "@pokemon-tools/contracts";
import { formatMessage, getMessages } from "../i18n";

export class UserFacingError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "UserFacingError";
  }
}

function fieldLabel(path: ApiValidationIssue["path"], locale?: string): string {
  const t = getMessages(locale);
  const parts: string[] = [];
  for (const part of path) {
    if (typeof part === "number") {
      const label = parts.pop() ?? t.errors.validation.fieldFallback;
      parts.push(formatMessage(t.errors.validation.pathEntry, { field: label, number: part + 1 }));
    } else {
      const label = t.errors.fields[part as keyof typeof t.errors.fields] ??
        t.team.stats[part as keyof typeof t.team.stats] ??
        t.damage.fieldLabels[part as keyof typeof t.damage.fieldLabels];
      if (label) parts.push(label);
    }
  }
  return parts.join(" · ") || t.errors.validation.fieldFallback;
}

function expectedLabel(value: string, field: string | number | undefined, locale?: string): string {
  const t = getMessages(locale);
  if (field === "status") return t.team.statuses[value as keyof typeof t.team.statuses] ?? value;
  if (field === "gameType") return t.damage.gameTypes[value as keyof typeof t.damage.gameTypes] ?? value;
  if (field === "weather") return value ? t.damage.weather[value as keyof typeof t.damage.weather] ?? value : t.damage.weather.none;
  if (field === "terrain") return value ? t.damage.terrain[value as keyof typeof t.damage.terrain] ?? value : t.damage.terrain.none;
  return value;
}

export function formatValidationIssue(issue: ApiValidationIssue, locale?: string): string {
  const t = getMessages(locale);
  if (issue.code !== "validation-failed") return formatMessage(t.errors.codes[issue.code], { value: issue.value ?? "" });
  const values = { field: fieldLabel(issue.path, locale), minimum: issue.minimum ?? "", maximum: issue.maximum ?? "" };
  switch (issue.rule) {
    case "required": return formatMessage(t.errors.validation.required, values);
    case "type": return formatMessage(t.errors.validation.type, values);
    case "minimum": return formatMessage(t.errors.validation.minimum, values);
    case "maximum": return formatMessage(t.errors.validation.maximum, values);
    case "length-minimum": return formatMessage(t.errors.validation.lengthMinimum, values);
    case "length-maximum": return formatMessage(t.errors.validation.lengthMaximum, values);
    case "ev-total": return t.errors.validation.evTotal;
    default: return issue.expected?.length
      ? formatMessage(t.errors.validation.allowedValues, { ...values, values: issue.expected.map((value) => expectedLabel(value, issue.path.at(-1), locale)).join(", ") })
      : formatMessage(t.errors.validation.invalidValue, values);
  }
}

export function formatApiFailure(status: number, body: unknown, locale?: string): string {
  const t = getMessages(locale);
  const parsed = apiErrorResponseSchema.safeParse(body);
  if (parsed.success) return parsed.data.issues?.length
    ? parsed.data.issues.map((issue) => formatValidationIssue(issue, locale)).join("; ")
    : formatMessage(t.errors.codes[parsed.data.code], { value: "" });

  // Better Auth owns its response format; use its stable codes, never its prose.
  const code = body && typeof body === "object" && "code" in body ? body.code : undefined;
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD": case "INVALID_PASSWORD": case "USER_NOT_FOUND": return t.errors.auth.invalidCredentials;
    case "USER_ALREADY_EXISTS": case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL": return t.errors.auth.emailInUse;
    case "INVALID_EMAIL": return t.errors.auth.invalidEmail;
    case "PASSWORD_TOO_SHORT": return t.errors.auth.passwordTooShort;
    case "PASSWORD_TOO_LONG": return t.errors.auth.passwordTooLong;
    case "EMAIL_NOT_VERIFIED": return t.errors.auth.emailNotVerified;
    case "SESSION_EXPIRED": case "UNAUTHORIZED": return t.errors.codes["sign-in-required"];
    case "TOO_MANY_REQUESTS": return t.errors.codes["rate-limited"];
  }
  const statusCodes: Partial<Record<number, ApiErrorCode>> = {
    400: "validation-failed", 401: "sign-in-required", 404: "not-found", 413: "body-too-large",
    415: "unsupported-media-type", 429: "rate-limited"
  };
  const knownCode = status >= 500 ? "internal-error" : statusCodes[status];
  return knownCode ? t.errors.codes[knownCode] : formatMessage(t.api.requestFailed, { status });
}

export function formatUiError(error: unknown, locale?: string): string {
  if (error instanceof UserFacingError) return error.message;
  if (error instanceof ZodError) return zodValidationIssues(error.issues).map((issue) => formatValidationIssue(issue, locale)).join("; ");
  return getMessages(locale).errors.codes["request-failed"];
}
