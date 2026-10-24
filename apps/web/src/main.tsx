import { Moon, Sun } from "lucide-react";
import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, useLocation, useNavigate } from "react-router";
import {
  catalogResponseSchema,
  savedTeamResponseSchema,
  savedTeamsResponseSchema,
  teamInputSchema,
  type CatalogResponse,
  type SavedTeamResponse,
  type TeamDraft,
  type TeamInput,
  type TypeChartResponse,
  typeChartResponseSchema
} from "@pokemon-tools/contracts";
import { Button } from "./components/ui/button";
import { Account, type AccountUser } from "./features/account/Account";
import { Compare } from "./features/teams/Compare";
import { TeamEditor } from "./features/teams/TeamEditor";
import { Damage } from "./features/damage/Damage";
import { Overview } from "./features/overview/Overview";
import { Pokedex } from "./features/pokedex/Pokedex";
import { TypeChart } from "./features/type-chart/TypeChart";
import { formatMessage, label, t } from "./i18n/presentation";
import { LocaleProvider, useLocale } from "./i18n/LocaleProvider";
import { setApiCatalogTranslations } from "./i18n";
import { formatUiNotice, type UiNotice } from "./lib/ui-notice";
import { api } from "./lib/api";
import { resolveSiteRoute, siteTabPaths, type SiteTab } from "./lib/pokedex-routes";
import { loadTeamDraft, saveTeamDraft } from "./lib/team-drafts";
import { copyPokemonSet, submittedTeam, type DamageTransfer } from "./features/teams/team-model";
import { validateTeamDraft } from "./features/teams/set-validation";
import { CatalogDatalists } from "./components/catalog-datalists";
import { useTheme } from "./lib/use-theme";
import "./style.css";
import "./theme.css";

type SavedTeam = SavedTeamResponse;
const tabs: SiteTab[] = ["overview", "typeChart", "pokedex", "teamBuilder", "damage", "account"];
const emptyTeam = (): TeamInput => teamInputSchema.parse({ name: t.team.defaultName, pokemon: [] });
type PublicSiteConfig = { publicBaseUrl: string; deployEnv: "development" | "staging" | "production" };

function isPublicSiteConfig(value: unknown): value is PublicSiteConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Record<string, unknown>;
  if (typeof config.publicBaseUrl !== "string" || !["development", "staging", "production"].includes(String(config.deployEnv))) return false;
  try { new URL(config.publicBaseUrl); return true; } catch { return false; }
}

function setMetaContent(name: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

function setCanonicalUrl(href: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = href;
}

function removeCanonicalUrl() {
  document.head.querySelector('link[rel="canonical"]')?.remove();
}

export function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [chart, setChart] = useState<TypeChartResponse | null>(null);
  const [chartStatus, setChartStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [saved, setSaved] = useState<SavedTeam[]>([]);
  const [notice, setNotice] = useState<UiNotice | null>(null);
  const [siteConfig, setSiteConfig] = useState<PublicSiteConfig | null>(null);
  const [team, setTeam] = useState<TeamDraft>(() => loadTeamDraft("team", emptyTeam()));
  const [comparison, setComparison] = useState<TeamDraft>(() => loadTeamDraft("comparison", emptyTeam()));
  const [invalidNumericSetsA, setInvalidNumericSetsA] = useState<ReadonlySet<number>>(() => new Set());
  const [invalidNumericSetsB, setInvalidNumericSetsB] = useState<ReadonlySet<number>>(() => new Set());
  const [showTeamValidationErrors, setShowTeamValidationErrors] = useState(false);
  const [damageTransfer, setDamageTransfer] = useState<DamageTransfer | undefined>();
  const sessionGeneration = useRef(0);
  const damageTransferSequence = useRef(0);

  const route = resolveSiteRoute(location.pathname, catalog);
  const tab = route.kind === "page" ? route.tab : null;
  const tabLabels: Record<SiteTab, string> = t.tabs;
  const descriptions: Record<SiteTab, string> = t.descriptions;
  const entryName = route.kind === "page" && route.species ? label("species", route.species.name) : undefined;
  let pageTitle: string;
  let pageDescription: string;
  if (route.kind === "notFound") {
    pageTitle = t.seo.notFoundTitle;
    pageDescription = t.seo.notFoundDescription;
  } else if (route.species) {
    pageTitle = formatMessage(t.seo.pokemonTitle, { name: entryName ?? route.species.name });
    pageDescription = formatMessage(t.seo.pokemonDescription, { name: entryName ?? route.species.name, number: route.species.nationalDexId ?? "?" });
  } else {
    const pageTab = tab ?? "overview";
    pageTitle = pageTab === "overview" ? t.app.title : `${tabLabels[pageTab]} | ${t.app.title}`;
    pageDescription = descriptions[pageTab];
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = pageTitle;
    setMetaContent("description", pageDescription);
    setMetaContent("robots", siteConfig?.deployEnv === "production" ? "index,follow" : "noindex,nofollow");
    if (route.kind === "page") {
      const canonicalOrigin = siteConfig?.publicBaseUrl ? new URL(siteConfig.publicBaseUrl).origin : window.location.origin;
      setCanonicalUrl(new URL(route.canonicalPath, canonicalOrigin).toString());
    } else {
      removeCanonicalUrl();
    }
  }, [locale, pageTitle, pageDescription, route.kind, route.kind === "page" ? route.canonicalPath : "", siteConfig]);

  useEffect(() => {
    const controller = new AbortController();
    void api<PublicSiteConfig>("/site-config", { signal: controller.signal })
      .then((value) => {
        if (controller.signal.aborted || !isPublicSiteConfig(value)) return;
        setSiteConfig(value);
      })
      .catch(() => { /* keep indexing disabled if deployment metadata is unavailable */ });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (route.kind === "page" && location.pathname !== route.canonicalPath) navigate(route.canonicalPath, { replace: true });
  }, [location.pathname, navigate, route]);

  const refreshSession = useCallback(async (): Promise<AccountUser | null> => {
    const generation = ++sessionGeneration.current;
    setSaved([]);

    try {
      const result = await api<{ user?: AccountUser }>("/auth/get-session");
      if (generation !== sessionGeneration.current) return null;

      const currentUser = result?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return null;

      const teams = await api<SavedTeam[]>("/me/teams", undefined, savedTeamsResponseSchema);
      if (generation === sessionGeneration.current) setSaved(teams);
      return currentUser;
    } catch {
      if (generation === sessionGeneration.current) {
        setUser(null);
        setSaved([]);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    void api<CatalogResponse>("/catalog", undefined, catalogResponseSchema)
      .then((result) => {
        setCatalog(result);
        setApiCatalogTranslations(result.translations);
        setCatalogStatus(result.species.length > 0 ? "ready" : "unavailable");
      })
      .catch(() => {
        setCatalogStatus("unavailable");
        setNotice({ kind: "message", id: "catalogUnavailable" });
      });
    void api<TypeChartResponse>("/type-chart", undefined, typeChartResponseSchema)
      .then((result) => {
        setChart(result);
        setChartStatus(result.length > 0 ? "ready" : "unavailable");
        if (result.length === 0) setNotice({ kind: "message", id: "typeChartUnavailable" });
      })
      .catch(() => {
        setChartStatus("unavailable");
        setNotice({ kind: "message", id: "typeChartUnavailable" });
      });
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!saveTeamDraft("team", team)) setNotice({ kind: "message", id: "teamStorageUnavailable" });
  }, [team]);

  useEffect(() => {
    if (!saveTeamDraft("comparison", comparison)) {
      setNotice({ kind: "message", id: "comparisonStorageUnavailable" });
    }
  }, [comparison]);

  function clearPrivateLibrary() {
    sessionGeneration.current++;
    setUser(null);
    setSaved([]);
  }

  async function saveTeam() {
    const owner = user;
    const generation = sessionGeneration.current;
    if (!owner) return;

    setShowTeamValidationErrors(true);
    if (validateTeamDraft(team, catalog).length > 0 || invalidNumericSetsA.size > 0) return;

    try {
      const created = await api<SavedTeam>(
        "/me/teams",
        { method: "POST", body: JSON.stringify(submittedTeam(team)) },
        savedTeamResponseSchema
      );

      if (generation === sessionGeneration.current && user?.id === owner.id) {
        setSaved((current) => [created, ...current.filter((entry) => entry.id !== created.id)]);
        setNotice({ kind: "message", id: "teamSaved" });
      }
    } catch (error) {
      if (generation === sessionGeneration.current) setNotice({ kind: "error", error });
    }
  }

  async function removeSavedTeam(id: string) {
    const owner = user;
    const generation = sessionGeneration.current;
    if (!owner) return;

    try {
      await api(`/me/teams/${id}`, { method: "DELETE" });
      if (generation === sessionGeneration.current && user?.id === owner.id) {
        setSaved((current) => current.filter((entry) => entry.id !== id));
      }
    } catch (error) {
      if (generation === sessionGeneration.current) setNotice({ kind: "error", error });
    }
  }

  function handleSavedTeamOpen(savedTeam: SavedTeam) {
    setTeam(teamInputSchema.parse(savedTeam));
  }

  function handleTeamChange(nextTeam: TeamDraft) {
    setTeam(nextTeam);
    setShowTeamValidationErrors(false);
  }

  function handleDamageTransfer(pair: Omit<DamageTransfer, "id">) {
    const id = `damage-transfer-${++damageTransferSequence.current}`;
    setDamageTransfer({
      id,
      attacker: copyPokemonSet(pair.attacker),
      defender: copyPokemonSet(pair.defender),
      move: pair.move
    });
    navigate(siteTabPaths.damage);
  }

  function handleDamageTransferConsumed(id: string) {
    setDamageTransfer((current) => current?.id === id ? undefined : current);
  }

  function handleNoticeDismiss() {
    setNotice(null);
  }

  return (
    <div className="site-shell">
      <SiteHeader
        tab={tab}
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        locale={locale}
        onToggleLocale={() => setLocale(locale === "en" ? "es-ES" : "en")}
      />

      <main>
        <div className="page-heading">
          <span className="eyebrow">{t.app.competitiveWorkspace}</span>
          <h1>{route.kind === "notFound" ? t.seo.notFoundHeading : tabLabels[tab ?? "overview"]}</h1>
          <p>{route.kind === "notFound" ? pageDescription : descriptions[tab ?? "overview"]}</p>
        </div>

        {notice && (
          <div className="notice" role="status">
            {formatUiNotice(notice, locale)}
            <button onClick={handleNoticeDismiss} aria-label={t.app.dismissNotice}>×</button>
          </div>
        )}

        {route.kind === "notFound" && <section className="panel route-not-found" role="status">
          <p>{t.seo.notFoundDescription}</p>
          <Link className="button button-outline button-sm" to={siteTabPaths.pokedex}>{t.seo.backToPokedex}</Link>
        </section>}

        {route.kind === "page" && tab === "overview" && <Overview />}
        {route.kind === "page" && tab === "typeChart" && (
          <TypeChart
            chart={chart}
            catalog={catalog}
            chartStatus={chartStatus}
            catalogStatus={catalogStatus}
          />
        )}
        {route.kind === "page" && tab === "pokedex" && <Pokedex catalog={catalog} selectedSpecies={route.species?.name ?? null} />}

        {route.kind === "page" && tab === "teamBuilder" && (
          <div className="builder-layout">
            <TeamEditor
              title={t.team.yourTeam}
              team={team}
              onChange={handleTeamChange}
              catalog={catalog}
              showValidationErrors={showTeamValidationErrors}
              onNumericSetValidityChange={(index, valid) => {
                setInvalidNumericSetsA((current) => updateInvalidIndexes(current, index, valid));
              }}
            />
            <TeamEditor
              title={t.team.comparisonTeam}
              team={comparison}
              onChange={setComparison}
              catalog={catalog}
              side="b"
              onNumericSetValidityChange={(index, valid) => {
                setInvalidNumericSetsB((current) => updateInvalidIndexes(current, index, valid));
              }}
            />
            <Compare
              left={team}
              right={comparison}
              catalog={catalog}
              chart={chart}
              catalogStatus={catalogStatus}
              chartStatus={chartStatus}
              invalidSetIndexesA={getInvalidSetIndexes(team, catalog, invalidNumericSetsA)}
              invalidSetIndexesB={getInvalidSetIndexes(comparison, catalog, invalidNumericSetsB)}
              onOpenDamage={handleDamageTransfer}
            />
            <PrivateTeamLibrary
              user={user}
              savedTeams={saved}
              onSave={saveTeam}
              onOpen={handleSavedTeamOpen}
              onRemove={removeSavedTeam}
            />
          </div>
        )}

        {route.kind === "page" && tab === "damage" && (
          <Damage
            key="damage"
            catalog={catalog}
            initialAttacker={team.pokemon[0]}
            initialDefender={comparison.pokemon[0]}
            transfer={damageTransfer}
            onTransferConsumed={handleDamageTransferConsumed}
          />
        )}
        {route.kind === "page" && tab === "account" && (
          <Account
            user={user}
            onDone={refreshSession}
            onSigningOut={clearPrivateLibrary}
            onNotice={setNotice}
          />
        )}
      </main>

      <footer>
        {formatMessage(t.app.footer, { calc: "@smogon/calc", pokedex: "PokéAPI" })}
      </footer>
      <CatalogDatalists catalog={catalog} />
    </div>
  );
}

type SiteHeaderProps = {
  tab: SiteTab | null;
  user: AccountUser | null;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  locale: "en" | "es-ES";
  onToggleLocale: () => void;
};

function SiteHeader({ tab, user, theme, onToggleTheme, locale, onToggleLocale }: SiteHeaderProps) {
  const tabLabels: Record<SiteTab, string> = t.tabs;
  return (
    <header className="site-header">
      <div className="brand">
        <span className="brand-mark">✦</span>
        <div>
          <strong>{t.app.title}</strong>
          <small>{t.app.brandSubtitle}</small>
        </div>
      </div>
      <nav aria-label={t.app.mainNavigation}>
        {tabs.map((item) => (
          <Link
            key={item}
            to={siteTabPaths[item]}
            className={tab === item ? "nav-active" : ""}
            aria-current={tab === item ? "page" : undefined}
          >
            {tabLabels[item]}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <div className="header-user" title={user?.name}>{user ? user.name : t.app.guestMode}</div>
        <button
          className="theme-toggle"
          type="button"
          role="switch"
          aria-label={t.app.darkTheme}
          aria-checked={theme === "dark"}
          onClick={onToggleTheme}
        >
          <span className="theme-toggle-thumb" aria-hidden="true">
            {theme === "dark"
              ? <Moon size={14} aria-hidden="true" />
              : <Sun size={14} aria-hidden="true" />}
          </span>
        </button>
        <button
          className="locale-toggle"
          type="button"
          role="switch"
          aria-label={locale === "en" ? t.app.switchToSpanish : t.app.switchToEnglish}
          title={locale === "en" ? t.app.switchToSpanish : t.app.switchToEnglish}
          aria-checked={locale === "es-ES"}
          onClick={onToggleLocale}
        >
          <span className="locale-toggle-thumb" aria-hidden="true">
            <img src={locale === "en" ? "/flags/es.svg" : "/flags/gb.svg"} alt="" />
          </span>
        </button>
      </div>
    </header>
  );
}

type PrivateTeamLibraryProps = {
  user: AccountUser | null;
  savedTeams: SavedTeam[];
  onSave: () => Promise<void>;
  onOpen: (team: SavedTeam) => void;
  onRemove: (id: string) => Promise<void>;
};

function PrivateTeamLibrary({ user, savedTeams, onSave, onOpen, onRemove }: PrivateTeamLibraryProps) {
  return (
    <div className="panel save-panel">
      <h3>{t.team.privateLibrary}</h3>
      <p>{t.team.saveDescription}</p>
      <Button disabled={!user} onClick={onSave}>{t.team.saveButton}</Button>
      {!user && (
        <Link className="text-link" to={siteTabPaths.account}>
          {t.team.signInOrCreate}
        </Link>
      )}
      {user && savedTeams.map((savedTeam) => (
        <div className="saved-row" key={savedTeam.id}>
          <button onClick={() => onOpen(savedTeam)}>{savedTeam.name}</button>
          <button
            aria-label={formatMessage(t.team.deleteTeam, { name: savedTeam.name })}
            onClick={() => void onRemove(savedTeam.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<StrictMode><LocaleProvider><App /></LocaleProvider></StrictMode>);

function updateInvalidIndexes(current: ReadonlySet<number>, index: number, valid: boolean): ReadonlySet<number> {
  const next = new Set(current);
  if (valid) next.delete(index);
  else next.add(index);
  return next;
}

function getInvalidSetIndexes(
  team: TeamDraft,
  catalog: CatalogResponse | null,
  transientIndexes: ReadonlySet<number>
): ReadonlySet<number> {
  const invalid = new Set(transientIndexes);
  validateTeamDraft(team, catalog).forEach((issue) => {
    const match = issue.field.match(/^(\d+)\./);
    if (match) invalid.add(Number(match[1]));
  });
  return invalid;
}
