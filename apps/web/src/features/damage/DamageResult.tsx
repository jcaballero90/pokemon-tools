import type { DamageResponse } from "@pokemon-tools/contracts";
import { formatMessage, label, locale, t } from "../../i18n/presentation";

type DamageResultProps = {
  result: DamageResponse | null;
  attackerName: string;
  defenderName: string;
  moveName: string;
  isCalculating: boolean;
  hasCatalog: boolean;
};

type MatchupLabels = { attacker: string; defender: string; move: string };

export function DamageResult({
  result,
  attackerName,
  defenderName,
  moveName,
  isCalculating,
  hasCatalog
}: DamageResultProps) {
  const matchupLabels = getMatchupLabels(result, attackerName, defenderName, moveName);
  const generationLabel = hasCatalog
    ? formatMessage(t.damage.generation, { generation: 9 })
    : "";
  const mechanicsDescription = formatMessage(t.damage.mechanics, {
    calc: "@smogon/calc",
    generation: generationLabel
  });

  return (
    <div className="panel result-card">
      <span className="eyebrow">{t.damage.resultEyebrow}</span>
      {result ? (
        <DamageEstimate result={result} matchupLabels={matchupLabels} />
      ) : (
        <p role="status">
          {isCalculating ? t.damage.damageMatchupPending : t.damage.inputsChanged}
        </p>
      )}
      <p className="muted">{mechanicsDescription}</p>
    </div>
  );
}

function getMatchupLabels(
  result: DamageResponse | null,
  attackerName: string,
  defenderName: string,
  moveName: string
): MatchupLabels {
  const matchup = result?.matchup ?? {
    attacker: attackerName,
    defender: defenderName,
    move: moveName
  };

  return {
    attacker: label("species", matchup.attacker),
    defender: label("species", matchup.defender),
    move: label("moves", matchup.move)
  };
}

function DamageEstimate({ result, matchupLabels }: {
  result: DamageResponse;
  matchupLabels: MatchupLabels;
}) {
  const damageRange = formatMessage(t.damage.hpRange, {
    min: result.min,
    max: result.max,
    hp: result.defenderHp,
    hpUnit: t.team.stats.hp
  });
  const koChance = formatMessage(t.damage.koChance, {
    chance: Math.round(result.koChanceOnHit * 100)
  });
  const hasEffect = result.hasEffect ?? result.max > 0;
  const matchupDescription = formatMessage(
    hasEffect ? t.damage.matchup : t.damage.noEffect,
    matchupLabels
  );
  const meterWidth = `${Math.min(result.maxPercent, 100)}%`;

  return (
    <>
      <h2>{result.minPercent}–{result.maxPercent}%</h2>
      <p>{damageRange}</p>
      <div className="damage-meter"><span style={{ width: meterWidth }} /></div>
      <h3>{koChance}</h3>
      <p className="muted">{t.damage.conditionalAccuracy}</p>
      <p>{matchupDescription}</p>
      {locale === "en" && (
        <details>
          <summary>{t.damage.calculationDetails}</summary>
          <p>{result.description}</p>
        </details>
      )}
    </>
  );
}
