import { useRef, useState, type FormEvent } from "react";
import { Turnstile } from "./Turnstile";
import { api, apiUrl, json, turnstileSiteKey, type User } from "@/lib/api";

type AuthMode = "login" | "register";

export function AuthPanel({
  initialMode = "login",
  onDone
}: {
  initialMode?: AuthMode;
  onDone: (user: User) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const captchaToken = useRef("");
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const password = value("password");

    if (registering && password !== value("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    if (turnstileSiteKey && !captchaToken.current) {
      setCaptchaVisible(true);
      setError("Complete the captcha, then submit again.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await api(registering ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(registering ? {
          email: value("email"),
          username: value("username"),
          robloxUsername: value("robloxUsername") || undefined,
          password,
          turnstileToken: captchaToken.current || undefined
        } : {
          emailOrUsername: value("emailOrUsername"),
          password,
          totp: value("totp") || undefined,
          turnstileToken: captchaToken.current || undefined
        })
      });
      const result = await json<{ user: User }>(response);
      onDone(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    captchaToken.current = "";
    setCaptchaVisible(false);
    setError("");
    setMode(registering ? "login" : "register");
  }

  return (
    <section className="auth-panel" aria-label={registering ? "Create account" : "Sign in"}>
      <div className="auth-kicker">nznt's hub</div>
      <h1>{registering ? "Create Account" : "Welcome Back"}</h1>
      <p>{registering ? "Register first, then access your scripts and dashboard." : "Sign in to access your license, scripts, and monitoring."}</p>

      <form className="auth-form" onSubmit={submit}>
        {registering ? (
          <>
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Username" name="username" autoComplete="username" minLength={3} maxLength={32} required />
            <Field label="Roblox username (optional)" name="robloxUsername" autoComplete="off" maxLength={64} />
          </>
        ) : (
          <Field label="Email or username" name="emailOrUsername" autoComplete="username" required />
        )}
        <Field label="Password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : 1} maxLength={128} required />
        {registering && <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />}
        {!registering && <Field label="2FA code (if enabled)" name="totp" inputMode="numeric" autoComplete="one-time-code" />}
        {turnstileSiteKey && captchaVisible && <Turnstile onToken={(token) => { captchaToken.current = token; }} />}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait..." : registering ? "Create Account" : "Sign In"}</button>
      </form>

      <button className="auth-discord" type="button" onClick={() => window.location.assign(`${apiUrl}/auth/discord/start`)}>
        Continue with Discord
      </button>
      <button className="auth-switch" type="button" onClick={switchMode}>
        {registering ? "Already have an account? Sign in" : "Need an account? Register"}
      </button>
    </section>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input {...props} className="auth-input" spellCheck={false} />
    </label>
  );
}
