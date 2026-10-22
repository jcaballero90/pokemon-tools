import { Button } from "../../components/ui/button";
import { t } from "../../i18n/presentation";
import { Link } from "react-router";
import { siteTabPaths, type SiteTab } from "../../lib/pokedex-routes";

type OverviewDestination = Extract<SiteTab, "typeChart" | "damage" | "teamBuilder">;
type OverviewCardData = { number: string; title: string; body: string; tab: OverviewDestination };

export function Overview() {
  const overviewCards: OverviewCardData[] = [
    { number: "01", tab: "typeChart", ...t.overview.cards.typeCoverage },
    { number: "02", tab: "damage", ...t.overview.cards.battleNumbers },
  ];

  return (
    <div className="overview">
      <section className="hero panel">
        <span className="eyebrow">{t.overview.eyebrow}</span>
        <h2>
          {t.overview.headline}<br />
          <em>{t.overview.headlineEmphasis}</em>
        </h2>
        <p>{t.overview.introduction}</p>
        <div className="actions">
          <Button asChild><Link to={siteTabPaths.teamBuilder}>{t.overview.buildTeam}</Link></Button>
          <Button asChild variant="outline"><Link to={siteTabPaths.damage}>{t.overview.openCalculator}</Link></Button>
        </div>
      </section>

      <div className="overview-cards">
        {overviewCards.map((card) => <OverviewCard key={card.number} card={card} />)}
      </div>
    </div>
  );
}

function OverviewCard({ card }: {
  card: OverviewCardData;
}) {
  return (
    <Link className="feature panel" to={siteTabPaths[card.tab]}>
      <span>{card.number}</span>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <b>{t.overview.explore}</b>
    </Link>
  );
}
