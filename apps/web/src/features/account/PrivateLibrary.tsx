import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import type { SavedTeamResponse } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { formatMessage, label, t } from "../../i18n/presentation";
import { siteTabPaths } from "../../lib/pokedex-routes";

type LibraryStatus = "loading" | "ready" | "error";

export type PrivateLibraryProps = {
  signedIn: boolean;
  savedTeams: SavedTeamResponse[];
  status: LibraryStatus;
  busy: boolean;
  onRetry: () => void;
  onDeleteTeam: (id: string) => Promise<void>;
};

export function PrivateLibrary({ signedIn, savedTeams, status, busy, onRetry, onDeleteTeam }: PrivateLibraryProps) {
  return (
    <section className="panel account-library" aria-label={t.account.privateLibrary}>
      {!signedIn ? (
        <div className="account-library-access">
          <p>{t.account.libraryRequiresAccount}</p>
          <Button asChild variant="outline"><Link to={siteTabPaths.account}>{t.account.libraryAccountAction}</Link></Button>
        </div>
      ) : (
        <>
          {status === "loading" && <p role="status">{t.account.libraryLoading}</p>}
          {status === "error" && <div role="alert"><p>{t.account.libraryFailed}</p><Button variant="outline" disabled={busy} onClick={onRetry}>{t.account.retryLibrary}</Button></div>}
          {status === "ready" && (savedTeams.length ? (
            <div className="account-library-table-wrap">
              <table className="account-library-table">
                <thead><tr><th scope="col">{t.account.teamName}</th><th scope="col">{t.account.pokemon}</th><th scope="col">{t.account.delete}</th></tr></thead>
                <tbody>
                  {savedTeams.map((team) => (
                    <tr key={team.id}>
                      <th scope="row">{team.name}</th>
                      <td>{team.pokemon.map((pokemon) => label("species", pokemon.species)).join(", ") || t.account.noPokemon}</td>
                      <td><Button className="delete-team-button" variant="ghost" size="sm" disabled={busy} aria-label={formatMessage(t.team.deleteTeam, { name: team.name })} title={formatMessage(t.team.deleteTeam, { name: team.name })} onClick={() => void onDeleteTeam(team.id)}><Trash2 size={17} aria-hidden="true" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p>{t.account.libraryEmpty}</p>)}
        </>
      )}
    </section>
  );
}
