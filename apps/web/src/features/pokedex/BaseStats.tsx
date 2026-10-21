import { t } from "../../i18n/presentation";

type Species = { baseStats: Record<string, number> } | undefined;
const statOrder = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
type StatId = (typeof statOrder)[number];

export function BaseStats({ species, maxTotal }: { species: Species; maxTotal: number }) {
  const stats = species?.baseStats ?? {};
  const total = statOrder.reduce((sum, stat) => sum + (stats[stat] ?? 0), 0);
  return (
    <section className="pokedex-stats" aria-labelledby="pokedex-stats-title">
      <h3 id="pokedex-stats-title">{t.pokedex.baseStats}</h3>
      <div className="stats-list">
        {statOrder.map((stat) => {
          const value = stats[stat] ?? 0;
          const fill = statColor(value);
          return (
            <div className="stat-row" key={stat}>
              <span className="stat-label">{t.pokedex.stats[stat as StatId]}</span>
              <div
                className="stat-track"
                role="meter"
                aria-label={t.pokedex.stats[stat as StatId]}
                aria-valuemin={0}
                aria-valuemax={255}
                aria-valuenow={value}
                aria-valuetext={`${value} / 255`}
              >
                <span className={`stat-fill stat-fill--${fill}`} style={{ width: `${(value / 255) * 100}%` }} />
              </div>
              <b className="stat-value">{value}</b>
            </div>
          );
        })}
        <div className="stat-row stat-total">
          <span className="stat-label">{t.pokedex.statTotal}</span>
          <div
            className="stat-track"
            role="meter"
            aria-label={t.pokedex.statTotal}
            aria-valuemin={0}
            aria-valuemax={maxTotal}
            aria-valuenow={total}
            aria-valuetext={`${total} / ${maxTotal}`}
          >
            <span
              className={`stat-fill stat-fill--${statColor(total / statOrder.length)}`}
              style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
            />
          </div>
          <b className="stat-value">{total}</b>
        </div>
      </div>
    </section>
  );
}

function statColor(value: number) {
  if (value < 50) return "low";
  if (value < 80) return "modest";
  if (value < 100) return "steady";
  if (value < 120) return "good";
  if (value < 150) return "high";
  return "max";
}
