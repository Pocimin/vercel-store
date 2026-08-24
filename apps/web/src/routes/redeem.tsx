import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { Nav, Footer } from "./index";
import { useI18n, authErrorKey } from "@/lib/i18n";
import { ApiError, api, json, me, turnstileSiteKey, type User } from "@/lib/api";
import { Turnstile } from "@/components/Turnstile";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem - nznt's hub" },
      { name: "description", content: "Redeem your nznt's hub license key." },
    ],
  }),
  component: RedeemPage,
});

type Mode = "unverified" | "loggedin";
type Step = "key" | "account";

const REDEEM_PREFILL_KEY = "nznt_prefill_key";

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nz-key-gold" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe296" />
          <stop offset="0.48" stopColor="#f2a33c" />
          <stop offset="1" stopColor="#e2692f" />
        </linearGradient>
      </defs>
      <g stroke="url(#nz-key-gold)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <circle cx="15" cy="15" r="8.2" />
        <circle cx="15" cy="15" r="2.7" fill="url(#nz-key-gold)" stroke="none" />
        <path d="M21.2 21.2 L36.5 36.5" strokeWidth="2.9" />
        <path d="M32.2 32.2 L27.5 36.9" strokeWidth="2.4" />
        <path d="M36.4 36.4 L33 39.8" strokeWidth="2.4" />
      </g>
      <path d="M39 8.5 l2.1 3 3 2.1 -3 2.1 -2.1 3 -2.1 -3 -3 -2.1 3 -2.1 z" fill="url(#nz-key-gold)" opacity="0.95" />
    </svg>
  );
}

function RedeemPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("unverified");
  const [step, setStep] = useState<Step>("key");
  const keyRef = useRef("");
  const captchaToken = useRef("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    me()
      .then(({ user }: { user: User | null }) => {
        if (user) setMode("loggedin");
      })
      .catch(() => setMode("unverified"));
  }, []);

  async function submitKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = String(new FormData(event.currentTarget).get("licenseKey") ?? "").trim();
    if (key.length < 10) {
      setError(t("redeemKeyTooShort"));
      return;
    }
    setError("");

    if (mode === "loggedin") {
      keyRef.current = key;
      setVerified("");
      setStep("account");
      return;
    }

    setVerifying(true);
    try {
      const result = await json<{ valid: boolean; keyPreview: string; plan: string }>(await api("/auth/verify-key", {
        method: "POST",
        body: JSON.stringify({ licenseKey: key }),
      }));
      if (result.valid) {
        keyRef.current = key;
        setVerified(result.keyPreview || key);
        try {
          localStorage.setItem(REDEEM_PREFILL_KEY, key);
        } catch {}
      }
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : "";
      if (code === "LICENSE_CLAIMED") {
        setError(t("redeemKeyClaimed"));
      } else if (code === "BAD_LICENSE") {
        setError(t("redeemKeyInvalid"));
      } else {
        setError(caught instanceof Error && caught.message ? caught.message : t("redeemVerifyFailed"));
      }
    } finally {
      setVerifying(false);
    }
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (turnstileSiteKey && !captchaToken.current) {
      setError(t("errCaptchaSubmit"));
      return;
    }
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    setBusy(true);
    setError("");
    const sentToken = captchaToken.current;
    try {
      await json(await api("/auth/redeem", {
        method: "POST",
        body: JSON.stringify({
          licenseKey: keyRef.current,
          email: value("email"),
          username: value("username"),
          password: value("password"),
          turnstileToken: sentToken || undefined,
        }),
      }));
      try {
        localStorage.removeItem(REDEEM_PREFILL_KEY);
      } catch {}
      navigate({ to: "/dashboard" });
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : "";
      const key = authErrorKey(code);
      if (key) {
        setError(t(key));
      } else if (caught instanceof Error && caught.message) {
        setError(caught.message);
      } else {
        setError(t("redeemClaimFailed"));
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

  function registerNow() {
    const key = keyRef.current;
    navigate({ to: "/register", search: { key } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24">
        {step === "key" ? (
          <>
            <div className="anim-pop anim-visible mb-6">
              <div className="key-badge anim-float flex h-16 w-16 items-center justify-center">
                <KeyIcon className="key-glow h-9 w-9" />
              </div>
            </div>
            <h1 className="anim-fade-up anim-visible anim-delay-1 text-center text-4xl font-extrabold text-foreground">{t("redeemTitle")}</h1>
            <p className="anim-fade-up anim-visible anim-delay-2 mt-3 text-center text-muted-foreground">{t("redeemSub")}</p>
            <form onSubmit={submitKey} className="anim-fade-up anim-visible anim-delay-3 mt-10 w-full" noValidate>
              <label className="sr-only" htmlFor="redeem-key">{t("licenseKey")}</label>
              <input id="redeem-key" name="licenseKey" autoComplete="off" spellCheck={false} placeholder="NZNT-XXXXXX-XXXXXX-XXXXXX" className="w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-center font-mono text-sm font-semibold tracking-wide text-foreground outline-none focus:border-foreground" />
              {error && <p key={error} className="anim-shake mt-4 text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={verifying} className="anim-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] disabled:opacity-70">
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifying ? t("checking") : t("activateLicense")}
              </button>
            </form>

            {verified && !error && (
              <div className="anim-pop anim-visible mt-8 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="anim-wobble mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">
                      {t("redeemKeyValid")}
                    </p>
                    <p className="mt-1 font-mono text-xs text-emerald-300/80">{verified}</p>
                    <button
                      type="button"
                      onClick={registerNow}
                      className="anim-shimmer mt-4 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-6 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t("redeemRegisterNow")} →
                    </button>
                    <Link
                      to="/register"
                      search={{ key: keyRef.current }}
                      className="mt-3 block text-xs text-muted-foreground transition hover:text-foreground"
                    >
                      {t("createAccount")} →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="anim-pop anim-visible mb-6">
              <div className="key-badge anim-float flex h-16 w-16 items-center justify-center">
                <UserPlus className="key-glow h-7 w-7 text-[oklch(0.82_0.15_55)]" />
              </div>
            </div>
            <h1 className="anim-fade-up anim-visible anim-delay-1 text-center text-4xl font-extrabold text-foreground">{t("createAccount")}</h1>
            <p className="anim-fade-up anim-visible anim-delay-2 mt-3 text-center text-muted-foreground">{t("createAccountSub")}</p>
            <form onSubmit={submitAccount} className="anim-fade-up anim-visible anim-delay-3 mt-10 w-full space-y-4" noValidate>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-email">{t("authEmailLabel")}<input id="redeem-email" name="email" type="email" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-username">{t("username")}<input id="redeem-username" name="username" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-password">{t("password")}<input id="redeem-password" name="password" type="password" autoComplete="off" required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              {turnstileSiteKey && <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />}
              {error && <p key={error} className="anim-shake text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={busy} className="anim-shimmer inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] disabled:opacity-70">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t("authBusy") : t("createContinue")}</button>
            </form>
          </>
        )}
        <Link to="/purchase" className="anim-fade-up anim-visible anim-delay-4 mt-8 text-sm text-muted-foreground transition hover:text-foreground">
          {t("redeemBuyNew")} →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
