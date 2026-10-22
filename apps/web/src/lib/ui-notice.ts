import type { Locale } from "../i18n.js";
import { getMessages } from "../i18n.js";
import { formatUiError } from "./errors.js";

export type UiNoticeId =
  | "catalogUnavailable"
  | "typeChartUnavailable"
  | "teamStorageUnavailable"
  | "comparisonStorageUnavailable"
  | "teamSaved"
  | "accountCreated"
  | "accountSignedIn"
  | "accountSessionUnavailable";

export type UiNotice = { kind: "message"; id: UiNoticeId } | { kind: "error"; error: unknown };

export function formatUiNotice(notice: UiNotice, locale: Locale): string {
  if (notice.kind === "error") return formatUiError(notice.error, locale);
  const t = getMessages(locale);
  const messages: Record<UiNoticeId, string> = {
    catalogUnavailable: t.notices.catalogUnavailable,
    typeChartUnavailable: t.notices.typeChartUnavailable,
    teamStorageUnavailable: t.notices.teamStorageUnavailable,
    comparisonStorageUnavailable: t.notices.comparisonStorageUnavailable,
    teamSaved: t.notices.teamSaved,
    accountCreated: t.account.created,
    accountSignedIn: t.account.signedIn,
    accountSessionUnavailable: t.account.sessionUnavailable
  };
  return messages[notice.id];
}
