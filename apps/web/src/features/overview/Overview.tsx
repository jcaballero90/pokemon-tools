import { Button } from "../../components/ui/button";
import { t } from "../../i18n/presentation";

type OverviewDestination = "typeChart" | "damage" | "proTeams" | "teamBuilder";
type OverviewProps = { goTo: (tab: OverviewDestination) => void };
type OverviewCardData = { number: string; title: string; body: string; tab: OverviewDestination };

const overviewCards: OverviewCardData[] = [
  { number: "01", tab: "typeChart", ...t.overview.cards.typeCoverage },
  { number: "02", tab: "damage", ...t.overview.cards.battleNumbers },
  { number: "03", tab: "proTeams", ...t.overview.cards.realTeams }
];

export function Overview({ goTo }: OverviewProps) {
  function openTeamBuilder() {
    goTo("teamBuilder");
  }

  function openDamageCalculator() {
    goTo("damage");
  }

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
          <Button onClick={openTeamBuilder}>{t.overview.buildTeam}</Button>
          <Button variant="outline" onClick={openDamageCalculator}>
            {t.overview.openCalculator}
          </Button>
        </div>
      </section>

      <div className="overview-cards">
        {overviewCards.map((card) => (
          <OverviewCard key={card.number} card={card} onSelect={goTo} />
        ))}
      </div>
    </div>
  );
}

function OverviewCard({ card, onSelect }: {
  card: OverviewCardData;
  onSelect: (destination: OverviewDestination) => void;
}) {
  return (
    <button className="feature panel" onClick={() => onSelect(card.tab)}>
      <span>{card.number}</span>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <b>{t.overview.explore}</b>
    </button>
  );
}
