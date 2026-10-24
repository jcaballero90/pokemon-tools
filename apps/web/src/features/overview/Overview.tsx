import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import { t } from "../../i18n/presentation";
import { siteTabPaths, type SiteTab } from "../../lib/pokedex-routes";

type OverviewCardData = {
  id: string;
  title: string;
  body: string;
  tab: SiteTab;
  hash?: string;
};

export function Overview() {
  const overviewCards: OverviewCardData[] = [
    { id: "type-chart", tab: "typeChart", ...t.overview.cards.typeChart },
    { id: "pokedex", tab: "pokedex", ...t.overview.cards.pokedex },
    { id: "team-builder", tab: "teamBuilder", ...t.overview.cards.teamBuilder },
    { id: "team-comparison", tab: "teamBuilder", hash: "#team-comparison", ...t.overview.cards.teamComparison },
    { id: "damage", tab: "damage", ...t.overview.cards.damage },
    { id: "saved-teams", tab: "privateLibrary", ...t.overview.cards.savedTeams },
  ];

  return (
    <div className="overview">
      <section className="hero panel" aria-labelledby="overview-heading">
        <h1 id="overview-heading">{t.overview.headline}</h1>
        <p>{t.overview.introduction}</p>
        <div className="actions">
          <Button asChild><Link to={siteTabPaths.teamBuilder}>{t.overview.buildTeam}</Link></Button>
          <Button asChild variant="outline"><Link to={siteTabPaths.damage}>{t.overview.openCalculator}</Link></Button>
        </div>
      </section>

      <nav className="overview-cards" aria-label={t.overview.featuresLabel}>
        {overviewCards.map((card) => <OverviewCard key={card.id} card={card} />)}
      </nav>
    </div>
  );
}

function OverviewCard({ card }: { card: OverviewCardData }) {
  return (
    <Link className="feature panel" to={`${siteTabPaths[card.tab]}${card.hash ?? ""}`}>
      <span className="feature-copy">
        <h2>{card.title}</h2>
        <p>{card.body}</p>
      </span>
      <ArrowRight className="feature-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}
