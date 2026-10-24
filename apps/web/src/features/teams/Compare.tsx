import { useId, useSyncExternalStore } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import type { CatalogResponse, TeamDraft, TypeChartResponse } from "@pokemon-tools/contracts";
import { getLocaleSnapshot, subscribeLocale } from "../../i18n.js";
import { t } from "../../i18n/presentation";
import { standardTypes } from "./comparison-model";
import { TeamBalance } from "./TeamBalance";
import { TeamMatchup } from "./TeamMatchup";
import type { DamageTransferInput } from "./team-model";

type LoadState = "loading" | "ready" | "unavailable";

type CompareProps = {
  left: TeamDraft;
  right: TeamDraft;
  catalog: CatalogResponse | null;
  chart: TypeChartResponse | null;
  catalogStatus: LoadState;
  chartStatus: LoadState;
  invalidSetIndexesA?: ReadonlySet<number>;
  invalidSetIndexesB?: ReadonlySet<number>;
  onOpenDamage?: (pair: DamageTransferInput) => void;
};

export function Compare({
  left,
  right,
  catalog,
  chart,
  catalogStatus,
  chartStatus,
  invalidSetIndexesA,
  invalidSetIndexesB,
  onOpenDamage = () => undefined
}: CompareProps) {
  useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleSnapshot);
  const titleId = useId();
  const loading = catalogStatus === "loading" || chartStatus === "loading";
  const completeChart = chart && standardTypes.every((type) => {
    const row = chart.find((entry) => entry.attack === type);
    return row && standardTypes.every((defense) => [0, 0.5, 1, 2].includes(row.against[defense] ?? -1));
  });
  const ready = catalogStatus === "ready" && chartStatus === "ready" && catalog && completeChart;

  return (
    <section id="team-comparison" className="panel compare" tabIndex={-1} aria-labelledby={titleId}>
      <div className="comparison-heading">
        <span className="eyebrow">{t.comparison.eyebrow}</span>
        <h3 id={titleId}>{t.comparison.title}</h3>
      </div>
      <Tabs.Root defaultValue="matchup">
        <Tabs.List className="comparison-tabs" aria-label={t.comparison.viewLabel}>
          <Tabs.Trigger value="balance">{t.comparison.balanceTab}</Tabs.Trigger>
          <Tabs.Trigger value="matchup">{t.comparison.matchupTab}</Tabs.Trigger>
        </Tabs.List>
        {loading && <p className="comparison-data-state" role="status">{t.comparison.loading}</p>}
        {!loading && !ready && <p className="comparison-data-state" role="status">{t.comparison.unavailable}</p>}
        {ready && catalog && chart && (
          <>
            <Tabs.Content value="balance">
              <TeamBalance left={left} right={right} catalog={catalog} chart={chart} />
            </Tabs.Content>
            <Tabs.Content value="matchup">
              <TeamMatchup
                left={left}
                right={right}
                catalog={catalog}
                chart={chart}
                invalidSetIndexesA={invalidSetIndexesA}
                invalidSetIndexesB={invalidSetIndexesB}
                onOpenDamage={onOpenDamage}
              />
            </Tabs.Content>
          </>
        )}
      </Tabs.Root>
    </section>
  );
}
