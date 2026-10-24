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
  type TeamDraftSource,
  type TeamInput,
  type TypeChartResponse,
  typeChartResponseSchema
} from "@pokemon-tools/contracts";
import { Account, type AccountUser } from "./features/account/Account";
import { PrivateLibrary } from "./features/account/PrivateLibrary";
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
import { loadStoredTeamDraft, saveTeamDraft } from "./lib/team-drafts";
import { copyPokemonSet, submittedTeam, type DamageTransfer } from "./features/teams/team-model";
import { validateTeamDraft } from "./features/teams/set-validation";
import { CatalogDatalists } from "./components/catalog-datalists";
import { useTheme } from "./lib/use-theme";
import "./style.css";
import "./theme.css";

type SavedTeam = SavedTeamResponse;
const tabs: SiteTab[] = ["overview", "typeChart", "pokedex", "teamBuilder", "damage", "privateLibrary", "account"];
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
  const [libraryStatus, setLibraryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [libraryPendingCount, setLibraryPendingCount] = useState(0);
  const [notice, setNotice] = useState<UiNotice | null>(null);
  const [siteConfig, setSiteConfig] = useState<PublicSiteConfig | null>(null);
  const [initialTeamDraft] = useState(() => loadStoredTeamDraft("team", emptyTeam()));
  const [initialComparisonDraft] = useState(() => loadStoredTeamDraft("comparison", emptyTeam()));
  const [team, setTeam] = useState<TeamDraft>(initialTeamDraft.team);
  const [comparison, setComparison] = useState<TeamDraft>(initialComparisonDraft.team);
  const [draftSourceA, setDraftSourceA] = useState<TeamDraftSource | null>(initialTeamDraft.source);
  const [draftSourceB, setDraftSourceB] = useState<TeamDraftSource | null>(initialComparisonDraft.source);
  const [teamEditorRevisionA, setTeamEditorRevisionA] = useState(0);
  const [teamEditorRevisionB, setTeamEditorRevisionB] = useState(0);
  const [invalidNumericSetsA, setInvalidNumericSetsA] = useState<ReadonlySet<number>>(() => new Set());
  const [invalidNumericSetsB, setInvalidNumericSetsB] = useState<ReadonlySet<number>>(() => new Set());
  const [showTeamValidationErrorsA, setShowTeamValidationErrorsA] = useState(false);
  const [showTeamValidationErrorsB, setShowTeamValidationErrorsB] = useState(false);
  const [damageTransfer, setDamageTransfer] = useState<DamageTransfer | undefined>();
  const sessionGeneration = useRef(0);
  const damageTransferSequence = useRef(0);
  const authenticatedUserId = useRef<string | null>(null);
  const libraryQueue = useRef<Promise<unknown>>(Promise.resolve());
  const libraryBusy = libraryPendingCount > 0;

  function serializeLibraryOperation<T>(operation: () => Promise<T>): Promise<T> {
    setLibraryPendingCount((count) => count + 1);
    const result = libraryQueue.current.then(operation, operation);
    libraryQueue.current = result.then(() => undefined, () => undefined);
    return result.finally(() => setLibraryPendingCount((count) => Math.max(0, count - 1)));
  }

  const route = resolveSiteRoute(location.pathname, catalog);
  const tab = route.kind === "page" ? route.tab : null;
  const tabLabels: Record<SiteTab, string> = t.tabs;
  const descriptions: Record<SiteTab, string> = t.descriptions;
  const pageTabDescription = tab === "account" && user ? t.account.signedInDescription : descriptions[tab ?? "overview"];
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
    pageDescription = pageTabDescription;
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

  useEffect(() => {
    if (location.hash !== "#team-comparison" || tab !== "teamBuilder") return;
    const comparisonSection = document.getElementById("team-comparison");
    if (!comparisonSection) return;
    comparisonSection.focus({ preventScroll: true });
    comparisonSection.scrollIntoView?.({ block: "start" });
  }, [location.hash, location.pathname, tab]);

  const refreshSession = useCallback(async (): Promise<AccountUser | null> => {
    const generation = ++sessionGeneration.current;
    let currentUser: AccountUser | null;
    try {
      const result = await api<{ user?: AccountUser }>("/auth/get-session");
      if (generation !== sessionGeneration.current) return null;
      currentUser = result?.user ?? null;
    } catch {
      if (generation === sessionGeneration.current) {
        authenticatedUserId.current = null;
        setUser(null);
        setSaved([]);
        setDraftSourceA(null);
        setDraftSourceB(null);
        setLibraryStatus("ready");
      }
      return null;
    }

    const previousOwnerId = authenticatedUserId.current;
    if (previousOwnerId !== null && previousOwnerId !== (currentUser?.id ?? null)) {
      setSaved([]);
      setDraftSourceA(null);
      setDraftSourceB(null);
    }
    authenticatedUserId.current = currentUser?.id ?? null;
    setUser(currentUser);
    if (!currentUser) {
      setSaved([]);
      setDraftSourceA(null);
      setDraftSourceB(null);
      setLibraryStatus("ready");
      return null;
    }

    setLibraryStatus("loading");
    try {
      const teams = await serializeLibraryOperation(() => api<SavedTeam[]>("/me/teams", undefined, savedTeamsResponseSchema));
      if (generation === sessionGeneration.current) {
        setSaved(teams);
        setLibraryStatus("ready");
        setDraftSourceA((source) => source?.ownerId === currentUser.id && teams.some((entry) => entry.id === source.teamId) ? source : null);
        setDraftSourceB((source) => source?.ownerId === currentUser.id && teams.some((entry) => entry.id === source.teamId) ? source : null);
      }
    } catch {
      if (generation === sessionGeneration.current) setLibraryStatus("error");
    }
    return currentUser;
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
    if (!saveTeamDraft("team", team, draftSourceA)) setNotice({ kind: "message", id: "teamStorageUnavailable" });
  }, [team, draftSourceA]);

  useEffect(() => {
    if (!saveTeamDraft("comparison", comparison, draftSourceB)) {
      setNotice({ kind: "message", id: "comparisonStorageUnavailable" });
    }
  }, [comparison, draftSourceB]);

  function clearPrivateLibrary() {
    sessionGeneration.current++;
    authenticatedUserId.current = null;
    setUser(null);
    setSaved([]);
    setDraftSourceA(null);
    setDraftSourceB(null);
    setLibraryStatus("ready");
  }

  async function retryPrivateLibrary() {
    const owner = user;
    const generation = sessionGeneration.current;
    if (!owner) return;
    setLibraryStatus("loading");
    try {
      const teams = await serializeLibraryOperation(() => api<SavedTeam[]>("/me/teams", undefined, savedTeamsResponseSchema));
      if (generation !== sessionGeneration.current || authenticatedUserId.current !== owner.id) return;
      setSaved(teams);
      setLibraryStatus("ready");
      setDraftSourceA((source) => source?.ownerId === owner.id && teams.some((entry) => entry.id === source.teamId) ? source : null);
      setDraftSourceB((source) => source?.ownerId === owner.id && teams.some((entry) => entry.id === source.teamId) ? source : null);
    } catch {
      if (generation === sessionGeneration.current) setLibraryStatus("error");
    }
  }

  function setDraftForSide(side: "a" | "b", next: TeamDraft) {
    if (side === "a") setTeam(next);
    else setComparison(next);
  }

  function setSourceForSide(side: "a" | "b", source: TeamDraftSource | null) {
    if (side === "a") setDraftSourceA(source);
    else setDraftSourceB(source);
  }

  function setShowErrorsForSide(side: "a" | "b", show: boolean) {
    if (side === "a") setShowTeamValidationErrorsA(show);
    else setShowTeamValidationErrorsB(show);
  }

  function clearEditorTransientState(side: "a" | "b") {
    if (side === "a") {
      setInvalidNumericSetsA(new Set());
      setShowTeamValidationErrorsA(false);
      setTeamEditorRevisionA((revision) => revision + 1);
    } else {
      setInvalidNumericSetsB(new Set());
      setShowTeamValidationErrorsB(false);
      setTeamEditorRevisionB((revision) => revision + 1);
    }
  }

  function loadSavedTeamIntoSide(side: "a" | "b", id: string) {
    if (!user || libraryBusy || libraryStatus !== "ready") return;
    const savedTeam = saved.find((entry) => entry.id === id);
    if (!savedTeam) return;
    const copiedTeam = teamInputSchema.parse(savedTeam);
    setDraftForSide(side, { ...copiedTeam, pokemon: copiedTeam.pokemon.map(copyPokemonSet) });
    setSourceForSide(side, { ownerId: user.id, teamId: savedTeam.id });
    clearEditorTransientState(side);
  }

  async function saveDraft(side: "a" | "b", asCopy = false) {
    const owner = user;
    const generation = sessionGeneration.current;
    if (!owner || libraryStatus !== "ready" || libraryBusy) return;
    const draft = side === "a" ? team : comparison;
    const invalidNumericIndexes = side === "a" ? invalidNumericSetsA : invalidNumericSetsB;
    const source = side === "a" ? draftSourceA : draftSourceB;
    setShowErrorsForSide(side, true);
    if (validateTeamDraft(draft, catalog).length > 0 || invalidNumericIndexes.size > 0) return;

    const linkedTeamId = !asCopy && source?.ownerId === owner.id && saved.some((entry) => entry.id === source.teamId)
      ? source.teamId
      : null;
    if (!asCopy && source && !linkedTeamId) {
      setSourceForSide(side, null);
      setNotice({ kind: "message", id: "teamNotFound" });
      return;
    }

    const snapshot = submittedTeam(draft);
    try {
      const savedTeam = await serializeLibraryOperation(async () => {
        if (generation !== sessionGeneration.current || authenticatedUserId.current !== owner.id) return null;
        return api<SavedTeam>(linkedTeamId ? `/me/teams/${linkedTeamId}` : "/me/teams", {
          method: linkedTeamId ? "PUT" : "POST",
          body: JSON.stringify(snapshot)
        }, savedTeamResponseSchema);
      });
      if (!savedTeam || generation !== sessionGeneration.current || authenticatedUserId.current !== owner.id) return;
      setSaved((current) => [savedTeam, ...current.filter((entry) => entry.id !== savedTeam.id)]);
      setSourceForSide(side, { ownerId: owner.id, teamId: savedTeam.id });
      setNotice({ kind: "message", id: linkedTeamId ? "teamUpdated" : source && asCopy ? "teamCopied" : "teamSaved" });
    } catch (error) {
      if (generation !== sessionGeneration.current) return;
      if (linkedTeamId && typeof error === "object" && error !== null && "status" in error && error.status === 404) {
        setSourceForSide(side, null);
        setNotice({ kind: "message", id: "teamNotFound" });
      } else setNotice({ kind: "error", error });
    }
  }

  async function removeSavedTeam(id: string) {
    const owner = user;
    const generation = sessionGeneration.current;
    if (!owner) return;

    try {
      await serializeLibraryOperation(async () => {
        if (generation !== sessionGeneration.current || authenticatedUserId.current !== owner.id) return;
        await api(`/me/teams/${id}`, { method: "DELETE" });
      });
      if (generation === sessionGeneration.current && user?.id === owner.id) {
        setSaved((current) => current.filter((entry) => entry.id !== id));
        setDraftSourceA((source) => source?.teamId === id ? null : source);
        setDraftSourceB((source) => source?.teamId === id ? null : source);
      }
    } catch (error) {
      if (generation === sessionGeneration.current) setNotice({ kind: "error", error });
    }
  }

  function handleTeamChange(nextTeam: TeamDraft) {
    setTeam(nextTeam);
    setShowTeamValidationErrorsA(false);
  }

  function handleComparisonChange(nextTeam: TeamDraft) {
    setComparison(nextTeam);
    setShowTeamValidationErrorsB(false);
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
        {(route.kind === "notFound" || tab !== "overview") && (
          <div className="page-heading">
            <h1>{route.kind === "notFound" ? t.seo.notFoundHeading : tabLabels[tab ?? "overview"]}</h1>
            <p>{route.kind === "notFound" ? pageDescription : pageTabDescription}</p>
          </div>
        )}

        {notice && (
          <div className={`notice${notice.kind === "error" ? " notice-error" : ""}`} role={notice.kind === "error" ? "alert" : "status"}>
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
              key={`team-a-${teamEditorRevisionA}`}
              title={t.team.yourTeam}
              team={team}
              onChange={handleTeamChange}
              catalog={catalog}
              showValidationErrors={showTeamValidationErrorsA}
              userSignedIn={Boolean(user)}
              savedTeams={saved}
              libraryStatus={libraryStatus}
              libraryBusy={libraryBusy}
              sourceTeamId={draftSourceA?.teamId ?? null}
              sourceIsVerified={Boolean(user && draftSourceA?.ownerId === user.id && libraryStatus === "ready" && saved.some((entry) => entry.id === draftSourceA.teamId))}
              onLoadSavedTeam={(id) => loadSavedTeamIntoSide("a", id)}
              onSaveTeam={() => void saveDraft("a")}
              onSaveCopy={() => void saveDraft("a", true)}
              onRetryLibrary={() => void retryPrivateLibrary()}
              onNumericSetValidityChange={(index, valid) => {
                setInvalidNumericSetsA((current) => updateInvalidIndexes(current, index, valid));
              }}
            />
            <TeamEditor
              key={`team-b-${teamEditorRevisionB}`}
              title={t.team.comparisonTeam}
              team={comparison}
              onChange={handleComparisonChange}
              catalog={catalog}
              side="b"
              showValidationErrors={showTeamValidationErrorsB}
              userSignedIn={Boolean(user)}
              savedTeams={saved}
              libraryStatus={libraryStatus}
              libraryBusy={libraryBusy}
              sourceTeamId={draftSourceB?.teamId ?? null}
              sourceIsVerified={Boolean(user && draftSourceB?.ownerId === user.id && libraryStatus === "ready" && saved.some((entry) => entry.id === draftSourceB.teamId))}
              onLoadSavedTeam={(id) => loadSavedTeamIntoSide("b", id)}
              onSaveTeam={() => void saveDraft("b")}
              onSaveCopy={() => void saveDraft("b", true)}
              onRetryLibrary={() => void retryPrivateLibrary()}
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
            savedTeams={saved}
            libraryStatus={libraryStatus}
            onDone={refreshSession}
            onSigningOut={clearPrivateLibrary}
            onNotice={setNotice}
          />
        )}
        {route.kind === "page" && tab === "privateLibrary" && (
          <PrivateLibrary
            signedIn={Boolean(user)}
            savedTeams={saved}
            status={libraryStatus}
            busy={libraryBusy}
            onRetry={() => void retryPrivateLibrary()}
            onDeleteTeam={removeSavedTeam}
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
        <Link className="brand-home" to={siteTabPaths.overview} aria-label={t.app.title}>
          <img className="brand-mark" src="https://assets.dittobase.com/items/scarlet-violet/quick-ball.png" alt="" />
          <strong>{t.app.title}</strong>
        </Link>
      </div>
      <nav aria-label={t.app.mainNavigation}>
        {tabs.map((item) => (
          item === "privateLibrary" && !user ? (
            <span key={item} className="private-library-nav-item">
              <button
                type="button"
                className="nav-disabled"
                aria-disabled="true"
                aria-describedby="private-library-tooltip"
              >
                {tabLabels[item]}
              </button>
              <span id="private-library-tooltip" className="pokedex-ability-tooltip private-library-nav-tooltip" role="tooltip">
                {t.account.libraryRequiresAccount}
              </span>
            </span>
          ) : (
            <Link
              key={item}
              to={siteTabPaths[item]}
              className={tab === item ? "nav-active" : ""}
              aria-current={tab === item ? "page" : undefined}
            >
              {tabLabels[item]}
            </Link>
          )
        ))}
      </nav>
      <div className="header-actions">
        <div className="header-user" title={user?.username ?? t.account.usernameNotSet}>{user ? user.username || t.account.usernameNotSet : t.app.guestMode}</div>
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
