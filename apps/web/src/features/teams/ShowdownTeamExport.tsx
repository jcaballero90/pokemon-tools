import { useId, useState, useSyncExternalStore } from "react";
import type { CatalogResponse, TeamDraft } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { getLocaleSnapshot, subscribeLocale } from "../../i18n.js";
import { formatMessage, t } from "../../i18n/presentation";
import { formatSetIssueList } from "./set-validation";
import { exportShowdownPaste } from "./showdown-export";

type ShowdownTeamExportProps = {
  team: TeamDraft;
  catalog: CatalogResponse | null;
  numericInputsValid: boolean;
  onCancel: () => void;
};

export function ShowdownTeamExport({ team, catalog, numericInputsValid, onCancel }: ShowdownTeamExportProps) {
  useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleSnapshot);
  const textId = useId();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const result = exportShowdownPaste(team, catalog, numericInputsValid);
  const messages = formatSetIssueList(result.validationIssues);
  const canCopy = Boolean(result.text) && result.missingSpecies.length === 0 && numericInputsValid;

  async function handleCopy() {
    if (!canCopy) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(result.text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section className="showdown-import showdown-export" aria-labelledby="showdown-export-title">
      <div className="showdown-import-heading">
        <div>
          <h3 id="showdown-export-title">{t.team.showdown.exportTitle}</h3>
          <p>{t.team.showdown.exportDescription}</p>
        </div>
        <Button variant="ghost" onClick={onCancel}>{t.team.showdown.cancel}</Button>
      </div>

      <label htmlFor={textId}>{t.team.showdown.exportLabel}</label>
      <textarea id={textId} value={result.text} readOnly rows={12} spellCheck={false} />
      <p className="showdown-export-note">{t.team.showdown.exportUnsupportedFields}</p>

      {(result.missingSpecies.length > 0 || messages.length > 0 || !numericInputsValid) && (
        <div className="showdown-import-errors" role="alert">
          {messages.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
          {result.missingSpecies.map((pokemon) => (
            <p key={pokemon}>{formatMessage(t.team.showdown.exportMissingSpecies, { pokemon })}</p>
          ))}
          {!numericInputsValid && <p>{t.team.validation.numericDraftInvalid}</p>}
        </div>
      )}
      {!result.text && result.missingSpecies.length === 0 && result.validationIssues.length === 0 && numericInputsValid && (
        <p className="showdown-import-unavailable" role="status">{t.team.showdown.exportEmpty}</p>
      )}

      <div className="showdown-import-actions">
        <Button disabled={!canCopy} onClick={() => void handleCopy()}>{t.team.showdown.copy}</Button>
        <span className="showdown-export-copy-status" role="status" aria-live="polite">
          {copyState === "copied" && t.team.showdown.copied}
          {copyState === "failed" && t.team.showdown.copyFailed}
        </span>
      </div>
    </section>
  );
}
