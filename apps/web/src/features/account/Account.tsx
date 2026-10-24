import { useState, type FormEvent } from "react";
import type { SavedTeamResponse } from "@pokemon-tools/contracts";
import { Button } from "../../components/ui/button";
import { locale, t } from "../../i18n/presentation";
import { api } from "../../lib/api";
import type { UiNotice } from "../../lib/ui-notice.js";

export type AccountUser = { id: string; name: string; email: string; username?: string | null; createdAt?: string };
type AccountMode = "sign-in" | "sign-up";
type LibraryStatus = "loading" | "ready" | "error";

export type AccountProps = {
  user: AccountUser | null;
  savedTeams?: SavedTeamResponse[];
  libraryStatus?: LibraryStatus;
  onDone: () => Promise<AccountUser | null>;
  onSigningOut: () => void;
  onNotice: (notice: UiNotice) => void;
};

export function Account({ user, savedTeams = [], libraryStatus = "ready", onDone, onSigningOut, onNotice }: AccountProps) {
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [claimUsername, setClaimUsername] = useState("");
  const [claimingUsername, setClaimingUsername] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isSigningUp = mode === "sign-up";
    const usesEmail = login.includes("@");
    const endpoint = isSigningUp ? "/auth/sign-up/email" : usesEmail ? "/auth/sign-in/email" : "/auth/sign-in/username";
    const credentials = isSigningUp
      ? { name, username: username.trim().toLowerCase(), email: login.trim(), password }
      : usesEmail ? { email: login.trim(), password } : { username: login.trim().toLowerCase(), password };

    try {
      await api(endpoint, { method: "POST", body: JSON.stringify(credentials) });
      const refreshedUser = await onDone();
      onNotice(refreshedUser
        ? { kind: "message", id: isSigningUp ? "accountCreated" : "accountSignedIn" }
        : { kind: "message", id: "accountSessionUnavailable" });
    } catch (error) {
      onNotice({ kind: "error", error });
    }
  }

  async function handleClaimUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = claimUsername.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(normalized)) {
      onNotice({ kind: "message", id: "invalidUsername" });
      return;
    }
    setClaimingUsername(true);
    try {
      await api("/auth/update-user", { method: "POST", body: JSON.stringify({ username: normalized }) });
      await onDone();
      setClaimUsername("");
      onNotice({ kind: "message", id: "usernameUpdated" });
    } catch (error) {
      onNotice({ kind: "error", error });
    } finally {
      setClaimingUsername(false);
    }
  }

  async function handleSignOut() {
    onSigningOut();
    try {
      await api("/auth/sign-out", { method: "POST", body: "{}" });
      await onDone();
    } catch (error) {
      await onDone();
      onNotice({ kind: "error", error });
    }
  }

  return (
    <div className={`account-layout${user ? " account-layout-signed-in" : ""}`}>
      <div className={user ? "trainer-card" : "panel account-auth-panel"}>
        {user ? (
          <SignedInAccount
            user={user}
            savedTeamCount={savedTeams.length}
            libraryStatus={libraryStatus}
            claimUsername={claimUsername}
            onClaimUsernameChange={setClaimUsername}
            claimingUsername={claimingUsername}
            onClaimUsername={handleClaimUsername}
            onSignOut={handleSignOut}
          />
        ) : (
          <>
            {mode === "sign-up" ? <h2>{t.account.createAccountTitle}</h2> : <p className="account-auth-benefits">{t.account.accountBenefits}</p>}
            <AuthenticationForm
              mode={mode}
              name={name}
              username={username}
              login={login}
              password={password}
              onModeChange={setMode}
              onNameChange={setName}
              onUsernameChange={setUsername}
              onLoginChange={setLogin}
              onPasswordChange={setPassword}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>

    </div>
  );
}

function SignedInAccount({ user, savedTeamCount, libraryStatus, claimUsername, onClaimUsernameChange, claimingUsername, onClaimUsername, onSignOut }: {
  user: AccountUser;
  savedTeamCount: number;
  libraryStatus: LibraryStatus;
  claimUsername: string;
  onClaimUsernameChange: (username: string) => void;
  claimingUsername: boolean;
  onClaimUsername: (event: FormEvent<HTMLFormElement>) => void;
  onSignOut: () => Promise<void>;
}) {
  const memberSince = formatAccountDate(user.createdAt);

  return (
    <section className="trainer-card-content" aria-labelledby="trainer-card-title">
      <header className="trainer-card-header">
        <h2 id="trainer-card-title">{t.account.trainerCard}</h2>
        <img
          className="trainer-card-mark"
          src="https://assets.dittobase.com/items/scarlet-violet/quick-ball.png"
          alt=""
          aria-hidden="true"
        />
      </header>

      <dl className="trainer-card-details">
        <div className="trainer-card-detail trainer-card-username">
          <dt>{t.account.username}</dt>
          <dd>{user.username || t.account.usernameNotSet}</dd>
        </div>
        {libraryStatus !== "error" && (
          <div className="trainer-card-detail">
            <dt>{t.account.savedTeams}</dt>
            <dd>
              {libraryStatus === "loading" ? (
                <span role="status">{t.account.countLoading}</span>
              ) : savedTeamCount}
            </dd>
          </div>
        )}
        {memberSince && (
          <div className="trainer-card-detail">
            <dt>{t.account.memberSince}</dt>
            <dd><time dateTime={memberSince.dateTime}>{memberSince.label}</time></dd>
          </div>
        )}
      </dl>

      {!user.username && (
        <form className="trainer-card-username-form" onSubmit={onClaimUsername}>
          <label>
            {t.account.chooseUsername}
            <input required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]{3,30}" autoComplete="username" value={claimUsername} onChange={(event) => onClaimUsernameChange(event.target.value)} />
          </label>
          <p className="trainer-card-help">{t.account.usernameHelp}</p>
          <div className="trainer-card-form-actions">
            <Button type="submit" disabled={claimingUsername}>{t.account.claimUsername}</Button>
          </div>
        </form>
      )}

      <footer className="trainer-card-footer">
        <Button variant="outline" onClick={() => void onSignOut()}>{t.account.signOut}</Button>
      </footer>
    </section>
  );
}

function formatAccountDate(value?: string): { dateTime: string; label: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return {
    dateTime: date.toISOString(),
    label: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(date)
  };
}

type AuthenticationFormProps = {
  mode: AccountMode;
  name: string;
  username: string;
  login: string;
  password: string;
  onModeChange: (mode: AccountMode) => void;
  onNameChange: (name: string) => void;
  onUsernameChange: (username: string) => void;
  onLoginChange: (value: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AuthenticationForm({ mode, name, username, login, password, onModeChange, onNameChange, onUsernameChange, onLoginChange, onPasswordChange, onSubmit }: AuthenticationFormProps) {
  const isSigningUp = mode === "sign-up";

  return (
    <>
      <div className="mode-switch">
        <button type="button" className={mode === "sign-in" ? "selected" : ""} onClick={() => onModeChange("sign-in")}>{t.account.signIn}</button>
        <button type="button" className={isSigningUp ? "selected" : ""} onClick={() => onModeChange("sign-up")}>{t.account.createAccount}</button>
      </div>

      <form onSubmit={onSubmit}>
        {isSigningUp && <label>{t.account.name}<input required autoComplete="name" value={name} onChange={(event) => onNameChange(event.target.value)} /></label>}
        {isSigningUp && <label>{t.account.username}<input required minLength={3} maxLength={30} pattern="[A-Za-z0-9_.]{3,30}" autoComplete="username" value={username} onChange={(event) => onUsernameChange(event.target.value)} /></label>}
        {isSigningUp && <p className="field-help">{t.account.usernameHelp}</p>}
        <label>
          {isSigningUp ? t.account.email : t.account.usernameOrEmail}
          <input type={isSigningUp ? "email" : "text"} autoComplete={isSigningUp ? "email" : "username"} required value={login} onChange={(event) => onLoginChange(event.target.value)} />
        </label>
        <label>{t.account.password}<input type="password" minLength={8} required autoComplete={isSigningUp ? "new-password" : "current-password"} value={password} onChange={(event) => onPasswordChange(event.target.value)} /></label>
        <Button type="submit">{isSigningUp ? t.account.createAccount : t.account.signIn}</Button>
      </form>
    </>
  );
}
