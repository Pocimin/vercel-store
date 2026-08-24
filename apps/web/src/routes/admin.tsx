import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, FileUp, Receipt, Shield, XCircle } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { api, apiUrl, formatDateTime, formatMoney, json, type MonitoringData, type PaymentRow } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - nznt's hub" },
      { name: "description", content: "Admin payment approvals and live monitoring." },
    ],
  }),
  component: AdminPage,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="anim-fade-up anim-visible rounded-xl border border-white/5 bg-[#141414] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value, delay = 0 }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; delay?: number }) {
  return (
    <div className="anim-fade-up anim-visible rounded-xl border border-white/5 bg-[#141414] p-5" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="anim-pulse mt-1 text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function sessionStats(value: unknown) {
  const payload = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const stats = payload.stats && typeof payload.stats === "object" && !Array.isArray(payload.stats) ? payload.stats as Record<string, unknown> : {};
  const get = (...keys: string[]) => keys.map((key) => stats[key] ?? payload[key]).find((item) => item !== undefined && item !== null && item !== "");
  const money = (value: unknown) => typeof value === "number" ? formatMoney(value) : String(value ?? "-");
  return {
    money: money(get("currentMoney", "money", "cash", "beli")),
    earned: money(get("earned", "sessionEarned", "earnings")),
    hourly: money(get("moneyPerHour", "moneyHour")),
    level: String(get("level", "lvl") ?? "-"),
    task: String(payload.currentTask ?? get("task", "waypoint") ?? "-")
  };
}

function AdminPage() {
  const { t } = useI18n();
  const [token, setToken] = useState(() => localStorage.getItem("nznt_admin_token") ?? "");
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const headers = useMemo<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    if (token) next.authorization = `Bearer ${token}`;
    return next;
  }, [token]);

  async function load() {
    if (token) localStorage.setItem("nznt_admin_token", token);
    const [monitoringData, paymentData] = await Promise.all([
      json<MonitoringData>(await api("/admin/monitoring", { headers })),
      json<{ payments: PaymentRow[] }>(await api("/admin/payments", { headers })),
    ]);
    setMonitoring(monitoringData);
    setPayments(paymentData.payments);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error && err.message ? err.message : t("adminLoginRequired")));
    if (!monitoring) return;
    const timer = window.setInterval(() => load().catch(() => undefined), 10_000);
    return () => window.clearInterval(timer);
  }, [token, Boolean(monitoring)]);

  async function approve(id: string) {
    setProcessingId(id);
    setError("");
    try {
      const result = await json<{ plainKey: string }>(await api(`/admin/payments/${id}/approve`, { method: "POST", headers }));
      setNotice(`${t("approvedNotice")} ${t("licenseCreated")}: ${result.plainKey}`);
      await load();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("approveFailed"));
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(id: string) {
    setProcessingId(id);
    setError("");
    try {
      await json(await api(`/admin/payments/${id}/reject`, { method: "POST", headers }));
      setNotice(t("rejectedNotice"));
      await load();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("rejectFailed"));
    } finally {
      setProcessingId(null);
    }
  }

  if (error && !monitoring) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-6 py-20">
        <AuthPanel onDone={() => void load()} />
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0e0e0e] px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground"><img src="/nznt-logo.png" alt="" className="h-7 w-7 rounded-md object-cover" />nznt's hub</Link>
        <Link to="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">{t("dashboard")}</Link>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("adminTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("adminSub")}</p>
        </div>
        {error && <p key={error} className="anim-shake rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        {notice && <p key={notice} className="anim-pop anim-visible rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Optional INTERNAL_SERVICE_TOKEN"
          className="w-full rounded-xl border border-white/10 bg-transparent px-5 py-3.5 text-foreground outline-none transition focus:border-foreground"
        />
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat icon={Activity} label={t("activeSessions")} value={monitoring?.activeSessions ?? "-"} delay={0} />
          <Stat icon={FileUp} label={t("queuedBuilds")} value={monitoring?.queuedBuilds ?? "-"} delay={60} />
          <Stat icon={Shield} label={t("scriptsLabel")} value={monitoring?.scripts.length ?? "-"} delay={120} />
          <Stat icon={Receipt} label={t("pendingLabel")} value={payments.filter((p) => p.status === "PENDING").length} delay={180} />
        </div>
        <Card title={t("approvalsTitle")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="pb-3 font-medium">{t("thUser")}</th>
                  <th className="pb-3 font-medium">{t("thPlan")}</th>
                  <th className="pb-3 font-medium">{t("thAmount")}</th>
                  <th className="pb-3 font-medium">{t("thStatus")}</th>
                  <th className="pb-3 font-medium">{t("thProof")}</th>
                  <th className="pb-3 font-medium">{t("thAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="anim-row-hover text-foreground">
                    <td className="py-3">{payment.user?.email ?? payment.user?.username ?? "-"}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="py-3">{payment.status}</td>
                    <td className="py-3">
                      {payment.proofUrl ? (
                        <a href={`${apiUrl}/admin/payments/${payment.id}/proof`} target="_blank" rel="noreferrer" className="block w-20 overflow-hidden rounded border border-white/10 bg-black/20">
                          <img src={`${apiUrl}/admin/payments/${payment.id}/proof`} alt={`Payment proof for ${payment.id}`} className="h-14 w-20 object-cover" />
                        </a>
                      ) : <span className="text-muted-foreground">{t("noProof")}</span>}
                    </td>
                    <td className="py-3">
                      {payment.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button disabled={processingId === payment.id} onClick={() => void approve(payment.id)} className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-4 py-2 text-xs font-semibold text-[#111] disabled:opacity-50">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {processingId === payment.id ? t("working") : t("approve")}
                          </button>
                          <button disabled={processingId === payment.id} onClick={() => void reject(payment.id)} className="inline-flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 disabled:opacity-50">
                            <XCircle className="h-3.5 w-3.5" /> {t("reject")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={t("recentEventsTitle")}>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {(monitoring?.recentEvents ?? []).map((event) => (
                <tr key={event.id} className="anim-row-hover text-foreground">
                  <td className="py-3">{event.type}</td>
                  <td className="py-3">{event.session?.script?.fileName ?? "-"}</td>
                  <td className="py-3">{event.session?.user?.email ?? event.session?.user?.username ?? "-"}</td>
                  <td className="py-3">{event.session?.device?.robloxUsername ?? event.session?.device?.robloxUserId ?? "-"}</td>
                  <td className="py-3 text-muted-foreground">{formatDateTime(event.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title={t("liveStatsTitle")}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">{t("thScript")}</th><th className="pb-3 font-medium">{t("thRoblox")}</th><th className="pb-3 font-medium">{t("thMoney")}</th><th className="pb-3 font-medium">{t("thEarned")}</th><th className="pb-3 font-medium">{t("thPerHour")}</th><th className="pb-3 font-medium">{t("thLevel")}</th><th className="pb-3 font-medium">{t("thTask")}</th><th className="pb-3 font-medium">{t("thLastSeen")}</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {(monitoring?.sessions ?? []).map((session) => {
                  const stats = sessionStats(session.stats);
                  return <tr key={session.id} className="anim-row-hover text-foreground"><td className="py-3">{session.scriptFile ?? session.game ?? "-"}</td><td className="py-3">{session.robloxUsername ?? "-"}</td><td className="py-3">{stats.money}</td><td className="py-3">{stats.earned}</td><td className="py-3">{stats.hourly}</td><td className="py-3">{stats.level}</td><td className="py-3">{stats.task}</td><td className="py-3 text-muted-foreground">{formatDateTime(session.lastSeenAt)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
