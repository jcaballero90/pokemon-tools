import type { ApiErrorCode, ApiValidationIssue } from "@pokemon-tools/contracts";

// English compatibility text lives here; clients translate the codes and fields.
export const errorMessages = {
  "sign-in-required": "Sign in required",
  "untrusted-origin": "Untrusted request origin",
  "team-not-found": "Team not found",
  "internal-error": "Internal server error",
  "request-failed": "Request failed",
  "not-found": "Not found",
  "body-too-large": "Request body too large",
  "unsupported-media-type": "Unsupported media type",
  "rate-limited": "Request failed",
  "validation-failed": "Request validation failed",
  "unknown-species": "Unknown species",
  "unknown-move": "Unknown move",
  "unknown-ability": "Unknown ability",
  "unknown-item": "Unknown item",
  "unknown-nature": "Unknown nature",
  "unknown-type": "Unknown Tera type",
  "missing-attacker-tera-type": "Attacker Tera type required when Terastallized",
  "missing-defender-tera-type": "Defender Tera type required when Terastallized",
  "untrusted-ingress": "Untrusted ingress",
  "ingress-not-configured": "Ingress not configured"
} satisfies Record<ApiErrorCode, string>;

export const errorText = {
  unknownGeneration9Species: "Unknown Generation 9 species",
  pokemonIssue: (number: number, message: string) => `Pokemon ${number}: ${message}`,
  unknownName: (issue: ApiValidationIssue) => `${errorMessages[issue.code]}: ${issue.value ?? ""}`,
  noEffect: (move: string, species: string) => `${move} has no effect on ${species}`,
  unexpectedRequestFailure: "Unexpected request failure"
};

export function validationIssueMessage(issue: ApiValidationIssue): string {
  return issue.code.startsWith("unknown-") ? errorText.unknownName(issue) : errorMessages[issue.code];
}
