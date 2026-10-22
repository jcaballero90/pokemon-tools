import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { formatMessage, t } from "../../i18n/presentation";
import { api } from "../../lib/api";
import type { UiNotice } from "../../lib/ui-notice.js";

export type AccountUser = { id: string; name: string; email: string };
type AccountMode = "sign-in" | "sign-up";

export type AccountProps = {
  user: AccountUser | null;
  onDone: () => Promise<AccountUser | null>;
  onSigningOut: () => void;
  onNotice: (notice: UiNotice) => void;
};

export function Account({ user, onDone, onSigningOut, onNotice }: AccountProps) {
  const [mode, setMode] = useState<AccountMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = mode === "sign-up"
      ? { name, email, password }
      : { email, password };

    try {
      await api(`/auth/${mode}/email`, {
        method: "POST",
        body: JSON.stringify(credentials)
      });

      const refreshedUser = await onDone();
      const successNotice: UiNotice = refreshedUser
        ? { kind: "message", id: mode === "sign-up" ? "accountCreated" : "accountSignedIn" }
        : { kind: "message", id: "accountSessionUnavailable" };
      onNotice(successNotice);
    } catch (error) {
      onNotice({ kind: "error", error });
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

  const accountTitle = getAccountTitle(user, mode);

  return (
    <div className="account-layout">
      <div className="panel">
        <span className="eyebrow">{t.account.privateTeams}</span>
        <h2>{accountTitle}</h2>
        {user ? (
          <SignedInAccount user={user} onSignOut={handleSignOut} />
        ) : (
          <AuthenticationForm
            mode={mode}
            name={name}
            email={email}
            password={password}
            onModeChange={setMode}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <aside className="panel account-aside">
        <h3>{t.account.whatAccountAdds}</h3>
        <p>{t.account.guestDraftsExplanation}</p>
      </aside>
    </div>
  );
}

function getAccountTitle(user: AccountUser | null, mode: AccountMode): string {
  if (user) return formatMessage(t.account.welcome, { name: user.name });
  if (mode === "sign-in") return t.account.welcomeBack;
  return t.account.createAccountTitle;
}

function SignedInAccount({ user, onSignOut }: {
  user: AccountUser;
  onSignOut: () => Promise<void>;
}) {
  return (
    <>
      <p>{formatMessage(t.account.signedInAs, { email: user.email })}</p>
      <Button variant="outline" onClick={() => void onSignOut()}>
        {t.account.signOut}
      </Button>
    </>
  );
}

type AuthenticationFormProps = {
  mode: AccountMode;
  name: string;
  email: string;
  password: string;
  onModeChange: (mode: AccountMode) => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AuthenticationForm({
  mode,
  name,
  email,
  password,
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: AuthenticationFormProps) {
  const isSigningUp = mode === "sign-up";

  return (
    <>
      <div className="mode-switch">
        <button
          className={mode === "sign-in" ? "selected" : ""}
          onClick={() => onModeChange("sign-in")}
        >
          {t.account.signIn}
        </button>
        <button
          className={isSigningUp ? "selected" : ""}
          onClick={() => onModeChange("sign-up")}
        >
          {t.account.createAccount}
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {isSigningUp && (
          <label>
            {t.account.name}
            <input required value={name} onChange={(event) => onNameChange(event.target.value)} />
          </label>
        )}
        <label>
          {t.account.email}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </label>
        <label>
          {t.account.password}
          <input
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </label>
        <Button type="submit">
          {isSigningUp ? t.account.createAccount : t.account.signIn}
        </Button>
      </form>
    </>
  );
}
