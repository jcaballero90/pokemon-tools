import { useMemo, useState } from "react";
import type { CatalogResponse, EvolutionEdge, EvolutionNode, EvolutionResponse } from "@pokemon-tools/contracts";
import { label, t } from "../../i18n/presentation";

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
                  selectable={selectableNames.has(step.node.name)}
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
              <button
                type="button"
                className="mega-form-link"
                key={node.key}
                aria-current={node.key === selectedKey ? "true" : undefined}
                onClick={() => onSelect(node.name)}
              >
                <EvolutionIcon node={node} size="small" />
                <span>{label("species", node.name)}</span>
              </button>
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
  const alternatives = edge.alternatives.map((requirements) => requirements.join(" · ")).join(" / ");
  return (
    <div className="evolution-transition">
      <span className="evolution-arrow" aria-hidden="true">→</span>
      <span className="evolution-requirement">{alternatives}</span>
    </div>
  );
}

function EvolutionSpecies({ node, selected, selectable, onSelect }: {
  node: EvolutionNode;
  selected: boolean;
  selectable: boolean;
  onSelect: (name: string) => void;
}) {
  const name = label("species", node.name);
  const content = <><EvolutionIcon node={node} /><span>{name}</span></>;
  return selectable ? (
    <button type="button" className="evolution-species" aria-current={selected ? "true" : undefined} aria-label={t.pokedex.chooseEvolution.replace("{name}", name)} onClick={() => onSelect(node.name)}>
      {content}
    </button>
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
