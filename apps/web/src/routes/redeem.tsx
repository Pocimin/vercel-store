import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { Nav, Footer } from "./index";
import { useI18n } from "@/lib/i18n";
import { api, json } from "@/lib/api";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem - nznt's hub" },
      { name: "description", content: "Redeem your nznt's hub license key." },
    ],
  }),
  component: RedeemPage,
});

type Step = "key" | "account";

function RedeemPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const keyRef = useRef("");
  const [step, setStep] = useState<Step>("key");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function submitKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = String(new FormData(event.currentTarget).get("licenseKey") ?? "").trim();
    if (key.length < 10) {
      setError("Please enter the complete license key from your email.");
      return;
    }
    keyRef.current = key;
    setError("");
    setStep("account");
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    setBusy(true);
    setError("");
    try {
      await json(await api("/auth/redeem", {
        method: "POST",
        body: JSON.stringify({
          licenseKey: keyRef.current,
          email: value("email"),
          username: value("username"),
          password: value("password"),
        }),
      }));
      navigate({ to: "/dashboard" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not claim this license");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-24">
        {step === "key" ? (
          <>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"><KeyRound className="h-6 w-6 text-foreground" /></div>
            <h1 className="text-center text-4xl font-extrabold text-foreground">{t("redeemTitle")}</h1>
            <p className="mt-3 text-center text-muted-foreground">{t("redeemSub")}</p>
            <form onSubmit={submitKey} className="mt-10 w-full" noValidate>
              <label className="sr-only" htmlFor="redeem-key">License key</label>
              <input id="redeem-key" name="licenseKey" autoComplete="off" spellCheck={false} placeholder="NZNT-XXXXXX-XXXXXX-XXXXXX" className="w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-center font-mono text-sm font-semibold tracking-wide text-foreground outline-none focus:border-foreground" />
              {error && <p className="mt-4 text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" className="mt-8 inline-flex w-full justify-center rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111]">{t("activateLicense")}</button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"><UserPlus className="h-6 w-6 text-foreground" /></div>
            <h1 className="text-center text-4xl font-extrabold text-foreground">{t("createAccount")}</h1>
            <p className="mt-3 text-center text-muted-foreground">{t("createAccountSub")}</p>
            <form onSubmit={submitAccount} className="mt-10 w-full space-y-4" noValidate>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-email">Email<input id="redeem-email" name="email" type="email" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-username">{t("username")}<input id="redeem-username" name="username" autoComplete="off" spellCheck={false} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground" htmlFor="redeem-password">{t("password")}<input id="redeem-password" name="password" type="password" autoComplete="off" required className="mt-2 w-full rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-foreground outline-none focus:border-foreground" /></label>
              {error && <p className="text-center text-sm text-rose-400">{error}</p>}
              <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] disabled:opacity-70">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Please wait..." : t("createContinue")}</button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
