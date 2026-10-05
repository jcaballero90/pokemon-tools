import type { ProTeamsResponse } from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";

type ProTeam = ProTeamsResponse[number];
type PublishedSet = ProTeam["sets"][number];
type ProTeamsProps = { teams: ProTeamsResponse };

export function ProTeams({ teams }: ProTeamsProps) {
  return (
    <div className="pro-grid">
      {teams.map((team) => <ProTeamCard key={team.id} team={team} />)}
    </div>
  );
}

function ProTeamCard({ team }: { team: ProTeam }) {
  const speciesLabels = team.sets.map((set) => label("species", set.species));

  return (
    <article className="panel pro-card">
      <span className="eyebrow">{team.format} · {team.placement}</span>
      <h2>{team.player}</h2>
      <p>{team.event} · {team.eventDate}</p>

      <div className="species-chips">
        {team.sets.map((set, index) => (
          <span key={set.species}>{speciesLabels[index]}</span>
        ))}
      </div>

      <div className="pro-sets">
        {team.sets.map((set) => <PublishedPokemonSet key={set.species} set={set} />)}
      </div>

      <div className="source-links">
        <a href={team.source.url} target="_blank" rel="noreferrer">
          {team.source.title} ↗
        </a>
        <a href={team.source.pasteUrl} target="_blank" rel="noreferrer">
          {t.proTeams.originalPaste}
        </a>
      </div>
    </article>
  );
}

function PublishedPokemonSet({ set }: { set: PublishedSet }) {
  const evSummary = formatStatSpread(set.evs);
  const ivSummary = formatStatSpread(set.ivs);
  const moveSummary = set.moves.map((move) => label("moves", move)).join(" · ");

  return (
    <details>
      <summary>{label("species", set.species)} · {label("items", set.item)}</summary>
      <p>
        {label("abilities", set.ability)} · {label("natures", set.nature)} · {formatMessage(
          t.proTeams.teraType,
          { type: label("types", set.teraType) }
        )}
      </p>
      <p><b>{t.proTeams.evs}</b> {evSummary}</p>
      <p>
        <b>{t.proTeams.publishedIvs}</b> {ivSummary || t.proTeams.none}. {t.proTeams.unknownIvs}
      </p>
      <p><b>{t.proTeams.moves}</b> {moveSummary}</p>
    </details>
  );
}

function formatStatSpread(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([stat, value]) => {
      const statLabel = t.team.stats[stat as keyof typeof t.team.stats] ?? stat.toUpperCase();
      return `${value} ${statLabel}`;
    })
    .join(" / ");
}
