import { useRef, useState, type FormEvent } from "react";
import { Turnstile } from "./Turnstile";
import { ApiError, api, apiUrl, json, turnstileSiteKey, type User } from "@/lib/api";
import { useI18n, authErrorKey } from "@/lib/i18n";

type AuthMode = "login" | "register";

export function AuthPanel({
  initialMode = "login",
  initialLicenseKey,
  licenseOptional = false,
  onDone
}: {
  initialMode?: AuthMode;
  initialLicenseKey?: string;
  licenseOptional?: boolean;
  onDone: (user: User) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);
  const captchaToken = useRef("");
  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const password = value("password");
    const licenseKey = value("licenseKey");

    if (registering && password !== value("confirmPassword")) {
      setError(t("errPasswordMismatch"));
      return;
    }
    if (registering && !licenseOptional && licenseKey.length < 8) {
      setError(t("errLicenseKeyShort"));
      return;
    }
    if (turnstileSiteKey && !captchaToken.current) {
      setError(t("errCaptchaSubmit"));
      return;
    }

    setBusy(true);
    setError("");
    const sentToken = captchaToken.current;
    try {
      const registerBody: Record<string, unknown> = {
        email: value("email"),
        username: value("username"),
        robloxUsername: value("robloxUsername") || undefined,
        password,
        turnstileToken: sentToken || undefined,
      };
      if (!licenseOptional) registerBody.licenseKey = licenseKey;
      const response = await api(registering ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(registering ? registerBody : {
          emailOrUsername: value("emailOrUsername"),
          password,
          totp: value("totp") || undefined,
          turnstileToken: sentToken || undefined
        })
      });
      const result = await json<{ user: User }>(response);
      onDone(result.user);
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : "";
      const key = authErrorKey(code);
      if (key) {
        setError(t(key));
      } else if (caught instanceof Error && caught.message) {
        setError(caught.message);
      } else {
        setError(t("authFailed"));
      }
      if (turnstileSiteKey && sentToken) {
        // Tokens are single-use; force a fresh widget for the next attempt.
        captchaToken.current = "";
        setCaptchaEpoch((epoch) => epoch + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    captchaToken.current = "";
    setCaptchaEpoch((epoch) => epoch + 1);
    setError("");
    setMode(registering ? "login" : "register");
  }

  return (
    <section className="auth-panel anim-scale-in anim-visible" aria-label={registering ? t("authCreateAccount") : t("authSignIn")}>
      <div className="auth-kicker">nznt's hub</div>
      <h1>{registering ? t("authCreateAccount") : t("authWelcomeBack")}</h1>
      <p>{registering ? t("authRegisterSub") : t("authLoginSub")}</p>
      {registering && licenseOptional && (
        <p className="auth-hint">{t("authRegisterNoKey")}</p>
      )}

      <form className="auth-form" onSubmit={submit}>
        {registering ? (
          <>
            <Field label={t("authEmailLabel")} name="email" type="email" autoComplete="email" required />
            <Field label={t("username")} name="username" autoComplete="username" minLength={3} maxLength={32} required />
            {!licenseOptional && <Field label={t("authLicenseKeyLabel")} name="licenseKey" autoComplete="off" spellCheck={false} minLength={8} maxLength={128} required defaultValue={initialLicenseKey} />}
            <Field label={t("authRobloxUsername")} name="robloxUsername" autoComplete="off" maxLength={64} />
          </>
        ) : (
          <Field label={t("authEmailOrUsername")} name="emailOrUsername" autoComplete="username" required />
        )}
        <Field label={t("password")} name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : 1} maxLength={128} required />
        {registering && <Field label={t("authConfirmPassword")} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />}
        {!registering && <Field label={t("authTotp")} name="totp" inputMode="numeric" autoComplete="one-time-code" />}
        {turnstileSiteKey && <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />}
        {error && <p className="auth-error anim-shake" role="alert" key={error}>{error}</p>}
        <button className="auth-submit anim-shimmer" type="submit" disabled={busy}>{busy ? t("authBusy") : registering ? t("authCreateAccount") : t("authSignIn")}</button>
      </form>

      <button className="auth-discord anim-shimmer" type="button" onClick={() => window.location.assign(`${apiUrl}/auth/discord/start`)}>
        {t("authDiscord")}
      </button>
      <button className="auth-switch" type="button" onClick={switchMode}>
        {registering ? t("authSwitchLogin") : t("authSwitchRegister")}
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
