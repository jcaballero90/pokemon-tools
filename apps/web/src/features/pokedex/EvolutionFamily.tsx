import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { CatalogResponse, EvolutionCondition, EvolutionEdge, EvolutionNode, EvolutionResponse } from "@pokemon-tools/contracts";
import { catalogTranslations, formatMessage, label, t } from "../../i18n/presentation";
import { catalogId } from "../../lib/catalog-labels";
import { speciesPath } from "../../lib/pokedex-routes";

type Species = CatalogResponse["species"][number];
type PathStep = { node: EvolutionNode; edge?: EvolutionEdge };

export function EvolutionFamily({ selected, selectedFamilyKey, catalog, evolution, onSelect }: {
  selected: string;
  selectedFamilyKey: string | undefined;
  catalog: Species[];
  evolution: EvolutionResponse | null;
  onSelect: (name: string) => void;
}) {
  const selectableNames = useMemo(() => new Set(catalog.map((entry) => entry.name)), [catalog]);
  const speciesByName = useMemo(() => new Map(catalog.map((entry) => [entry.name, entry])), [catalog]);
  if (!evolution) return <section className="panel evolution-panel"><h2>{t.pokedex.evolutionFamily}</h2><p role="status">{t.pokedex.evolutionLoading}</p></section>;
  if (evolution.unavailable || !evolution.nodes.length) {
    return <section className="panel evolution-panel"><h2>{t.pokedex.evolutionFamily}</h2><p role="status">{t.pokedex.evolutionUnavailable}</p></section>;
  }

  const paths = makePaths(evolution.nodes, evolution.edges);
  const hasNoEvolution = evolution.nodes.length === 1 && evolution.edges.length === 0;
  const selectedKey = selectedFamilyKey ? toKey(selectedFamilyKey) : toKey(selected);
  return (
    <section className="panel evolution-panel" aria-labelledby="evolution-title">
      <div className="evolution-heading">
        <h2 id="evolution-title">{t.pokedex.evolutionFamily}</h2>
        {hasNoEvolution && <span>{t.pokedex.noEvolution}</span>}
      </div>
      <div className="evolution-paths">
        {paths.map((path, pathIndex) => (
          <div className="evolution-path" key={`${path[0]?.node.key ?? "family"}-${path.at(-1)?.node.key ?? pathIndex}-${pathIndex}`}>
            {path.map((step, index) => (
              <div className="evolution-path-step" key={`${step.node.key}-${index}`}>
                {index > 0 && step.edge && <EvolutionTransition edge={step.edge} />}
                <EvolutionSpecies
                  node={step.node}
                  selected={step.node.key === selectedKey}
                  href={selectableNames.has(step.node.name) ? speciesPath(speciesByName.get(step.node.name) ?? { name: step.node.name }) : undefined}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {evolution.megaForms.length > 0 && (
        <div className="mega-forms">
          <h3>{t.pokedex.megaForms}</h3>
          <div className="mega-form-links">
            {evolution.megaForms.map((node) => (
              <Link
                className="mega-form-link"
                key={node.key}
                to={speciesPath(speciesByName.get(node.name) ?? { name: node.name })}
                aria-current={node.key === selectedKey ? "page" : undefined}
                onClick={() => onSelect(node.name)}
              >
                <EvolutionIcon node={node} size="small" />
                <span>{label("species", node.name)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function makePaths(nodes: EvolutionNode[], edges: EvolutionEdge[]): PathStep[][] {
  const byKey = new Map(nodes.map((node) => [node.key, node]));
  const outgoing = new Map<string, EvolutionEdge[]>();
  const incoming = new Set<string>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    incoming.add(edge.to);
  }
  const roots = nodes.filter((node) => !incoming.has(node.key));
  const paths: PathStep[][] = [];
  const walk = (node: EvolutionNode, path: PathStep[], seen: Set<string>) => {
    const next = (outgoing.get(node.key) ?? []).flatMap((edge) => {
      const target = byKey.get(edge.to);
      return target && !seen.has(target.key) ? [{ edge, target }] : [];
    });
    if (!next.length) {
      paths.push(path);
      return;
    }
    for (const { edge, target } of next) walk(target, [...path, { node: target, edge }], new Set([...seen, target.key]));
  };
  for (const root of roots.length ? roots : nodes.slice(0, 1)) walk(root, [{ node: root }], new Set([root.key]));
  return paths.length ? paths : nodes.map((node) => [{ node }]);
}

function EvolutionTransition({ edge }: { edge: EvolutionEdge }) {
  const alternatives = edge.conditionAlternatives?.length
    ? edge.conditionAlternatives.map(formatEvolutionConditions).filter(Boolean).join(" / ")
    : t.pokedex.evolutionMethodUnavailable;
  return (
    <div className="evolution-transition">
      <span className="evolution-arrow" aria-hidden="true">→</span>
      <span className="evolution-requirement">{alternatives}</span>
    </div>
  );
}

function formatEvolutionConditions(conditions: EvolutionCondition[]): string {
  const requirements = t.pokedex.evolutionRequirements;
  const specificConditions = conditions.filter((condition) => condition.field !== "trigger");
  const output = specificConditions.flatMap(({ field, value }) => {
    const text = String(value);
    const withValue = (template: string, item = text) => formatMessage(template, { value: item });
    switch (field) {
      case "min_level": return [withValue(requirements.level)];
      case "item": return [withValue(requirements.useItem, label("items", text))];
      case "held_item": return [withValue(requirements.holdItem, label("items", text))];
      case "min_happiness": return [requirements.highFriendship];
      case "min_beauty": return [withValue(requirements.beauty)];
      case "min_affection": return [requirements.affection];
      case "gender": return [value === "female" ? requirements.female : requirements.male];
      case "time_of_day": return [({ morning: requirements.morning, day: requirements.day, night: requirements.night, dusk: requirements.dusk }[text] ?? requirements.specialMethod)];
      case "relative_physical_stats": return [value === -1 ? requirements.compareAttackLower : value === 0 ? requirements.compareAttackEqual : requirements.compareAttackHigher];
      case "known_move": return [withValue(requirements.knowsMove, label("moves", text))];
      case "known_move_type": return [withValue(requirements.knowsTypeMove, label("types", text))];
      case "location": {
        const name = catalogTranslations.evolutionLocations?.[catalogId(text)];
        return [name ? withValue(requirements.atLocation, name) : requirements.atLocationGeneric];
      }
      case "party_species": return [withValue(requirements.withPartySpecies, label("species", text))];
      case "party_type": return [withValue(requirements.withPartyType, label("types", text))];
      case "trade_species": return [withValue(requirements.tradeSpecies, label("species", text))];
      case "required_pokemon_form": return [withValue(requirements.requiredForm, label("species", text))];
      case "evolved_pokemon_form": return [withValue(requirements.evolvedForm, label("species", text))];
      case "needs_overworld_rain": return [requirements.rain];
      case "needs_multiplayer": return [requirements.multiplayer];
      case "near_special_rock": return [requirements.specialRock];
      case "turn_upside_down": return [requirements.upsideDown];
      case "region": return [withValue(requirements.region, regionName(text))];
      case "used_move": return [withValue(requirements.useMove, label("moves", text))];
      case "min_move_count": return [withValue(requirements.moveCount)];
      case "min_steps": return [withValue(requirements.steps)];
      case "min_damage_taken": return [withValue(requirements.damage)];
      case "allowed_natures": return [withValue(requirements.allowedNatures, label("natures", text))];
      case "condition_expression": return [requirements.specialMethod];
      case "trigger": return [];
    }
  });

  if (!specificConditions.length) {
    const trigger = conditions.find((condition) => condition.field === "trigger")?.value;
    if (trigger === "level-up") output.push(requirements.levelUp);
    else if (trigger === "trade") output.push(requirements.trade);
    else if (trigger === "shed") output.push(requirements.shedMethod);
    else output.push(requirements.specialMethod);
  }
  return output.join(" · ");
}

function regionName(identifier: string): string {
  const names: Record<string, string> = {
    kanto: "Kanto", johto: "Johto", hoenn: "Hoenn", sinnoh: "Sinnoh", unova: "Unova",
    kalos: "Kalos", alola: "Alola", galar: "Galar", hisui: "Hisui", paldea: "Paldea"
  };
  return names[identifier] ?? identifier;
}

function EvolutionSpecies({ node, selected, href, onSelect }: {
  node: EvolutionNode;
  selected: boolean;
  href?: string;
  onSelect: (name: string) => void;
}) {
  const name = label("species", node.name);
  const content = <><EvolutionIcon node={node} /><span>{name}</span></>;
  return href ? (
    <Link to={href} className="evolution-species" aria-current={selected ? "page" : undefined} aria-label={t.pokedex.chooseEvolution.replace("{name}", name)} onClick={() => onSelect(node.name)}>
      {content}
    </Link>
  ) : (
    <span className="evolution-species evolution-species--static" aria-current={selected ? "true" : undefined}>{content}</span>
  );
}

function EvolutionIcon({ node, size }: { node: EvolutionNode; size?: "small" }) {
  const [candidate, setCandidate] = useState(0);
  const src = node.iconCandidates[candidate];
  return (
    <span className={`evolution-icon${size ? " evolution-icon--small" : ""}`}>
      {src ? (
        <img src={src} alt="" aria-hidden="true" onError={() => setCandidate((index) => Math.min(index + 1, node.iconCandidates.length))} />
      ) : <span className="evolution-icon-placeholder" aria-hidden="true">◇</span>}
    </span>
  );
}

function toKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
