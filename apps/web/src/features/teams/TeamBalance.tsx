import type { CatalogResponse, TeamDraft, TypeChartResponse } from "@pokemon-tools/contracts";
import { formatMessage, label, t } from "../../i18n/presentation";
import { analyzeTeamDefense, type DefenseRow, type TeamDefense } from "./comparison-model";
import { memberList, sideLabel } from "./comparison-presentation";

type TeamBalanceProps = {
  left: TeamDraft;
  right: TeamDraft;
  catalog: CatalogResponse;
  chart: TypeChartResponse;
};

export function TeamBalance({ left, right, catalog, chart }: TeamBalanceProps) {
  return (
    <>
      <p className="comparison-note">{t.comparison.defenseNote}</p>
      <div className="comparison-teams">
        <TeamBalanceCard team={left} side="a" analysis={analyzeTeamDefense(left, catalog, chart)} />
        <TeamBalanceCard team={right} side="b" analysis={analyzeTeamDefense(right, catalog, chart)} />
      </div>
    </>
  );
}

function TeamBalanceCard({ team, side, analysis }: {
  team: TeamDraft;
  side: "a" | "b";
  analysis: TeamDefense;
}) {
  const excludedMembers = analysis.excluded.map((issue) => issue.member);

  return (
    <section className="comparison-team-card">
      <span className="eyebrow">{sideLabel(side)}</span>
      <h4>{team.name.trim() || t.team.defaultName}</h4>
      <p className="comparison-analyzed">
        {formatMessage(t.comparison.analyzed, { count: analysis.analyzed.length, total: team.pokemon.length })}
      </p>
      {excludedMembers.length > 0 && (
        <p className="comparison-warning" role="status">
          {formatMessage(t.comparison.incomplete, { pokemon: memberList(excludedMembers) })}
        </p>
      )}
      {team.pokemon.length === 0 && <p>{t.comparison.emptyTeam}</p>}
      {team.pokemon.length > 0 && analysis.analyzed.length === 0 && <p>{t.comparison.noAnalyzed}</p>}
      {analysis.analyzed.length > 0 && (
        <>
          <div className="comparison-summary-block">
            <h5>{t.comparison.gapsTitle}</h5>
            <p className="comparison-note">{t.comparison.gapsDescription}</p>
            {analysis.gaps.length === 0 && <p>{t.comparison.noGaps}</p>}
            <div className="comparison-risks">
              {analysis.gaps.map((row) => <DefenseRisk key={row.type} row={row} />)}
            </div>
          </div>
          <div className="comparison-summary-block">
            <h5>{t.comparison.sharedTitle}</h5>
            {analysis.sharedWeaknesses.length === 0 && <p>{t.comparison.noWeaknesses}</p>}
            <div className="comparison-risks">
              {analysis.sharedWeaknesses.map((row) => <DefenseRisk key={row.type} row={row} />)}
            </div>
          </div>
          <DefenseBreakdown rows={analysis.breakdown} />
        </>
      )}
    </section>
  );
}

function DefenseRisk({ row }: { row: DefenseRow }) {
  const counts = formatMessage(t.comparison.weakCounts, {
    weak: row.weak.length,
    quadruple: row.quadrupleWeak.length,
    resistant: row.resistant.length,
    immune: row.immune.length
  });

  return (
    <details className="comparison-risk">
      <summary>
        <b>{label("types", row.type)}</b>
        <span>{counts}</span>
      </summary>
      <dl>
        <dt>{t.comparison.weak}</dt><dd>{memberList(row.weak)}</dd>
        <dt>{t.comparison.quadruple}</dt><dd>{memberList(row.quadrupleWeak)}</dd>
        <dt>{t.comparison.resistant}</dt><dd>{memberList(row.resistant)}</dd>
        <dt>{t.comparison.immune}</dt><dd>{memberList(row.immune)}</dd>
      </dl>
    </details>
  );
}

function DefenseBreakdown({ rows }: { rows: DefenseRow[] }) {
  return (
    <details className="comparison-breakdown">
      <summary>{t.comparison.breakdown}</summary>
      <div className="comparison-table-scroll" tabIndex={0}>
        <table className="comparison-table">
          <caption>{t.comparison.breakdownCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.comparison.type}</th>
              <th scope="col">{t.comparison.weak}</th>
              <th scope="col">{t.comparison.quadruple}</th>
              <th scope="col">{t.comparison.resistant}</th>
              <th scope="col">{t.comparison.immune}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type}>
                <th scope="row">{label("types", row.type)}</th>
                <td>{row.weak.length}</td>
                <td>{row.quadrupleWeak.length}</td>
                <td>{row.resistant.length}</td>
                <td>{row.immune.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
