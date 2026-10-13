import type { ApiErrorCode, ApiErrorResponse, ApiValidationIssue } from "@pokemon-tools/contracts";
import type { FastifySchemaValidationError } from "fastify";
import { errorMessages } from "./resources/errors.js";

export { zodValidationIssues } from "@pokemon-tools/contracts";

export class InputValidationError extends Error {
  constructor(message: string, readonly issues: ApiValidationIssue[] = [], readonly code: ApiErrorCode = "validation-failed") {
    super(message);
    this.name = "InputValidationError";
  }
}

export function apiError(code: ApiErrorCode, error: ApiErrorResponse["error"] = errorMessages[code], issues?: ApiValidationIssue[]): ApiErrorResponse {
  return { error, code, ...(issues?.length ? { issues } : {}) };
}

export function fastifyValidationIssues(issues: readonly FastifySchemaValidationError[]): ApiValidationIssue[] {
  return issues.map((issue) => {
    const path = (issue.instancePath ?? "").split("/").slice(1).map((part) => {
      const decoded = part.replace(/~1/g, "/").replace(/~0/g, "~");
      return /^\d+$/.test(decoded) ? Number(decoded) : decoded;
    });
    const base: ApiValidationIssue = { code: "validation-failed", path };
    if (issue.keyword === "required") return { ...base, path: [...path, String(issue.params.missingProperty)], rule: "required" };
    if (issue.keyword === "type") return { ...base, rule: "type", expected: [String(issue.params.type)] };
    if (issue.keyword === "minimum" || issue.keyword === "maximum") return { ...base, rule: issue.keyword, [issue.keyword]: Number(issue.params.limit) };
    if (issue.keyword === "minLength" || issue.keyword === "minItems") return { ...base, rule: "length-minimum", minimum: Number(issue.params.limit) };
    if (issue.keyword === "maxLength" || issue.keyword === "maxItems") return { ...base, rule: "length-maximum", maximum: Number(issue.params.limit) };
    if (issue.keyword === "enum" && Array.isArray(issue.params.allowedValues)) return { ...base, rule: "invalid-value", expected: issue.params.allowedValues.map(String) };
    return { ...base, rule: "invalid-value" };
  });
}
