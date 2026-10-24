import { statIds, type DamageResponse, type FieldInput, type PokemonSet } from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";

type DamageResultProps = {
  result: DamageResponse | null;
  attackerName: string;
  defenderName: string;
  attacker: PokemonSet;
  defender: PokemonSet;
  field: FieldInput;
  moveName: string;
  isCalculating: boolean;
  hasCatalog: boolean;
};

type MatchupLabels = { attacker: string; defender: string; move: string };

export function DamageResult({
  result,
  attackerName,
  defenderName,
  attacker,
  defender,
  field,
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
        <DamageEstimate result={result} matchupLabels={matchupLabels} attacker={attacker} defender={defender} field={field} />
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

function DamageEstimate({ result, matchupLabels, attacker, defender, field }: {
  result: DamageResponse;
  matchupLabels: MatchupLabels;
  attacker: PokemonSet;
  defender: PokemonSet;
  field: FieldInput;
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
      <details>
        <summary>{t.damage.calculationDetails}</summary>
        <h4>{t.damage.calculationInputs}</h4>
        <ul>
          <li>{t.damage.attackerSummary}: {matchupLabels.attacker} · {formatMessage(t.damage.levelSummary, { level: attacker.level })}</li>
          {attacker.item && <li>{formatMessage(t.damage.itemSummary, { side: t.damage.attackerSummary, value: label("items", attacker.item) })}</li>}
          {attacker.ability && <li>{formatMessage(t.damage.abilitySummary, { side: t.damage.attackerSummary, value: label("abilities", attacker.ability) })}</li>}
          <li>{formatMessage(t.damage.natureSummary, { side: t.damage.attackerSummary, value: label("natures", attacker.nature) })}</li>
          <li>{formatSpreadSummary(t.damage.attackerSummary, t.damage.evs, attacker.evs)}</li>
          <li>{formatSpreadSummary(t.damage.attackerSummary, t.damage.ivs, attacker.ivs)}</li>
          <li>{formatMessage(t.damage.teraSummary, { side: t.damage.attackerSummary, value: field.attackerTerastallized ? t.damage.teraYes : t.damage.teraNo })}</li>
          {attacker.teraType && <li>{formatMessage(t.damage.teraTypeSummary, { side: t.damage.attackerSummary, value: label("types", attacker.teraType) })}</li>}
          <li>{t.damage.defenderSummary}: {matchupLabels.defender} · {formatMessage(t.damage.levelSummary, { level: defender.level })}</li>
          {defender.item && <li>{formatMessage(t.damage.itemSummary, { side: t.damage.defenderSummary, value: label("items", defender.item) })}</li>}
          {defender.ability && <li>{formatMessage(t.damage.abilitySummary, { side: t.damage.defenderSummary, value: label("abilities", defender.ability) })}</li>}
          <li>{formatMessage(t.damage.natureSummary, { side: t.damage.defenderSummary, value: label("natures", defender.nature) })}</li>
          <li>{formatSpreadSummary(t.damage.defenderSummary, t.damage.evs, defender.evs)}</li>
          <li>{formatSpreadSummary(t.damage.defenderSummary, t.damage.ivs, defender.ivs)}</li>
          <li>{formatMessage(t.damage.teraSummary, { side: t.damage.defenderSummary, value: field.defenderTerastallized ? t.damage.teraYes : t.damage.teraNo })}</li>
          {defender.teraType && <li>{formatMessage(t.damage.teraTypeSummary, { side: t.damage.defenderSummary, value: label("types", defender.teraType) })}</li>}
          <li>{t.damage.gameTypeSummary}: {t.damage.gameTypes[field.gameType]}</li>
        </ul>
        <h4>{t.damage.calculationModifiers}</h4>
        <ul>
          {field.weather && <li>{formatMessage(t.damage.activeWeather, { value: t.damage.weather[field.weather] })}</li>}
          {field.terrain && <li>{formatMessage(t.damage.activeTerrain, { value: t.damage.terrain[field.terrain] })}</li>}
          {activeFieldLabels(field).map((modifier) => <li key={modifier}>{modifier}</li>)}
          {field.spikes > 0 && <li>{formatMessage(t.damage.spikesActive, { count: field.spikes })}</li>}
          {!field.weather && !field.terrain && activeFieldLabels(field).length === 0 && field.spikes === 0 && <li>{t.damage.noActiveModifiers}</li>}
        </ul>
        <h4>{t.damage.calculationDamage}</h4>
        <p>{formatMessage(t.damage.damageSummary, {
          min: result.min, max: result.max, minPercent: result.minPercent, maxPercent: result.maxPercent
        })}</p>
        <p>{formatMessage(t.damage.koSummary, { chance: Math.round(result.koChanceOnHit * 100) })}</p>
      </details>
    </>
  );
}

function formatSpreadSummary(side: string, spread: string, values: PokemonSet["evs"] | PokemonSet["ivs"]): string {
  const formatted = statIds.map((stat) => `${t.team.stats[stat]} ${values[stat]}`).join(" / ");
  return formatMessage(t.damage.spreadSummary, { side, spread, values: formatted });
}

function activeFieldLabels(field: FieldInput): string[] {
  const labels = t.damage.fieldLabels;
  return (Object.keys(labels) as (keyof typeof labels)[])
    .filter((key) => field[key])
    .map((key) => labels[key]);
}
