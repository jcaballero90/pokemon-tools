import type { CatalogResponse, TeamDraft } from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";

type CompareProps = {
  left: TeamDraft;
  right: TeamDraft;
  catalog: CatalogResponse | null;
};

type TeamSummary = {
  name: string;
  memberCount: string;
  types: string;
};

export function Compare({ left, right, catalog }: CompareProps) {
  const leftSummary = summarizeTeam(left, catalog);
  const rightSummary = summarizeTeam(right, catalog);

  return (
    <div className="panel compare">
      <span className="eyebrow">{t.comparison.eyebrow}</span>
      <h3>{t.comparison.title}</h3>
      <div className="compare-columns">
        <TeamSummary summary={leftSummary} />
        <TeamSummary summary={rightSummary} />
      </div>
      <p className="muted">{t.comparison.description}</p>
    </div>
  );
}

function summarizeTeam(team: TeamDraft, catalog: CatalogResponse | null): TeamSummary {
  const memberTypes = team.pokemon.flatMap((set) =>
    catalog?.species.find((entry) => entry.name === set.species)?.types ?? []
  );
  const distinctTypeLabels = [...new Set(memberTypes)].map((type) => label("types", type));

  return {
    name: team.name,
    memberCount: formatMessage(t.comparison.memberCount, { count: team.pokemon.length }),
    types: distinctTypeLabels.join(" · ") || t.comparison.noTypes
  };
}

function TeamSummary({ summary }: { summary: TeamSummary }) {
  return (
    <div>
      <b>{summary.name}</b>
      <p>{summary.memberCount}</p>
      <small>{summary.types}</small>
    </div>
  );
}
