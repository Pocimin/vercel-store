import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QrCode, Upload, Wallet } from "lucide-react";
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
type Method = "qris" | "manual";
type Phase = "form" | "qris-wait" | "manual-wait" | "paid" | "expired";

const PROOF_TYPES = /^image\/(png|jpeg|webp)$/i;
const PROOF_MAX_BYTES = 2.5 * 1024 * 1024;
const PAYMENT_POLL_MS = 3000;

const LICENSES: {
  id: License;
  labelKey: "weekly" | "monthly" | "jokiPlan";
  idr: string;
  usd: string;
  perks: string;
}[] = [
  { id: "weekly", labelKey: "weekly", idr: "Rp 10.000", usd: "$1", perks: "3 jam reset HWID · full access 7 hari" },
  { id: "monthly", labelKey: "monthly", idr: "Rp 30.000", usd: "$3", perks: "3 jam reset HWID · full access 30 hari" },
  { id: "joki", labelKey: "jokiPlan", idr: "Rp 100.000", usd: "$7", perks: "Tanpa reset HWID · 30 hari · server penjoki" },
];

const METHODS: { id: Method; label: string; sub: string; badge: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "qris", label: "QRIS", sub: "ShopeePay · GoPay · semua e-wallet Indonesia", badge: "OTOMATIS — verifikasi instan · AUTOMATIC — instant verification", icon: QrCode },
  { id: "manual", label: "Transfer Bank", sub: "BCA · BRI · DANA · OVO · manual check", badge: "MANUAL — review admin, bisa lama · MANUAL — admin review, may take time", icon: Wallet },
];

function proofValidationError(file: File): string {
  const looksSupported = PROOF_TYPES.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!looksSupported) return "Bukti harus PNG, JPEG, atau WebP · Proof must be a PNG, JPEG, or WebP image.";
  if (file.size > PROOF_MAX_BYTES) return "Bukti maksimal 2.5 MB · Proof image must be 2.5 MB or smaller.";
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
  const [method, setMethod] = useState<Method>("qris");
  const [license, setLicense] = useState<License>("monthly");
  const [user, setUser] = useState<User | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState("");
  const [proofError, setProofError] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [order, setOrder] = useState<QrisOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(900);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const captchaToken = useRef("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);

  const selected = LICENSES.find((l) => l.id === license)!;
  const proofReady = Boolean(proof && proofBase64 && !proofError);
  const captchaReady = !turnstileSiteKey || Boolean(captchaToken.current);
  const canSubmit = Boolean(user) && (method === "manual" ? proofReady : true) && captchaReady && !submitting;

  useEffect(() => {
    me().then((result) => setUser(result.user)).catch(() => undefined);
  }, []);

  function readProof(file: File) {
    const problem = proofValidationError(file);
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

  async function submit() {
    if (submitting || phase !== "form") return;
    setError("");
    if (!user) {
      setError("Login / daftar dulu sebelum membeli · Sign in or register before purchasing.");
      return;
    }
    if (!proofReady && method === "manual") {
      setError("Pilih bukti pembayaran yang valid dulu · Select a valid payment proof first.");
      return;
    }
    if (!captchaReady) {
      setError("Selesaikan captcha dulu · Complete the captcha first.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await json<{ paymentId: string; qrUrl: string; orderSn: string; expiresAt: string | null; mode: string }>(await api("/purchase", {
        method: "POST",
        body: JSON.stringify({
          plan: license,
          method,
          proofFileName: method === "manual" ? proof?.name : undefined,
          proofBase64: method === "manual" ? proofBase64 : undefined,
          turnstileToken: captchaToken.current || undefined,
        }),
      }));
      setSubmitting(false);
      if (result.mode === "qris") {
        setOrder({
          paymentId: result.paymentId,
          qrUrl: result.qrUrl,
          orderSn: result.orderSn,
          expiresAt: result.expiresAt,
        });
        setPaymentStatus("PENDING");
        setRemaining(result.expiresAt ? Math.max(0, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000)) : 900);
        setPhase("qris-wait");
      } else {
        setPhase("manual-wait");
      }
      captchaToken.current = "";
      setCaptchaEpoch((epoch) => epoch + 1);
    } catch (err) {
      setSubmitting(false);
      const code = err instanceof ApiError ? err.code : "";
      switch (code) {
        case "INVALID_PLAN":
          setError("Paket tidak tersedia · That plan is unavailable — refresh and pick again.");
          break;
        case "INVALID_PROOF":
          setError("Bukti tidak valid · Proof must be a real PNG, JPEG, or WebP image.");
          break;
        case "PROOF_TOO_LARGE":
          setError("Bukti terlalu besar · Proof image is too large (2.5 MB max).");
          break;
        case "PAYMENT_ALREADY_SUBMITTED":
          setError("Kamu sudah punya pembayaran menunggu · You already submitted a payment — wait for review.");
          break;
        default:
          setError(err instanceof Error ? err.message : "Payment submission failed"); 
      }
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
    setPhase("form");
    setOrder(null);
    setPaymentStatus(null);
    setRemaining(900);
    setError("");
    setProof(null);
    setProofBase64("");
    setProofError("");
    captchaToken.current = "";
    setCaptchaEpoch((epoch) => epoch + 1);
  }

  if (phase === "qris-wait" || phase === "paid" || phase === "expired") {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24">
          {phase === "qris-wait" && order && (
            <>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                Menunggu pembayaran · Waiting for payment
              </h1>
              <p className="mt-3 text-center text-muted-foreground">
                Scan QR di bawah dengan aplikasi bank/e-wallet, lalu bayar. Status cek otomatis tiap 3 detik.
                <br />
                Scan the QR below with your banking app. We check your payment automatically every 3 seconds.
              </p>
              <div className="mt-10 w-full max-w-sm">
                <img
                  src={order.qrUrl}
                  alt="QRIS payment code"
                  className="w-full rounded-2xl border border-white/10 bg-white p-4"
                />
              </div>
              <div className="mt-6 w-full max-w-sm space-y-2 rounded-xl border border-white/10 bg-[#141414] p-5 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Order / No. pesanan</span>
                  <span className="font-mono text-foreground">{order.orderSn}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Paket / Plan</span>
                  <span className="text-foreground">{t(selected.labelKey)} · {selected.idr}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Sisa waktu / Time left</span>
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
                Menunggu pembayaran · Waiting for payment ({paymentStatus ?? "PENDING"})
              </div>
            </>
          )}

          {phase === "paid" && (
            <>
              <div className="mb-6 text-6xl">🎉</div>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                Pembayaran diterima! · Payment received!
              </h1>
              <p className="mt-4 max-w-md text-center text-muted-foreground">
                Cek email kamu untuk license key kamu. · Check your email for your license key.
              </p>
              <div className="mt-8 w-full max-w-sm rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 text-center">
                <p className="text-sm font-semibold text-emerald-200">
                  Key aktif untuk: {t(selected.labelKey)} · Key active for: {t(selected.labelKey)}
                </p>
              </div>
              <Link
                to="/redeem"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                Tukar key sekarang · Redeem now →
              </Link>
            </>
          )}

          {phase === "expired" && (
            <>
              <div className="mb-6 text-6xl">⏳</div>
              <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
                Pembayaran kedaluwarsa · Payment expired
              </h1>
              <p className="mt-4 max-w-md text-center text-muted-foreground">
                QRIS kamu sudah kedaluwarsa — buat pembayaran baru untuk melanjutkan.
                <br />
                Your QRIS expired — create a new one to continue.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
              >
                Mulai lagi · Start again →
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
            Bukti sudah dikirim! · Proof submitted!
          </h1>
          <p className="mt-4 max-w-md text-center text-muted-foreground">
            Admin akan review secepatnya — biasanya beberapa menit sampai beberapa jam. Key lisensi akan dikirim ke email kamu setelah disetujui.
            <br />
            Admin will review shortly — typically minutes to hours. Your license key will be emailed once approved.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">
            Paket · Plan: <span className="text-foreground">{t(selected.labelKey)} · {selected.idr}</span>
          </p>
          <Link
            to="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
          >
            Ke dashboard · Go to dashboard →
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="mb-10 rounded-xl border border-white/10 bg-[#141414] p-6">
          <h2 className="text-lg font-extrabold text-foreground">Sebelum kamu beli · Before you purchase</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Yang kamu dapatkan setelah pembayaran terverifikasi · What you get once your payment is verified:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {LICENSES.map((l) => (
              <div key={l.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="brand-gradient text-base font-extrabold">{l.idr}</div>
                <div className="text-sm font-semibold text-foreground">{t(l.labelKey)}</div>
                <p className="mt-1 text-xs text-muted-foreground">{l.perks}</p>
              </div>
            ))}
          </div>
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li className="text-foreground">{t("rule1")}</li>
            <li className="text-foreground">{t("rule2")}</li>
            <li className="text-foreground">{t("rule3")}</li>
          </ul>
        </section>

        <Step n={1} title={t("pickLicense")} subtitle={t("pickLicenseSub")}>
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
                    <div className="text-xs text-muted-foreground">{l.usd}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={2} title="Bayar · Payment" subtitle="Pilih cara bayar · Choose your payment option.">
          <div className="grid gap-4 sm:grid-cols-2">
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
                    <Icon className="mb-3 h-5 w-5 text-foreground" />
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${p.id === "qris" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}>
                      {p.id === "qris" ? "AUTOMATIC · OTOMATIS" : "MANUAL"}
                    </span>
                  </div>
                  <div className="text-lg font-extrabold text-foreground">{p.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.sub}</p>
                  <p className={`mt-2 text-[11px] font-semibold ${p.id === "qris" ? "text-emerald-400" : "text-amber-300"}`}>{p.badge}</p>
                </button>
              );
            })}
          </div>

          {method === "qris" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
              <p className="text-sm font-semibold text-foreground">✔ Pembayaran via QRIS: kamu bayar SETELAH konfirmasi · You'll pay AFTER confirming.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Setelah klik "Setuju & Lanjut", kamu dapat QRIS + nomor pesanan, lalu bayar pada layar berikutnya.
                <br />
                After clicking "Agree & Continue" you'll get the QRIS + order number, then pay on the next screen.
              </p>
            </div>
          )}

          {method === "manual" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
              <div className="text-sm font-semibold text-foreground">{t("uploadProof")}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("uploadProofSub")} Maksimal 2.5 MB · Max 2.5 MB.
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
          )}
        </Step>

        <Step n={4} title="Captcha" subtitle="Jaga keamanan toko · Keeps our store safe.">
          {turnstileSiteKey ? (
            <div className="max-w-sm">
              <Turnstile key={captchaEpoch} onToken={(token) => { captchaToken.current = token; }} />
              {!captchaToken.current && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Selesaikan captcha dulu · Complete the captcha first.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Captcha aktif saat deploy produksi · Captcha is enabled on production builds.</p>
          )}
        </Step>

        <Step n={5} title={t("almostReady")} subtitle={t("almostReadySub")}>
          {user ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-foreground">
              Signed in as <span className="font-bold">{user.displayName ?? user.email ?? user.username}</span>
            </div>
          ) : (
            <AuthPanel initialMode="register" onDone={(nextUser) => setUser(nextUser)} />
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? "Mengirim… · Submitting…" : t("agreeContinue")}
          </button>
          {!user && <p className="mt-3 text-xs text-muted-foreground">Login / daftar dulu untuk lanjut · Sign in first to continue.</p>}
          {user && method === "manual" && !proofReady && <p className="mt-3 text-xs text-muted-foreground">Pilih bukti valid (PNG/JPEG/WebP, maks 2.5 MB) · Select a valid proof image to enable submission.</p>}
          {user && !captchaReady && <p className="mt-3 text-xs text-muted-foreground">Selesaikan captcha dulu · Complete the captcha first.</p>}
          {error && (
            <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200" role="alert">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {t("pickPayment")}: <span className="text-foreground">{method === "qris" ? "QRIS (ShopeePay)" : "Transfer Bank"}</span>{" · "}
            <span className="text-foreground">{t(selected.labelKey)}</span>{" · "}
            <span className="text-foreground">{selected.idr}</span>
          </p>
        </Step>
      </main>
      <Footer />
    </div>
  );
}
