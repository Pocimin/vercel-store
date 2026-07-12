import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, Wallet, Gamepad2, Upload, ExternalLink } from "lucide-react";
import { Nav, Footer } from "./index";
import { api, json, me, type User } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import qrisImage from "@/assets/qris.png";

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
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-4xl font-extrabold text-muted-foreground/50">{n}.</span>
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">{title}</h2>
      </div>
      <p className="mb-6 text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}

type Payment = "qris" | "paypal" | "robux";
type License = "weekly" | "monthly" | "joki";

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

function PurchasePage() {
  const { t } = useI18n();
  const [payment, setPayment] = useState<Payment>("qris");
  const [license, setLicense] = useState<License>("monthly");
  const [user, setUser] = useState<User | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selected = LICENSES.find((l) => l.id === license)!;

  useEffect(() => {
    me().then((result) => setUser(result.user)).catch(() => undefined);
  }, []);

  function readProof(file: File) {
    setProof(file);
    const reader = new FileReader();
    reader.onload = () => setProofBase64(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setStatus("");
    setError("");
    if (!user) {
      setError("Login or register before submitting payment.");
      return;
    }
    try {
      await json(await api("/purchase", {
        method: "POST",
        body: JSON.stringify({
          plan: t(selected.labelKey),
          method: payment.toUpperCase(),
          amount: selected.amount,
          currency: "IDR",
          proofFileName: proof?.name ?? "proof.png",
          proofBase64: proofBase64 || undefined,
        }),
      }));
      setStatus("Payment submitted. Admin approval will create and email your real license key.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment submission failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Step n={1} title={t("beforePurchase")} subtitle={t("beforePurchaseSub")}>
          <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
            <li className="text-foreground">{t("rule1")}</li>
            <li className="text-foreground">{t("rule2")}</li>
            <li className="text-foreground">{t("rule3")}</li>
          </ul>
        </Step>

        <Step n={2} title={t("pickPayment")} subtitle={t("pickPaymentSub")}>
          <div className="grid gap-4 sm:grid-cols-3">
            {([
              { id: "qris", icon: QrCode, label: t("qris"), desc: t("qrisDesc") },
              { id: "paypal", icon: Wallet, label: t("paypal"), desc: t("paypalDesc") },
              { id: "robux", icon: Gamepad2, label: t("robux"), desc: t("robuxDesc") },
            ] as const).map((p) => {
              const Icon = p.icon;
              const on = payment === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id as Payment)}
                  className={`rounded-xl border p-5 text-left transition ${
                    on ? "border-foreground bg-white/5" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <Icon className="mb-3 h-5 w-5 text-foreground" />
                  <div className="text-lg font-extrabold text-foreground">{p.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-[#0e0e0e] p-5">
            {payment === "qris" && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground">{t("scanQris")}</p>
                <img
                  src={qrisImage}
                  alt="QRIS payment code"
                  className="w-full max-w-xs rounded-lg border border-white/10 bg-white"
                />
              </div>
            )}
            {payment === "paypal" && (
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {t("paypalHeader")}
                </div>
                <a
                  href="mailto:reinard.omarr@gmail.com"
                  className="mt-1 block text-xl font-extrabold text-foreground underline"
                >
                  reinard.omarr@gmail.com
                </a>
                <p className="mt-3 text-sm text-[oklch(0.66_0.23_25)]">
                  ⚠ {t("paypalDisclaimer")}
                </p>
              </div>
            )}
            {payment === "robux" && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("robuxDesc")} - <span className="text-foreground">{t(selected.labelKey)}</span> ({selected.robux})
                </p>
                <a
                  href={selected.gamepass}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
                >
                  {t("buyGamepass")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        </Step>

        <Step n={3} title={t("pickLicense")} subtitle={t("pickLicenseSub")}>
          <div className="grid gap-4 sm:grid-cols-3">
            {LICENSES.map((l) => {
              const on = license === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLicense(l.id)}
                  className={`rounded-xl border p-5 text-left transition ${
                    on ? "border-foreground bg-white/5" : "border-white/10 hover:border-white/20"
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
        </Step>

        <Step n={4} title="Register first" subtitle="Create an account before you submit your payment proof so your license can be delivered securely.">
          {user ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-foreground">
              Signed in as <span className="font-bold">{user.displayName ?? user.email ?? user.username}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#141414] p-6">
              <p className="text-sm text-muted-foreground">Register or sign in before submitting your payment proof.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/register" className="rounded-full bg-[#f3efe7] px-5 py-3 text-sm font-bold text-[#111]">Register first</a>
                <a href="/login" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-foreground">Sign in</a>
              </div>
            </div>
          )}
          <div className="mt-5">
            <div className="text-sm font-semibold text-foreground">{t("uploadProof")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("uploadProofSub")}</p>
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
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && readProof(e.target.files[0])}
              />
            </label>
          </div>
        </Step>

        <Step n={5} title={t("almostReady")} subtitle={t("almostReadySub")}>
          <button
            type="button"
            disabled={!user}
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {t("agreeContinue")}
          </button>
          {status && <p className="mt-4 text-sm text-emerald-400">{status}</p>}
          {error && <p className="mt-4 text-sm text-[oklch(0.66_0.23_25)]">{error}</p>}
          <p className="mt-4 text-xs text-muted-foreground">
            {t("pickPayment")}: <span className="text-foreground">{t(payment === "qris" ? "qris" : payment === "paypal" ? "paypal" : "robux")}</span>{" · "}
            <span className="text-foreground">{t(selected.labelKey)}</span>{" · "}
            <span className="text-foreground">{selected.idr}</span>
          </p>
        </Step>
      </main>
      <Footer />
    </div>
  );
}

