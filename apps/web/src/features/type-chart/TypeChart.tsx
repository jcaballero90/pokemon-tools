import type { TypeChartResponse } from "@pokemon-tools/contracts";
import { label, t } from "../../i18n/presentation";

type TypeChartProps = { chart: TypeChartResponse; types: string[] };

export function TypeChart({ chart, types }: TypeChartProps) {
  if (!types.length) {
    return <div className="panel chart-wrap" role="status">{t.chart.loading}</div>;
  }

  return (
    <div className="panel chart-wrap">
      <EffectivenessLegend />
      <div className="table-scroll">
        <table className="type-chart">
          <thead>
            <tr>
              <th>{t.chart.axes}</th>
              {types.map((type) => (
                <th key={type}>{label("types", type)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.map((row) => (
              <tr key={row.attack}>
                <th>{label("types", row.attack)}</th>
                {types.map((type) => {
                  const multiplier = row.against[type] ?? 1;
                  return (
                    <td className={effectivenessClass(multiplier)} key={type}>
                      {multiplier}×
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function effectivenessClass(multiplier: number): string {
  if (multiplier === 0) return "immune";
  if (multiplier > 1) return "super";
  if (multiplier < 1) return "resist";
  return "neutral";
}

function EffectivenessLegend() {
  return (
    <div className="legend">
      <span><i className="super" /> {t.chart.superEffective}</span>
      <span><i className="neutral" /> {t.chart.neutral}</span>
      <span><i className="resist" /> {t.chart.resisted}</span>
      <span><i className="immune" /> {t.chart.immune}</span>
    </div>
  );
}
