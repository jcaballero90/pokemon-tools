import type { TypeChartResponse } from "@pokemon-tools/contracts";
import { Shield } from "lucide-react";
import { label, t } from "../../i18n/presentation";
import { TypeIcon, typeClassName } from "./type-visuals";

const multiplierGroups = [4, 2, 1, 0.5, 0.25, 0] as const;

export type EffectivenessGroup = { multiplier: number; attackingTypes: string[] };

export function buildEffectivenessGroups(chart: TypeChartResponse, defendingTypes: string[]): EffectivenessGroup[] {
  return multiplierGroups.flatMap((multiplier) => {
    const attackingTypes = chart
      .filter((row) => row.attack !== "Stellar" && row.attack !== "???")
      .filter((row) => {
        const combinedMultiplier = defendingTypes.reduce(
          (result, defendingType) => result * (row.against[defendingType] ?? 1),
          1
        );
        return combinedMultiplier === multiplier;
      })
      .map((row) => row.attack)
      .sort((left, right) => label("types", left).localeCompare(label("types", right)));

    return attackingTypes.length ? [{ multiplier, attackingTypes }] : [];
  });
}

export function EffectivenessResults({
  hasSelection,
  groups
}: {
  hasSelection: boolean;
  groups: EffectivenessGroup[];
}) {
  if (!hasSelection) {
    return (
      <div className="defensive-results-empty" role="status">
        <Shield size={26} strokeWidth={1.7} aria-hidden="true" />
        <p>{t.chart.selectDefender}</p>
      </div>
    );
  }

  return (
    <section className="effectiveness-results" aria-labelledby="attack-heading">
      <div className="results-heading">
        <span className="eyebrow">{t.chart.matchupSummary}</span>
        <h2 id="attack-heading">{t.chart.attackingTypes}</h2>
      </div>
      {groups.length === 0
        ? <p role="status">{t.chart.noResults}</p>
        : (
          <div className="effectiveness-groups">
            {groups.map((group) => (
              <EffectivenessGroupCard key={group.multiplier} group={group} />
            ))}
          </div>
        )}
    </section>
  );
}

function EffectivenessGroupCard({ group }: { group: EffectivenessGroup }) {
  const groupId = group.multiplier.toString().replace(".", "-");

  return (
    <section
      className={`effectiveness-group multiplier-${groupId}`}
      aria-labelledby={`multiplier-heading-${groupId}`}
    >
      <h3 id={`multiplier-heading-${groupId}`}>
        {group.multiplier}×
      </h3>
      <ul className="attacking-type-cards">
        {group.attackingTypes.map((type) => {
          const typeClass = typeClassName(type);

          return (
            <li className={`attack-type-card${typeClass ? ` ${typeClass}` : ""}`} key={type}>
              <TypeIcon type={type} size={20} />
              <span>{label("types", type)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
