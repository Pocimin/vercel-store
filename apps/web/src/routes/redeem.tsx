import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Loader2, UserPlus } from "lucide-react";
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
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[oklch(0.74_0.19_47/0.3)] bg-[oklch(0.74_0.19_47/0.12)] shadow-[0_0_28px_-6px_oklch(0.74_0.19_47/0.5)]"><KeyRound className="h-6 w-6 text-[oklch(0.82_0.15_55)]" /></div>
            <h1 className="text-center text-4xl font-extrabold text-foreground">{t("redeemTitle")}</h1>
            <p className="mt-3 text-center text-muted-foreground">{t("redeemSub")}</p>
            <form onSubmit={submitKey} className="mt-10 w-full" noValidate>
              <label className="sr-only" htmlFor="redeem-key">{t("licenseKey")}</label>
              <input id="redeem-key" name="licenseKey" autoComplete="off" spellCheck={false} placeholder="NZNT-XXXXXX-XXXXXX-XXXXXX" className="w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-center font-mono text-sm font-semibold tracking-wide text-foreground outline-none focus:border-foreground" />
              {error && <p className="mt-4 text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={verifying} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] disabled:opacity-70">
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifying ? t("checking") : t("activateLicense")}
              </button>
            </form>

            {verified && !error && (
              <div className="mt-8 w-full rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">
                      {t("redeemKeyValid")}
                    </p>
                    <p className="mt-1 font-mono text-xs text-emerald-300/80">{verified}</p>
                    <button
                      type="button"
                      onClick={registerNow}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-6 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
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
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[oklch(0.74_0.19_47/0.3)] bg-[oklch(0.74_0.19_47/0.12)] shadow-[0_0_28px_-6px_oklch(0.74_0.19_47/0.5)]"><UserPlus className="h-6 w-6 text-[oklch(0.82_0.15_55)]" /></div>
            <h1 className="text-center text-4xl font-extrabold text-foreground">{t("createAccount")}</h1>
            <p className="mt-3 text-center text-muted-foreground">{t("createAccountSub")}</p>
            <form onSubmit={submitAccount} className="mt-10 w-full space-y-4" noValidate>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-email">{t("authEmailLabel")}<input id="redeem-email" name="email" type="email" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-username">{t("username")}<input id="redeem-username" name="username" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-password">{t("password")}<input id="redeem-password" name="password" type="password" autoComplete="off" required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              {turnstileSiteKey && <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />}
              {error && <p className="text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] disabled:opacity-70">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t("authBusy") : t("createContinue")}</button>
            </form>
          </>
        )}
        <Link to="/purchase" className="mt-8 text-sm text-muted-foreground transition hover:text-foreground">
          {t("redeemBuyNew")} →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
