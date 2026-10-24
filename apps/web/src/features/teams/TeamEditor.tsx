import { useMemo, useRef, useState } from "react";
import type { CatalogResponse, PokemonSet, SavedTeamResponse, TeamDraft } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { label, t } from "../../i18n/presentation";
import { emptySet } from "./team-model";
import { PokemonSetEditor } from "./PokemonSetEditor";
import { ShowdownTeamImport } from "./ShowdownTeamImport";
import { ShowdownTeamExport } from "./ShowdownTeamExport";
import { formatSetIssueList, validateTeamDraft } from "./set-validation";

const noOptions: string[] = [];

export type TeamEditorProps = {
  title: string;
  team: TeamDraft;
  onChange: (team: TeamDraft) => void;
  catalog: CatalogResponse | null;
  side?: "a" | "b";
  showValidationErrors?: boolean;
  onNumericSetValidityChange?: (index: number, valid: boolean) => void;
  userSignedIn?: boolean;
  savedTeams?: SavedTeamResponse[];
  libraryStatus?: "loading" | "ready" | "error";
  libraryBusy?: boolean;
  sourceTeamId?: string | null;
  sourceIsVerified?: boolean;
  onLoadSavedTeam?: (teamId: string) => void;
  onSaveTeam?: () => void;
  onSaveCopy?: () => void;
  onRetryLibrary?: () => void;
};

export function TeamEditor({ title, team, onChange, catalog, side = "a", showValidationErrors = false, onNumericSetValidityChange, userSignedIn = false, savedTeams = [], libraryStatus = "loading", libraryBusy = false, sourceTeamId = null, sourceIsVerified = false, onLoadSavedTeam, onSaveTeam, onSaveCopy, onRetryLibrary }: TeamEditorProps) {
  const [teamTool, setTeamTool] = useState<"import" | "export" | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [numericValidity, setNumericValidity] = useState<Record<string, boolean>>({});
  const numericValidityRef = useRef<Record<string, boolean>>({});
  const speciesNames = useMemo(
    () => catalog?.species.map((entry) => entry.name) ?? noOptions,
    [catalog]
  );
  const validationIssues = validateTeamDraft(team, catalog);
  const numericInputsValid = !Object.values(numericValidity).some((valid) => !valid);
  const validationMessages = formatSetIssueList(validationIssues);

  function handleNumericValidityChange(index: number, field: string, valid: boolean) {
    const key = `${index}:${field}`;
    const next = { ...numericValidityRef.current, [key]: valid };
    numericValidityRef.current = next;
    setNumericValidity(next);
    const setValid = !Object.entries(next).some(([entry, isValid]) => entry.startsWith(`${index}:`) && !isValid);
    onNumericSetValidityChange?.(index, setValid);
  }

  function handleTeamNameChange(name: string) {
    onChange({ ...team, name });
  }

  function handleSetChange(index: number, updatedSet: PokemonSet) {
    const pokemon = team.pokemon.map((set, setIndex) =>
      setIndex === index ? updatedSet : set
    );
    onChange({ ...team, pokemon });
  }

  function handleSetRemove(index: number) {
    const pokemon = team.pokemon.filter((_, setIndex) => setIndex !== index);
    onChange({ ...team, pokemon });
    const nextValidity = Object.fromEntries(Object.entries(numericValidityRef.current).flatMap(([key, valid]) => {
      const [rawIndex, ...fieldParts] = key.split(":");
      const currentIndex = Number(rawIndex);
      if (currentIndex === index) return [];
      const shiftedIndex = currentIndex > index ? currentIndex - 1 : currentIndex;
      return [[`${shiftedIndex}:${fieldParts.join(":")}`, valid]];
    }));
    numericValidityRef.current = nextValidity;
    setNumericValidity(nextValidity);
    onNumericSetValidityChange?.(index, true);
    pokemon.forEach((_, nextIndex) => {
      const isValid = !Object.entries(nextValidity).some(([key, valid]) => key.startsWith(`${nextIndex}:`) && !valid);
      onNumericSetValidityChange?.(nextIndex, isValid);
    });
  }

  function handleSetAdd() {
    onChange({ ...team, pokemon: [...team.pokemon, emptySet()] });
  }

  function handleImport(importedPokemon: PokemonSet[]) {
    const previousIndexes = new Set(Object.keys(numericValidityRef.current).map((key) => Number(key.split(":")[0])));
    onChange({ ...team, pokemon: importedPokemon });
    numericValidityRef.current = {};
    setNumericValidity({});
    setShowErrors(false);
    previousIndexes.forEach((index) => onNumericSetValidityChange?.(index, true));
    importedPokemon.forEach((_, index) => onNumericSetValidityChange?.(index, true));
    setTeamTool(null);
  }

  function handleExportOpen() {
    setShowErrors(true);
    setTeamTool("export");
  }

  const shouldShowErrors = showErrors || showValidationErrors;
  const showTeamIssues = shouldShowErrors && (validationMessages.length > 0 || !numericInputsValid);

  return (
    <section className="panel team-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{side === "b" ? t.team.sideB : t.team.sideA}</span>
          <h2>{title}</h2>
        </div>
        <span>{team.pokemon.length}/6</span>
      </div>

      <label>
        {t.team.name}
        <input
          value={team.name}
          onChange={(event) => handleTeamNameChange(event.target.value)}
        />
      </label>

      {userSignedIn ? (
        <div className="saved-team-controls">
          <label>
            {t.team.loadSavedTeam}
            <select value="" disabled={libraryBusy || libraryStatus !== "ready" || savedTeams.length === 0} onChange={(event) => event.target.value && onLoadSavedTeam?.(event.target.value)}>
              <option value="">{libraryStatus === "loading" ? t.account.libraryLoading : t.team.chooseSavedTeam}</option>
              {savedTeams.map((savedTeam) => {
                const members = savedTeam.pokemon.map((pokemon) => label("species", pokemon.species)).join(", ");
                return <option key={savedTeam.id} value={savedTeam.id}>{members ? `${savedTeam.name} — ${members}` : savedTeam.name}</option>;
              })}
            </select>
          </label>
          {libraryStatus === "error" && <div className="saved-library-error" role="status"><span>{t.account.libraryFailed}</span><Button type="button" variant="outline" disabled={libraryBusy} onClick={onRetryLibrary}>{t.account.retryLibrary}</Button></div>}
          <div className="saved-team-save-actions">
            {sourceTeamId ? (
              <>
                <Button type="button" variant="outline" disabled={libraryBusy || libraryStatus !== "ready" || !sourceIsVerified} title={!sourceIsVerified ? t.team.saveSourceUnavailable : undefined} onClick={onSaveTeam}>{t.team.saveChanges}</Button>
                <Button type="button" variant="outline" disabled={libraryBusy || libraryStatus !== "ready"} onClick={onSaveCopy}>{t.team.saveCopy}</Button>
              </>
            ) : <Button type="button" disabled={libraryBusy || libraryStatus !== "ready"} onClick={onSaveTeam}>{t.team.saveButton}</Button>}
          </div>
          {sourceTeamId && !sourceIsVerified && libraryStatus === "ready" && <p className="field-help">{t.team.saveSourceUnavailable}</p>}
        </div>
      ) : (
        <a className="text-link" href="/account">{t.team.signInOrCreate}</a>
      )}

      {team.pokemon.map((set, index) => (
        <PokemonSetEditor
          key={index}
          index={index}
          set={set}
          catalog={catalog}
          speciesNames={speciesNames}
          moveNames={catalog?.moves ?? noOptions}
          isLastSet={index === team.pokemon.length - 1}
          showValidationErrors={shouldShowErrors}
          onChange={(updatedSet) => handleSetChange(index, updatedSet)}
          onRemove={() => handleSetRemove(index)}
          onNumericValidityChange={handleNumericValidityChange}
        />
      ))}

      <div className="team-editor-actions">
        <Button
          variant="outline"
          disabled={team.pokemon.length >= 6}
          onClick={handleSetAdd}
        >
          {t.team.addPokemon}
        </Button>
        {teamTool === null && (
          <>
            <Button variant="outline" onClick={() => setTeamTool("import")}>
              {t.team.showdown.importButton}
            </Button>
            <Button variant="outline" onClick={handleExportOpen}>
              {t.team.showdown.exportButton}
            </Button>
          </>
        )}
      </div>

      {teamTool === "import" && (
        <ShowdownTeamImport
          team={team}
          catalog={catalog}
          onImport={handleImport}
          onCancel={() => setTeamTool(null)}
        />
      )}
      {teamTool === "export" && (
        <ShowdownTeamExport
          team={team}
          catalog={catalog}
          numericInputsValid={numericInputsValid}
          onCancel={() => setTeamTool(null)}
        />
      )}
      {showTeamIssues && (
        <div className="team-validation-errors" role="alert">
          {validationMessages.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}
          {!numericInputsValid && <p>{t.team.validation.numericDraftInvalid}</p>}
        </div>
      )}
    </section>
  );
}
