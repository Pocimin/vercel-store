import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, FileUp, Receipt, Shield } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { api, formatDateTime, formatMoney, json, type MonitoringData, type PaymentRow } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - nznt's hub" },
      { name: "description", content: "Admin payment approvals, script uploads, and live monitoring." },
    ],
  }),
  component: AdminPage,
});

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="card card-glow p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[oklch(0.74_0.19_47/0.25)] bg-[oklch(0.74_0.19_47/0.12)]">
        <Icon className="h-4 w-4 text-[oklch(0.82_0.15_55)]" />
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-foreground">{value}</div>
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
  const [token, setToken] = useState(() => localStorage.getItem("nznt_admin_token") ?? "");
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState("");
  const [upload, setUpload] = useState({ fileName: "autofarm_yellow.lua", game: "drag-drive-simulator", type: "roblox", channel: "stable", version: Date.now().toString(), source: "" });
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
    load().catch((err) => setError(err instanceof Error ? err.message : "Admin login required"));
    if (!monitoring) return;
    const timer = window.setInterval(() => load().catch(() => undefined), 10_000);
    return () => window.clearInterval(timer);
  }, [token, Boolean(monitoring)]);

  async function approve(id: string) {
    const result = await json<{ plainKey: string }>(await api(`/admin/payments/${id}/approve`, { method: "POST", headers }));
    alert(`License created: ${result.plainKey}`);
    await load();
  }

  async function uploadScript(event: React.FormEvent) {
    event.preventDefault();
    await json(await api("/admin/scripts/upload", { method: "POST", headers, body: JSON.stringify(upload) }));
    await load();
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
        <Link to="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">Dashboard</Link>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin monitoring</h1>
          <p className="mt-1 text-muted-foreground">Payments, script builds, and live Roblox script sessions.</p>
        </div>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Optional INTERNAL_SERVICE_TOKEN"
          className="w-full field-input px-5 py-3.5 text-foreground outline-none transition focus:border-foreground"
        />
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat icon={Activity} label="Active sessions" value={monitoring?.activeSessions ?? "-"} />
          <Stat icon={FileUp} label="Queued builds" value={monitoring?.queuedBuilds ?? "-"} />
          <Stat icon={Shield} label="Scripts" value={monitoring?.scripts.length ?? "-"} />
          <Stat icon={Receipt} label="Pending" value={payments.filter((p) => p.status === "PENDING").length} />
        </div>
        <Card title="Payment approvals">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="text-foreground">
                  <td className="py-3">{payment.user?.email ?? payment.user?.username ?? "-"}</td>
                  <td className="py-3">{payment.plan}</td>
                  <td className="py-3">{formatMoney(payment.amount, payment.currency)}</td>
                  <td className="py-3">{payment.status}</td>
                  <td className="py-3">
                    {payment.status === "PENDING" && (
                      <button onClick={() => approve(payment.id)} className="inline-flex items-center gap-2 rounded-full btn-primary px-4 py-2 text-xs font-semibold text-[#111]">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Recent script events">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {(monitoring?.recentEvents ?? []).map((event) => (
                <tr key={event.id} className="text-foreground">
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
        <Card title="Live script stats">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Script</th><th className="pb-3 font-medium">Roblox</th><th className="pb-3 font-medium">Money</th><th className="pb-3 font-medium">Earned</th><th className="pb-3 font-medium">/ hour</th><th className="pb-3 font-medium">Level</th><th className="pb-3 font-medium">Task</th><th className="pb-3 font-medium">Last seen</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {(monitoring?.sessions ?? []).map((session) => {
                  const stats = sessionStats(session.stats);
                  return <tr key={session.id} className="text-foreground"><td className="py-3">{session.scriptFile ?? session.game ?? "-"}</td><td className="py-3">{session.robloxUsername ?? "-"}</td><td className="py-3">{stats.money}</td><td className="py-3">{stats.earned}</td><td className="py-3">{stats.hourly}</td><td className="py-3">{stats.level}</td><td className="py-3">{stats.task}</td><td className="py-3 text-muted-foreground">{formatDateTime(session.lastSeenAt)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Upload script">
          <form onSubmit={uploadScript} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={upload.fileName} onChange={(e) => setUpload({ ...upload, fileName: e.target.value })} className="field-input px-5 py-3.5 text-foreground outline-none transition focus:border-foreground" />
              <input value={upload.version} onChange={(e) => setUpload({ ...upload, version: e.target.value })} className="field-input px-5 py-3.5 text-foreground outline-none transition focus:border-foreground" />
              <input value={upload.game} onChange={(e) => setUpload({ ...upload, game: e.target.value })} className="field-input px-5 py-3.5 text-foreground outline-none transition focus:border-foreground" />
              <input value={upload.channel} onChange={(e) => setUpload({ ...upload, channel: e.target.value })} className="field-input px-5 py-3.5 text-foreground outline-none transition focus:border-foreground" />
            </div>
            <textarea value={upload.source} onChange={(e) => setUpload({ ...upload, source: e.target.value })} className="min-h-64 w-full field-input px-5 py-3.5 font-mono text-sm text-foreground outline-none transition focus:border-foreground" />
            <button className="rounded-full btn-primary px-5 py-2.5 text-sm font-semibold text-[#111]">Upload & obfuscate</button>
          </form>
        </Card>
      </main>
    </div>
  );
}
