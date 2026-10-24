import type { CatalogResponse } from "@pokemon-tools/contracts";

export type SiteTab = "overview" | "typeChart" | "pokedex" | "teamBuilder" | "damage" | "privateLibrary" | "account";
type SpeciesEntry = CatalogResponse["species"][number];

export const siteTabPaths: Record<SiteTab, string> = {
  overview: "/",
  typeChart: "/type-chart",
  pokedex: "/pokedex",
  teamBuilder: "/team-builder",
  damage: "/damage",
  privateLibrary: "/private-library",
  account: "/account"
};

export type RouteResolution =
  | { kind: "page"; tab: SiteTab; species?: SpeciesEntry; canonicalPath: string; pendingSlug?: string }
  | { kind: "notFound" };

export function speciesSlug(name: string, suppliedSlug?: string): string {
  return suppliedSlug || name.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function speciesPath(entry: Pick<SpeciesEntry, "name" | "pokedexSlug">): string {
  return `${siteTabPaths.pokedex}/${encodeURIComponent(speciesSlug(entry.name, entry.pokedexSlug))}`;
}

export function resolveSiteRoute(pathname: string, catalog: CatalogResponse | null): RouteResolution {
  const path = normalizePath(pathname);
  const fixedRoute = Object.entries(siteTabPaths).find(([, routePath]) => routePath === path);
  if (fixedRoute) return { kind: "page", tab: fixedRoute[0] as SiteTab, canonicalPath: path };

  const pokemonPath = path.match(/^\/pokedex\/([^/]+)$/);
  if (!pokemonPath?.[1]) return { kind: "notFound" };

  let requestedSlug: string;
  try {
    requestedSlug = decodeURIComponent(pokemonPath[1]).toLowerCase();
  } catch {
    return { kind: "notFound" };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedSlug)) return { kind: "notFound" };
  if (!catalog) return { kind: "page", tab: "pokedex", canonicalPath: `${siteTabPaths.pokedex}/${requestedSlug}`, pendingSlug: requestedSlug };

  const species = catalog.species.find((entry) => entry.pokedexEligible !== false && speciesSlug(entry.name, entry.pokedexSlug) === requestedSlug);
  if (!species) return { kind: "notFound" };
  return { kind: "page", tab: "pokedex", species, canonicalPath: speciesPath(species) };
}

function normalizePath(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "") || "/";
}
