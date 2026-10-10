import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  catalogResponseSchema,
  proTeamsResponseSchema,
  savedTeamResponseSchema,
  savedTeamsResponseSchema,
  teamInputSchema,
  type CatalogResponse,
  type ProTeamsResponse,
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
import { ProTeams } from "./features/pro-teams/ProTeams";
import { TypeChart } from "./features/type-chart/TypeChart";
import { formatMessage, t, locale } from "./i18n/presentation";
import { formatUiError } from "./lib/errors";
import { api } from "./lib/api";
import { loadTeamDraft, saveTeamDraft } from "./lib/team-drafts";
import { submittedTeam } from "./features/teams/team-model";
import { CatalogDatalists } from "./components/catalog-datalists";
import "./style.css";

type SavedTeam = SavedTeamResponse;
type Tab = "overview" | "typeChart" | "pokedex" | "teamBuilder" | "damage" | "proTeams" | "account";

const tabs: Tab[] = ["overview", "typeChart", "pokedex", "teamBuilder", "damage", "proTeams", "account"];
const emptyTeam = (): TeamInput => teamInputSchema.parse({ name: t.team.defaultName, pokemon: [] });
const tabLabels: Record<Tab, string> = t.tabs;
const descriptions: Record<Tab, string> = t.descriptions;

export function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [chart, setChart] = useState<TypeChartResponse>([]);
  const [proTeams, setProTeams] = useState<ProTeamsResponse>([]);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [saved, setSaved] = useState<SavedTeam[]>([]);
  const [notice, setNotice] = useState("");
  const [team, setTeam] = useState<TeamDraft>(() => loadTeamDraft("team", emptyTeam()));
  const [comparison, setComparison] = useState<TeamDraft>(() => loadTeamDraft("comparison", emptyTeam()));
  const sessionGeneration = useRef(0);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.app.title;
  }, []);

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
      .then(setCatalog)
      .catch(() => setNotice(t.notices.catalogUnavailable));
    void api<TypeChartResponse>("/type-chart", undefined, typeChartResponseSchema)
      .then(setChart)
      .catch(() => setNotice(t.notices.typeChartUnavailable));
    void api<ProTeamsResponse>("/pro-teams", undefined, proTeamsResponseSchema)
      .then(setProTeams)
      .catch(() => setNotice(t.notices.proTeamsUnavailable));
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!saveTeamDraft("team", team)) setNotice(t.notices.teamStorageUnavailable);
  }, [team]);

  useEffect(() => {
    if (!saveTeamDraft("comparison", comparison)) {
      setNotice(t.notices.comparisonStorageUnavailable);
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

    try {
      const created = await api<SavedTeam>(
        "/me/teams",
        { method: "POST", body: JSON.stringify(submittedTeam(team)) },
        savedTeamResponseSchema
      );

      if (generation === sessionGeneration.current && user?.id === owner.id) {
        setSaved((current) => [created, ...current.filter((entry) => entry.id !== created.id)]);
        setNotice(t.notices.teamSaved);
      }
    } catch (error) {
      if (generation === sessionGeneration.current) setNotice(formatUiError(error));
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
      if (generation === sessionGeneration.current) setNotice(formatUiError(error));
    }
  }

  function handleNavigation(destination: Tab) {
    setTab(destination);
    setNotice("");
  }

  function handleSavedTeamOpen(savedTeam: SavedTeam) {
    setTeam(teamInputSchema.parse(savedTeam));
  }

  function handleAccountNavigation() {
    setTab("account");
  }

  function handleNoticeDismiss() {
    setNotice("");
  }

  return (
    <div className="site-shell">
      <SiteHeader
        tab={tab}
        user={user}
        onNavigate={handleNavigation}
      />

      <main>
        <div className="page-heading">
          <span className="eyebrow">{t.app.competitiveWorkspace}</span>
          <h1>{tabLabels[tab]}</h1>
          <p>{descriptions[tab]}</p>
        </div>

        {notice && (
          <div className="notice" role="status">
            {notice}
            <button onClick={handleNoticeDismiss} aria-label={t.app.dismissNotice}>×</button>
          </div>
        )}

        {tab === "overview" && <Overview goTo={setTab} />}
        {tab === "typeChart" && <TypeChart chart={chart} types={catalog?.types ?? []} />}
        {tab === "pokedex" && <Pokedex catalog={catalog} />}

        {tab === "teamBuilder" && (
          <div className="builder-layout">
            <TeamEditor
              title={t.team.yourTeam}
              team={team}
              onChange={setTeam}
              catalog={catalog}
            />
            <div>
              <TeamEditor
                title={t.team.comparisonTeam}
                team={comparison}
                onChange={setComparison}
                catalog={catalog}
                compact
              />
              <Compare left={team} right={comparison} catalog={catalog} />
              <PrivateTeamLibrary
                user={user}
                savedTeams={saved}
                onSave={saveTeam}
                onSignIn={handleAccountNavigation}
                onOpen={handleSavedTeamOpen}
                onRemove={removeSavedTeam}
              />
            </div>
          </div>
        )}

        {tab === "damage" && (
          <Damage
            key="damage"
            catalog={catalog}
            initialAttacker={team.pokemon[0]}
            initialDefender={comparison.pokemon[0]}
          />
        )}
        {tab === "proTeams" && <ProTeams teams={proTeams} />}
        {tab === "account" && (
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
  tab: Tab;
  user: AccountUser | null;
  onNavigate: (destination: Tab) => void;
};

function SiteHeader({ tab, user, onNavigate }: SiteHeaderProps) {
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
          <button
            key={item}
            className={tab === item ? "nav-active" : ""}
            onClick={() => onNavigate(item)}
          >
            {tabLabels[item]}
          </button>
        ))}
      </nav>
      <div className="header-user">{user ? user.name : t.app.guestMode}</div>
    </header>
  );
}

type PrivateTeamLibraryProps = {
  user: AccountUser | null;
  savedTeams: SavedTeam[];
  onSave: () => Promise<void>;
  onSignIn: () => void;
  onOpen: (team: SavedTeam) => void;
  onRemove: (id: string) => Promise<void>;
};

function PrivateTeamLibrary({ user, savedTeams, onSave, onSignIn, onOpen, onRemove }: PrivateTeamLibraryProps) {
  return (
    <div className="panel save-panel">
      <h3>{t.team.privateLibrary}</h3>
      <p>{t.team.saveDescription}</p>
      <Button disabled={!user} onClick={onSave}>{t.team.saveButton}</Button>
      {!user && (
        <button className="text-link" onClick={onSignIn}>
          {t.team.signInOrCreate}
        </button>
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
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);
