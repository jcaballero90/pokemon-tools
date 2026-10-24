import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CircleHelp, Equal, Swords } from "lucide-react";
import type { CatalogResponse, TeamDraft, TypeChartResponse } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { formatMessage, label, t } from "../../i18n/presentation";
import { copyPokemonSet } from "./team-model";
import { validatePokemonSet } from "./set-validation";
import type { DamageTransferInput } from "./team-model";
import {
  analyzeDirection,
  rankUnmodifiedSpeed,
  type AttackRow,
  type DirectionAnalysis,
  type MatchupCell,
  type SpeedRanking
} from "./comparison-model";
import { memberLabel, memberList, sideLabel } from "./comparison-presentation";

type TeamMatchupProps = {
  left: TeamDraft;
  right: TeamDraft;
  catalog: CatalogResponse;
  chart: TypeChartResponse;
  invalidSetIndexesA?: ReadonlySet<number>;
  invalidSetIndexesB?: ReadonlySet<number>;
  onOpenDamage: (pair: DamageTransferInput) => void;
};

export function TeamMatchup({
  left,
  right,
  catalog,
  chart,
  invalidSetIndexesA = new Set<number>(),
  invalidSetIndexesB = new Set<number>(),
  onOpenDamage
}: TeamMatchupProps) {
  const [direction, setDirection] = useState<"a" | "b">("a");
  const forward = analyzeDirection(left, right, catalog, chart);
  const reverse = analyzeDirection(right, left, catalog, chart);
  const analysis = direction === "a" ? forward : reverse;
  const hasTeams = left.pokemon.length > 0 && right.pokemon.length > 0;
  const hasMoveDetails = Boolean(catalog.moveDetails && Object.keys(catalog.moveDetails).length);
  const speedRanking = useMemo(() => rankUnmodifiedSpeed(left, right, catalog), [left, right, catalog]);
  const invalidSetsBySide = { a: invalidSetIndexesA, b: invalidSetIndexesB };

  return (
    <>
      <p className="comparison-note">{t.comparison.matchupNote}</p>
      {!hasTeams && <p role="status">{t.comparison.needBothTeams}</p>}
      {hasTeams && !hasMoveDetails && <p role="status">{t.comparison.moveDetailsUnavailable}</p>}
      {hasTeams && hasMoveDetails && (
        <>
          <div className="comparison-directions" role="group" aria-label={t.comparison.directionLabel}>
            <Button size="sm" variant="outline" aria-pressed={direction === "a"} onClick={() => setDirection("a")}>
              {t.comparison.attacksB}
            </Button>
            <Button size="sm" variant="outline" aria-pressed={direction === "b"} onClick={() => setDirection("b")}>
              {t.comparison.attacksA}
            </Button>
          </div>
          <MatchupGrid
            analysis={analysis}
            left={left}
            right={right}
            direction={direction}
            speedRanking={speedRanking}
            invalidSetsBySide={invalidSetsBySide}
            catalog={catalog}
            onOpenDamage={onOpenDamage}
          />
        </>
      )}
      <SpeedTable ranking={speedRanking} />
    </>
  );
}

function MatchupGrid({
  analysis,
  left,
  right,
  direction,
  speedRanking,
  invalidSetsBySide,
  catalog,
  onOpenDamage
}: {
  analysis: DirectionAnalysis;
  left: TeamDraft;
  right: TeamDraft;
  direction: "a" | "b";
  speedRanking: SpeedRanking;
  invalidSetsBySide: Record<"a" | "b", ReadonlySet<number>>;
  catalog: CatalogResponse;
  onOpenDamage: (pair: DamageTransferInput) => void;
}) {
  const attackingSide = direction;
  const defendingSide = direction === "a" ? "b" : "a";
  const attackingTeam = attackingSide === "a" ? left : right;
  const defendingTeam = defendingSide === "a" ? left : right;
  const omittedMoves = analysis.attackers.flatMap((row) => row.issues.map((issue) => ({
    key: `${row.member.index}-${issue.move}-${issue.reason}`,
    member: memberLabel(row.member),
    move: label("moves", issue.move),
    reason: t.comparison.moveIssue[issue.reason]
  })));
  const excludedMembers = analysis.excludedDefenders.map((issue) => issue.member);
  const speedBySlot = new Map(speedRanking.entries.map((entry) => [`${entry.team}:${entry.member.index}`, entry.speed]));

  return (
    <>
      {excludedMembers.length > 0 && (
        <p className="comparison-warning" role="status">
          {formatMessage(t.comparison.incomplete, { pokemon: memberList(excludedMembers) })}
        </p>
      )}
      <h4 className="comparison-matrix-title">{t.comparison.matchupCaption}</h4>
      <div className="comparison-table-scroll" tabIndex={0}>
        <table className="comparison-table comparison-matchup-table">
          <caption className="sr-only">{t.comparison.matchupCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.comparison.attacker}</th>
              {analysis.defenders.map((member) => <th key={member.index} scope="col">{memberLabel(member)}</th>)}
            </tr>
          </thead>
          <tbody>
            {analysis.attackers.map((row) => (
              <tr key={row.member.index}>
                <th scope="row">
                  {memberLabel(row.member)}
                  {row.state === "no-moves" && <small>{t.comparison.noMoves}</small>}
                  {row.state === "status-only" && <small>{t.comparison.statusOnly}</small>}
                  {row.state === "unknown-species" && <small>{t.comparison.speedIssue["unknown-species"]}</small>}
                </th>
                {row.cells.map((cell) => {
                  const attackerSet = attackingTeam.pokemon[row.member.index];
                  const defenderSet = defendingTeam.pokemon[cell.defender.index];
                  const attackerValid = Boolean(attackerSet) &&
                    validatePokemonSet(attackerSet, catalog).length === 0 &&
                    !invalidSetsBySide[attackingSide].has(row.member.index);
                  const defenderValid = Boolean(defenderSet) &&
                    validatePokemonSet(defenderSet, catalog).length === 0 &&
                    !invalidSetsBySide[defendingSide].has(cell.defender.index);
                  const disabledReason = !attackerValid || !defenderValid
                    ? t.comparison.transferInvalid
                    : cell.move === null
                      ? t.comparison.transferNoMove
                      : null;
                  const attackerSpeed = speedBySlot.get(`${attackingSide}:${row.member.index}`);
                  const defenderSpeed = speedBySlot.get(`${defendingSide}:${cell.defender.index}`);
                  const speedState = attackerSpeed === undefined || defenderSpeed === undefined
                    ? "unavailable"
                    : attackerSpeed > defenderSpeed
                      ? "faster"
                      : attackerSpeed < defenderSpeed
                        ? "slower"
                        : "tied";

                  return (
                    <MatchupValue
                      key={cell.defender.index}
                      cell={cell}
                      row={row}
                      speedState={speedState}
                      attackerLabel={memberLabel(row.member)}
                      defenderLabel={memberLabel(cell.defender)}
                      disabledReason={disabledReason}
                      onOpenDamage={() => {
                        if (!disabledReason && attackerSet && defenderSet && cell.move) {
                          onOpenDamage({ attacker: copyPokemonSet(attackerSet), defender: copyPokemonSet(defenderSet), move: cell.move });
                        }
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="comparison-note">{t.comparison.partialNote}</p>
      {omittedMoves.length > 0 && (
        <ul className="comparison-omitted-moves">
          {omittedMoves.map((issue) => (
            <li key={issue.key}><b>{issue.member}</b>: {issue.move} — {issue.reason}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function MatchupValue({
  cell,
  row,
  speedState,
  attackerLabel,
  defenderLabel,
  disabledReason,
  onOpenDamage
}: {
  cell: MatchupCell;
  row: AttackRow;
  speedState: "faster" | "slower" | "tied" | "unavailable";
  attackerLabel: string;
  defenderLabel: string;
  disabledReason: string | null;
  onOpenDamage: () => void;
}) {
  let className = "comparison-cell-unknown";
  if (cell.multiplier !== null) {
    className = "comparison-cell-neutral";
    if (cell.multiplier > 1) className = "comparison-cell-super";
    if (cell.multiplier > 0 && cell.multiplier < 1) className = "comparison-cell-resisted";
    if (cell.multiplier === 0) className = "comparison-cell-immune";
  }
  const noAttacks = !cell.partial && (row.state === "no-moves" || row.state === "status-only");
  const effectiveness = cell.multiplier === null
    ? noAttacks ? "—" : "?"
    : `${cell.multiplier}×`;
  const speedLabel = t.comparison[speedState === "unavailable" ? "speedUnavailable" : speedState];
  const SpeedIcon = speedState === "faster"
    ? ArrowUp
    : speedState === "slower"
      ? ArrowDown
      : speedState === "tied"
        ? Equal
        : CircleHelp;
  const actionLabel = formatMessage(t.comparison.openDamageLabel, {
    attacker: attackerLabel,
    defender: defenderLabel
  });
  const tooltipId = `damage-pair-${row.member.index}-${cell.defender.index}`;

  return (
    <td className={className}>
      <b>{effectiveness}</b>
      {cell.move && <small>{label("moves", cell.move)}</small>}
      {cell.partial && <small className="comparison-partial">{t.comparison.partial}</small>}
      <div className="comparison-cell-tools">
        <span className={`comparison-speed-indicator comparison-speed-indicator--${speedState}`} role="img" aria-label={speedLabel} title={speedLabel}>
          <SpeedIcon size={16} aria-hidden="true" />
          <span aria-hidden="true">{t.comparison.speedDescription[speedState]}</span>
        </span>
        <span className="comparison-damage-action">
          <button
            type="button"
            className="comparison-damage-button"
            aria-label={actionLabel}
            aria-describedby={tooltipId}
            title={disabledReason ?? t.comparison.openDamage}
            disabled={Boolean(disabledReason)}
            onClick={onOpenDamage}
          >
            <Swords size={15} aria-hidden="true" />
          </button>
          <span className="comparison-damage-tooltip" id={tooltipId} role="tooltip">
            {disabledReason ?? t.comparison.openDamage}
          </span>
        </span>
      </div>
    </td>
  );
}

function SpeedTable({ ranking }: { ranking: SpeedRanking }) {
  return (
    <section className="comparison-speed">
      <h4>{t.comparison.speedTitle}</h4>
      <p className="comparison-note">{t.comparison.speedNote}</p>
      {ranking.entries.length === 0 && <p>{t.comparison.noSpeed}</p>}
      {ranking.entries.length > 0 && (
        <div className="comparison-table-scroll" tabIndex={0}>
          <table className="comparison-table comparison-speed-table">
            <caption className="sr-only">{t.comparison.speedCaption}</caption>
            <thead>
              <tr>
                <th scope="col" aria-label={t.comparison.rank}>#</th>
                <th scope="col">{t.comparison.pokemon}</th>
                <th scope="col">{t.comparison.team}</th>
                <th scope="col">{t.comparison.speed}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.entries.map((entry) => (
                <tr key={`${entry.team}-${entry.member.index}`}>
                  <td>{entry.rank}</td>
                  <th scope="row">{memberLabel(entry.member)}</th>
                  <td>{sideLabel(entry.team)}</td>
                  <td><b>{entry.speed}</b>{entry.tied && <small>{t.comparison.tie}</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ranking.excluded.length > 0 && (
        <ul className="comparison-warning">
          {ranking.excluded.map((issue) => (
            <li key={`${issue.team}-${issue.member.index}`}>
              {sideLabel(issue.team)} · {memberLabel(issue.member)} — {t.comparison.speedIssue[issue.reason]}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
