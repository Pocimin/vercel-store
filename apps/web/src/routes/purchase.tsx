import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ExternalLink, Gamepad2, QrCode, Upload, Wallet } from "lucide-react";
import { Nav, Footer } from "./index";
import { ApiError, api, json, me, turnstileSiteKey, type User } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { AuthPanel } from "@/components/AuthPanel";
import { Turnstile } from "@/components/Turnstile";

export const Route = createFileRoute("/purchase")({
  head: () => ({
    meta: [
      { title: "Purchase - nznt's hub" },
      { name: "description", content: "Purchase a license for nznt's hub Roblox script hub." },
    ],
  }),
  component: PurchasePage,
});

function Step({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative border-l border-dashed border-white/10 pl-8 pb-14">
      <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border border-[oklch(0.74_0.19_47/0.5)] bg-[oklch(0.74_0.19_47/0.18)] shadow-[0_0_16px_oklch(0.74_0.19_47/0.5)]" />
      <div className="mb-3 flex items-baseline gap-3">
        <span className="brand-gradient text-4xl font-extrabold">{n}.</span>
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">{title}</h2>
      </div>
      <p className="mb-6 text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}

type License = "weekly" | "monthly" | "joki";
type Method = "qris" | "robux" | "paypal";
type Phase = "rules" | "license" | "method" | "qris-setup" | "qris-wait" | "manual-setup" | "manual-wait" | "paid" | "expired";

const PROOF_TYPES = /^image\/(png|jpeg|webp)$/i;
const PROOF_MAX_BYTES = 2.5 * 1024 * 1024;
const PAYMENT_POLL_MS = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LICENSES: {
  id: License;
  labelKey: "weekly" | "monthly" | "jokiPlan";
  idr: string;
  amount: number;
  usd: string;
  robux: string;
  gamepass: string;
}[] = [
  { id: "weekly", labelKey: "weekly", idr: "Rp 10.000", amount: 10000, usd: "$1", robux: "100 R$", gamepass: "https://www.roblox.com/game-pass/884003202/weekly" },
  { id: "monthly", labelKey: "monthly", idr: "Rp 30.000", amount: 30000, usd: "$3", robux: "400 R$", gamepass: "https://www.roblox.com/game-pass/926034524/Monthly" },
  { id: "joki", labelKey: "jokiPlan", idr: "Rp 100.000", amount: 100000, usd: "$7", robux: "800 R$", gamepass: "https://www.roblox.com/game-pass/1875334228/Joki-Plan" },
];

const PAYPAL_EMAIL = "reinard.omarr@gmail.com";

const METHODS: { id: Method; icon: React.ComponentType<{ className?: string }>; labelKey: "qris" | "paypal" | "robux"; descKey: "qrisDesc" | "paypalDesc" | "robuxDesc"; badgeKey: "instantBadge" | "manualBadge"; instant: boolean }[] = [
  { id: "qris", icon: QrCode, labelKey: "qris", descKey: "qrisDesc", badgeKey: "instantBadge", instant: true },
  { id: "paypal", icon: Wallet, labelKey: "paypal", descKey: "paypalDesc", badgeKey: "manualBadge", instant: false },
  { id: "robux", icon: Gamepad2, labelKey: "robux", descKey: "robuxDesc", badgeKey: "manualBadge", instant: false },
];

function proofValidationError(file: File, t: (k: string) => string): string {
  const looksSupported = PROOF_TYPES.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!looksSupported) return t("errProofType");
  if (file.size > PROOF_MAX_BYTES) return t("errProofSize");
  return "";
}

function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

type QrisOrder = { paymentId: string; qrUrl: string; orderSn: string; expiresAt: string | null };

function PurchasePage() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("rules");
  const [license, setLicense] = useState<License>("monthly");
  const [method, setMethod] = useState<Method>("qris");
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState("");
  const [proofError, setProofError] = useState("");
  const [order, setOrder] = useState<QrisOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(900);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const captchaToken = useRef("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);

  const selected = LICENSES.find((l) => l.id === license)!;
  const selectedMethod = METHODS.find((m) => m.id === method)!;
  const emailValue = user?.email ?? email;
  const emailReady = Boolean(emailValue) && EMAIL_RE.test(emailValue);
  const proofReady = Boolean(proof && proofBase64 && !proofError);
  const captchaReady = !turnstileSiteKey || Boolean(captchaToken.current);
  const qrisReady = emailReady && captchaReady && !submitting;
  const manualReady = Boolean(user) && proofReady && captchaReady && !submitting;

  useEffect(() => {
    me().then((result) => setUser(result.user)).catch(() => undefined);
  }, []);

  function goto(phase: Phase) {
    setError("");
    setEmailTouched(false);
    setProof(null);
    setProofBase64("");
    setProofError("");
    captchaToken.current = "";
    setCaptchaEpoch((epoch) => epoch + 1);
    setPhase(phase);
  }

  function readProof(file: File) {
    const problem = proofValidationError(file, t);
    if (problem) {
      setProofError(problem);
      setProof(null);
      setProofBase64("");
      return;
    }
    setProofError("");
    setProof(file);
    const reader = new FileReader();
    reader.onload = () => setProofBase64(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  function handleSubmitError(err: unknown) {
    const code = err instanceof ApiError ? err.code : "";
    switch (code) {
      case "INVALID_PLAN":
        setError(t("errInvalidPlan"));
        break;
      case "INVALID_PROOF":
        setError(t("errInvalidProof"));
        break;
      case "PROOF_TOO_LARGE":
        setError(t("errProofTooLarge"));
        break;
      case "PAYMENT_ALREADY_SUBMITTED":
        setError(t("errAlreadySubmitted"));
        break;
      case "CAPTCHA_REQUIRED":
        setError(t("errCaptchaRequired"));
        break;
      case "EMAIL_REQUIRED":
        setError(t("errEmailRequired"));
        break;
      case "QRIS_CREATE_FAILED":
        setError(t("errQrisFailed"));
        break;
      default:
        setError(err instanceof Error && err.message ? err.message : t("errSubmitFailed"));
    }
  }

  async function submitQris(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || phase !== "qris-setup") return;
    setError("");
    if (!emailReady) {
      setError(t("errEmailInvalid"));
      return;
    }
    if (!captchaReady) {
      setError(t("errCaptchaRequired"));
      return;
    }
    setSubmitting(true);
    const sentToken = captchaToken.current;
    try {
      const result = await json<{ paymentId: string; qrUrl: string; orderSn: string; expiresAt: string | null; mode: string }>(await api("/purchase", {
        method: "POST",
        body: JSON.stringify({
          plan: license,
          method: "qris",
          email: user?.email ?? emailValue,
          turnstileToken: sentToken || undefined,
        }),
      }));
      if (!result.qrUrl) {
        setSubmitting(false);
        setError(t("errQrisFailed"));
        return;
      }
      setSubmitting(false);
      setOrder({
        paymentId: result.paymentId,
        qrUrl: result.qrUrl,
        orderSn: result.orderSn,
        expiresAt: result.expiresAt,
      });
      setPaymentStatus("PENDING");
      setRemaining(result.expiresAt ? Math.max(0, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)) : 900);
      setPhase("qris-wait");
      captchaToken.current = "";
      setCaptchaEpoch((epoch) => epoch + 1);
    } catch (err) {
      setSubmitting(false);
      handleSubmitError(err);
      if (turnstileSiteKey && captchaToken.current) {
        captchaToken.current = "";
        setCaptchaEpoch((epoch) => epoch + 1);
      }
    }
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || phase !== "manual-setup") return;
    setError("");
    if (!user) {
      setError(t("registerBeforeProof"));
      return;
    }
    if (!proofReady) {
      setError(t("errSelectProof"));
      return;
    }
    if (!captchaReady) {
      setError(t("errCaptchaRequired"));
      return;
    }
    setSubmitting(true);
    const sentToken = captchaToken.current;
    try {
      const result = await json<{ paymentId: string; mode: string }>(await api("/purchase", {
        method: "POST",
        body: JSON.stringify({
          plan: license,
          method,
          proofFileName: proof?.name ?? "proof.png",
          proofBase64,
          turnstileToken: sentToken || undefined,
        }),
      }));
      if (!result.paymentId) {
        setSubmitting(false);
        setError(t("errSubmitFailed"));
        return;
      }
      setSubmitting(false);
      setPhase("manual-wait");
      captchaToken.current = "";
      setCaptchaEpoch((epoch) => epoch + 1);
    } catch (err) {
      setSubmitting(false);
      handleSubmitError(err);
      if (turnstileSiteKey && captchaToken.current) {
        captchaToken.current = "";
        setCaptchaEpoch((epoch) => epoch + 1);
      }
    }
  }

  useEffect(() => {
    if (phase !== "qris-wait" || !order) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const result = await json<{ status: string }>(await api(`/payment/status/${order.paymentId}`));
        if (cancelled) return;
        setPaymentStatus(result.status);
        if (result.status === "PAID") {
          setPhase("paid");
        } else if (result.status === "EXPIRED") {
          setPhase("expired");
        }
      } catch {
        // transient poll failure — keep waiting
      }
    };
    const timer = window.setInterval(poll, PAYMENT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase, order]);

  useEffect(() => {
    if (phase !== "qris-wait") return;
    const tick = () => {
      if (order?.expiresAt) {
        setRemaining(Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)));
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [phase, order]);

  function reset() {
    captchaToken.current = "";
    setCaptchaEpoch((epoch) => epoch + 1);
    setOrder(null);
    setPaymentStatus(null);
    setRemaining(900);
    setError("");
    setPhase("method");
  }

  if (phase === "qris-wait" || phase === "paid" || phase === "expired") {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24">
          {phase === "qris-wait" && order && (
            <>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                {t("waitPayment")}
              </h1>
              <p className="mt-3 text-center text-muted-foreground">{t("qrisWaitSub")}</p>
              <p className="mt-5 text-sm font-semibold text-foreground">
                {t("payNow")} · <span className="brand-gradient">{selected.idr}</span>
              </p>
              <div className="mt-6 w-full max-w-sm">
                <img
                  src={order.qrUrl}
                  alt="QRIS payment code"
                  className="w-full rounded-2xl border border-white/10 bg-white p-4"
                />
              </div>
              <div className="mt-6 w-full max-w-sm space-y-2 rounded-xl border border-white/10 bg-[#141414] p-5 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("orderSn")}</span>
                  <span className="font-mono text-foreground">{order.orderSn}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("planRow")}</span>
                  <span className="text-foreground">{t(selected.labelKey)} · {selected.idr}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("qrExpiresIn")}</span>
                  <span className={`font-mono text-foreground ${remaining <= 60 ? "text-[oklch(0.66_0.23_25)]" : ""}`}>
                    {formatCountdown(remaining)}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                </span>
                {t("waitPayment")} ({paymentStatus ?? "PENDING"})
              </div>
            </>
          )}

          {phase === "paid" && (
            <>
              <div className="mb-6 text-6xl">🎉</div>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                {t("paidTitle")}
              </h1>
              <p className="mt-4 max-w-md text-center text-muted-foreground">
                {t("checkYourEmail")}
              </p>
              <div className="mt-8 w-full max-w-sm rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 text-center">
                <p className="text-sm font-semibold text-emerald-200">
                  {t("keyActiveFor")}: {t(selected.labelKey)}
                </p>
              </div>
              <Link
                to="/redeem"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                {t("redeemNow")} →
              </Link>
            </>
          )}

          {phase === "expired" && (
            <>
              <div className="mb-6 text-6xl">⏳</div>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                {t("paymentExpired")}
              </h1>
              <p className="mt-4 max-w-md text-center text-muted-foreground">{t("paymentExpiredSub")}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                {t("tryAgain")} →
              </button>
            </>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  if (phase === "manual-wait") {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24">
          <div className="mb-6 text-6xl">📤</div>
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
            {t("waitForReview")}
          </h1>
          <p className="mt-4 max-w-md text-center text-muted-foreground">{t("waitForReviewSub")}</p>
          <p className="mt-8 text-sm text-muted-foreground">
            {t("planRow")}: <span className="text-foreground">{t(selected.labelKey)} · {selected.idr}</span>
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
          >
            {t("goDashboard")} →
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const stepTitle = "beforePurchase";

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        {phase === "rules" && (
          <Step n={1} title={t("beforePurchase")} subtitle={t("beforePurchaseSub")}>
            <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
              <li className="text-foreground">{t("rule1")}</li>
              <li className="text-foreground">{t("rule2")}</li>
              <li className="text-foreground">{t("rule3")}</li>
            </ul>
            <button
              type="button"
              onClick={() => goto("license")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
            >
              {t("next")} →
            </button>
          </Step>
        )}

        {phase === "license" && (
          <Step n={2} title={t("pickLicense")} subtitle={t("pickLicenseSub")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {LICENSES.map((l) => {
                const on = license === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLicense(l.id)}
                    className={`rounded-xl border p-5 text-left transition ${
                      on ? "border-[oklch(0.74_0.19_47/0.6)] bg-[oklch(0.74_0.19_47/0.1)] shadow-[0_14px_44px_-22px_oklch(0.74_0.19_47/0.55)]" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="text-lg font-extrabold text-foreground">{t(l.labelKey)}</div>
                    <div className="mt-3 space-y-0.5">
                      <div className="brand-gradient text-xl font-extrabold">{l.idr}</div>
                      <div className="text-xs text-muted-foreground">{l.usd} · {l.robux}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => goto("rules")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]"
              >
                <ArrowLeft className="h-4 w-4" /> {t("back")}
              </button>
              <button
                type="button"
                onClick={() => goto("method")}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                {t("next")} →
              </button>
            </div>
          </Step>
        )}

        {phase === "method" && (
          <Step n={3} title={t("pickPayment")} subtitle={t("pickPaymentSub")}>
            <div className="grid gap-4 sm:grid-cols-3">
              {METHODS.map((p) => {
                const Icon = p.icon;
                const on = method === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setMethod(p.id); setError(""); }}
                    className={`rounded-xl border p-5 text-left transition ${
                      on ? "border-[oklch(0.74_0.19_47/0.6)] bg-[oklch(0.74_0.19_47/0.1)] shadow-[0_14px_44px_-22px_oklch(0.74_0.19_47/0.55)]" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-foreground" />
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${p.instant ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}>
                        {p.instant ? t("instantBadge") : t("manualBadge")}
                      </span>
                    </div>
                    <div className="mt-3 text-lg font-extrabold text-foreground">{t(p.labelKey)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{t(p.descKey)}</p>
                  </button>
                );
              })}
            </div>

            {method === "qris" && (
              <div className="mt-6 flex gap-3 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
                <QrCode className="h-5 w-5 shrink-0 text-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("qrisNoAccount")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("qrisPayAfter")}: {t("scanQris")}</p>
                </div>
              </div>
            )}
            {method === "paypal" && (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
                <p className="text-sm font-semibold text-foreground">{t("onlyForManual")}</p>
                <a
                  href="mailto:reinard.omarr@gmail.com"
                  className="mt-4 block text-xl font-extrabold text-foreground underline"
                >
                  {PAYPAL_EMAIL}
                </a>
                <p className="mt-3 text-sm text-[oklch(0.66_0.23_25)]">
                  ⚠️ {t("paypalDisclaimer")}
                </p>
              </div>
            )}
            {method === "robux" && (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("buyGamepass")}</div>
                <a
                  href={selected.gamepass}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
                >
                  {t("buyGamepass")} · {selected.robux} <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-3 text-xs text-muted-foreground">{t("robuxDesc")}</p>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => goto("license")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]"
              >
                <ArrowLeft className="h-4 w-4" /> {t("back")}
              </button>
              <button
                type="button"
                onClick={() => goto(method === "qris" ? "qris-setup" : "manual-setup")}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                {t("next")} →
              </button>
            </div>
          </Step>
        )}

        {phase === "qris-setup" && (
          <Step n={4} title={t("qris")} subtitle={t("qrisDesc")}>
            <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
              <p className="text-sm font-semibold text-foreground">✅ {t("qrisPayAfter")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("qrisPayAfterSub")}</p>
            </div>

            <form onSubmit={submitQris} className="mt-6 space-y-6" noValidate>
              <div>
                <label htmlFor="qris-email" className="block text-sm font-semibold text-foreground">
                  {t("enterEmail")}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">{t("enterEmailSub")}</p>
                {user?.email ? (
                  <div className="mt-3 max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground">
                    {t("signedInAs")}{" "}
                    <span className="font-bold">{user.email}</span>
                    <p className="mt-1 text-xs text-muted-foreground">{t("emailPrefilled")}</p>
                  </div>
                ) : (
                  <input
                    id="qris-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value.trim()); setEmailTouched(true); }}
                    placeholder="name@example.com"
                    className="mt-3 w-full max-w-sm rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-sm text-foreground outline-none focus:border-foreground"
                  />
                )}
                {!user?.email && emailTouched && !emailReady && (
                  <p className="mt-2 text-xs text-[oklch(0.66_0.23_25)]">{t("errEmailInvalid")}</p>
                )}
              </div>

              {turnstileSiteKey && (
                <div>
                  <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />
                  {!captchaReady && (
                    <p className="mt-3 text-xs text-muted-foreground">{t("errCaptchaRequired")}</p>
                  )}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goto("method")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={!qrisReady}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? t("submitting") : t("agreeContinue")}
                </button>
              </div>
            </form>
          </Step>
        )}

        {phase === "manual-setup" && (
          <Step
            n={4}
            title={method === "paypal" ? t("paypal") : t("payWithGamepass")}
            subtitle={method === "paypal" ? t("paypalDesc") : t("gamepassNote")}
          >
            {method === "paypal" && (
              <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("paypalHeader")}</div>
                <a href="mailto:reinard.omarr@gmail.com" className="mt-1 block text-xl font-extrabold text-foreground underline">
                  {PAYPAL_EMAIL}
                </a>
                <p className="mt-3 text-sm text-[oklch(0.66_0.23_25)]">⚠️ {t("paypalDisclaimer")}</p>
              </div>
            )}
            {method === "robux" && (
              <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t(selected.labelKey)} · {selected.robux}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{t("payWithGamepass")}</p>
                  </div>
                  <a
                    href={selected.gamepass}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
                  >
                    {t("buyGamepass")} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
              <div className="text-sm font-semibold text-foreground">{t("manualGateTitle")}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t("manualGateSub")}</p>
              {user ? (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground">
                  {t("signedInAs")} <span className="font-bold">{user.displayName ?? user.email ?? user.username}</span>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="mb-3 text-xs font-semibold text-foreground">{t("registerBeforeProof")}</p>
                  <AuthPanel onDone={(nextUser) => setUser(nextUser)} />
                </div>
              )}
            </div>

            <form onSubmit={submitManual} className="mt-6 space-y-6">
              <div>
                <div className="text-sm font-semibold text-foreground">{t("uploadProof")}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("uploadProofSub")} {t("proofMaxHint")}.
                </p>
                <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 transition hover:border-white/30">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {proof ? proof.name : t("noFile")}
                  </span>
                  <span className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-foreground">
                    {t("chooseFile")}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) readProof(file);
                    }}
                  />
                </label>
                {proofError && <p className="mt-2 text-xs font-semibold text-[oklch(0.66_0.23_25)]" role="alert">{proofError}</p>}
              </div>

              {turnstileSiteKey && (
                <div>
                  <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />
                  {!captchaReady && (
                    <p className="mt-3 text-xs text-muted-foreground">{t("errCaptchaRequired")}</p>
                  )}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goto("method")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={!manualReady}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? t("submitting") : t("agreeContinue")}
                </button>
              </div>
            </form>
          </Step>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          {t("pickPayment")}{": "}
          <span className="text-foreground">{t(selectedMethod.labelKey)}</span>{" · "}
          <span className="text-foreground">{t(selected.labelKey)}</span>{" · "}
          <span className="text-foreground">{selected.idr}</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
