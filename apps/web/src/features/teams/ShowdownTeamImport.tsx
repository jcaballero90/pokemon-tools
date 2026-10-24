import { useId, useState, useSyncExternalStore } from "react";
import type { CatalogResponse, PokemonSet, TeamDraft } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { getCurrentLocale, getLocaleSnapshot, subscribeLocale } from "../../i18n.js";
import { formatMessage, t } from "../../i18n/presentation";
import { formatValidationIssue } from "../../lib/errors";
import {
  parseShowdownPaste,
  type ShowdownImportDiagnostic,
  type ShowdownImportResult,
  type ShowdownImportWarning
} from "./showdown-import";

type ShowdownTeamImportProps = {
  team: TeamDraft;
  catalog: CatalogResponse | null;
  onImport: (pokemon: PokemonSet[]) => void;
  onCancel: () => void;
};

function diagnosticMessage(diagnostic: ShowdownImportDiagnostic): string {
  const dictionary = t.team.showdown;
  const message = diagnostic.code === "schemaValidation" && diagnostic.issue
    ? formatMessage(dictionary.schemaValidation, {
      message: formatValidationIssue(diagnostic.issue, getCurrentLocale())
    })
    : formatMessage(dictionary[diagnostic.code], {
      value: diagnostic.value ?? "",
      count: diagnostic.count ?? "",
      message: ""
    });

  if (diagnostic.pokemon && diagnostic.line) {
    return formatMessage(dictionary.errorLocation, {
      pokemon: diagnostic.pokemon,
      line: diagnostic.line,
      message
    });
  }
  if (diagnostic.line) {
    return formatMessage(dictionary.lineLocation, { line: diagnostic.line, message });
  }
  return message;
}

function warningMessage(warning: ShowdownImportWarning): string {
  const template = warning.code === "gender"
    ? t.team.showdown.warningGender
    : t.team.showdown.warningUnsupportedField;
  return formatMessage(template, {
    value: warning.value,
    pokemon: warning.pokemon
  });
}

export function ShowdownTeamImport({ team, catalog, onImport, onCancel }: ShowdownTeamImportProps) {
  useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleSnapshot);
  const pasteId = useId();
  const [paste, setPaste] = useState("");
  const [review, setReview] = useState<ShowdownImportResult | null>(null);
  const catalogReady = Boolean(catalog?.species.length);

  function handleReview() {
    if (!catalog) return;
    setReview(parseShowdownPaste(paste, catalog));
  }

  function handlePasteChange(value: string) {
    setPaste(value);
    setReview(null);
  }

  function handleImport() {
    if (!review || review.errors.length > 0) return;
    onImport(review.pokemon);
  }

  const canImport = Boolean(review && review.errors.length === 0);

  return (
    <section className="showdown-import" aria-labelledby="showdown-import-title">
      <div className="showdown-import-heading">
        <div>
          <h3 id="showdown-import-title">{t.team.showdown.title}</h3>
          <p>{t.team.showdown.description}</p>
        </div>
        <Button variant="ghost" onClick={onCancel}>{t.team.showdown.cancel}</Button>
      </div>

      <label htmlFor={pasteId}>{t.team.showdown.pasteLabel}</label>
      <textarea
        id={pasteId}
        value={paste}
        placeholder={t.team.showdown.pastePlaceholder}
        onChange={(event) => handlePasteChange(event.target.value)}
        rows={12}
        spellCheck={false}
      />

      {!catalogReady && (
        <p className="showdown-import-unavailable" role="status">
          {t.team.showdown.catalogUnavailable}
        </p>
      )}

      <div className="showdown-import-actions">
        <Button variant="outline" disabled={!catalogReady || !paste.trim()} onClick={handleReview}>
          {t.team.showdown.review}
        </Button>
      </div>

      {review && (
        <div className="showdown-import-preview" aria-live="polite">
          <h4>{t.team.showdown.previewTitle}</h4>
          {team.pokemon.length > 0 && (
            <p className="showdown-import-replace-notice">
              {formatMessage(t.team.showdown.replaceNotice, { count: team.pokemon.length })}
            </p>
          )}

          {review.errors.length > 0 && (
            <div className="showdown-import-errors" role="alert">
              <b>{t.team.showdown.errorsTitle}</b>
              <ul>
                {review.errors.map((error, index) => (
                  <li key={`${error.code}-${error.line ?? ""}-${index}`}>{diagnosticMessage(error)}</li>
                ))}
              </ul>
            </div>
          )}

          {review.errors.length === 0 && (
            <>
              <p>{formatMessage(t.team.showdown.ready, { count: review.pokemon.length })}</p>
              <ol className="showdown-import-pokemon">
                {review.pokemon.map((set, index) => (
                  <li key={`${set.species}-${index}`}>
                    <b>{set.nickname ? `${set.nickname} (${set.species})` : set.species}</b>
                    {set.item && <span> · {set.item}</span>}
                    <small>{set.moves.join(" · ")}</small>
                  </li>
                ))}
              </ol>
            </>
          )}

          {review.warnings.length > 0 && (
            <div className="showdown-import-warnings">
              <b>{t.team.showdown.warningsTitle}</b>
              <ul>
                {review.warnings.map((warning) => (
                  <li key={`${warning.code}-${warning.pokemon}-${warning.line}`}>
                    {warningMessage(warning)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="showdown-import-actions">
            <Button disabled={!canImport} onClick={handleImport}>
              {team.pokemon.length > 0 ? t.team.showdown.replaceTeam : t.team.showdown.importTeam}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
