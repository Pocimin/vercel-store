import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Home,
  Download,
  Key,
  Receipt,
  LifeBuoy,
  LogOut,
  Copy,
  Check,
  Shield,
  Clock,
  Cpu,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { ScriptBox } from "@/components/ScriptBox";
import { AuthPanel } from "@/components/AuthPanel";
import { api, dashboard, formatDate, formatDateTime, formatMoney, json, type DashboardData } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - nznt's hub" },
      { name: "description", content: "Manage your nznt's hub license, downloads and monitoring." },
    ],
  }),
  component: Dashboard,
});

const DASHBOARD_SCRIPT =
  'loadstring(game:HttpGet("https://vonalia.com/api/v1/scripts/1780569996244"))()';

type Tab = "overview" | "downloads" | "license" | "monitoring" | "billing" | "support";

const DashboardContext = createContext<DashboardData | null>(null);
const useDashboard = () => useContext(DashboardContext);

function useNav() {
  const { t } = useI18n();
  return [
    { id: "overview" as const, label: t("navOverview"), icon: Home },
    { id: "downloads" as const, label: t("navDownloads"), icon: Download },
    { id: "license" as const, label: t("navLicense"), icon: Key },
    { id: "monitoring" as const, label: t("navMonitoring"), icon: Activity },
    { id: "billing" as const, label: t("navBilling"), icon: Receipt },
    { id: "support" as const, label: t("navSupport"), icon: LifeBuoy },
  ];
}

function Sidebar({ tab, setTab, signOut, signingOut }: { tab: Tab; setTab: (t: Tab) => void; signOut: () => void; signingOut: boolean }) {
  const { t } = useI18n();
  const NAV = useNav();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-[#0e0e0e] p-4 md:block">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2 py-2">
        <img src="/nznt-logo.png" alt="" className="h-7 w-7 rounded-md object-cover" />
        <span className="text-base font-extrabold tracking-tight text-foreground">nznt's hub</span>
      </Link>
      <nav className="space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-8 border-t border-white/5 pt-4">
        <button onClick={signOut} disabled={signingOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.03] hover:text-foreground disabled:opacity-50">
          <LogOut className="h-4 w-4" />
          {signingOut ? t("signingOut") : t("signOut")}
        </button>
      </div>
    </aside>
  );
}

function Card({ title, children, action, delay = 0 }: { title: string; children: React.ReactNode; action?: React.ReactNode; delay?: number }) {
  return (
    <div className="anim-fade-up anim-visible rounded-xl border border-white/5 bg-[#141414] p-5" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <div className="anim-fade-up anim-visible rounded-xl border border-white/5 bg-[#141414] p-5" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="anim-pulse mt-1 text-2xl font-extrabold text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Overview() {
  const { t } = useI18n();
  const data = useDashboard();
  const license = data?.licenses[0];
  const session = data?.sessions[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("welcomeBack")}</h1>
        <p className="mt-1 text-muted-foreground">{data?.user.displayName ?? data?.user.username ?? data?.user.email ?? t("welcomeSub")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Shield} label={t("licenseStatus")} value={license?.status ?? t("inactive")} sub={license?.plan ?? t("noActivePlan")} delay={0} />
        <Stat icon={Clock} label={t("expiresIn")} value={formatDate(license?.expiresAt)} sub={license?.keyPreview ?? "-"} delay={60} />
        <Stat icon={Cpu} label="Roblox" value={session?.robloxUsername ?? data?.user.robloxUsername ?? "-"} sub={session?.executor ?? t("noSessionYet")} delay={120} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={t("latestBuild")}
          delay={0}
          action={<span className="anim-pulse rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">{t("liveBadge")}</span>}
        >
          <p className="text-sm text-muted-foreground">
            {t("dashLoaderDesc")}
          </p>
          <Link to="/dashboard" search={{}} hash="" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5">
            <Download className="h-4 w-4" />
            {t("downloadScript")}
          </Link>
        </Card>

        <Card title={t("recentActivity")} delay={60}>
          <ul className="space-y-3 text-sm">
            {(data?.sessions.length ? data.sessions.slice(0, 3) : []).map((event) => (
              <li key={event.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <span className="text-foreground">{event.scriptFile ?? event.game ?? t("scriptSession")}</span>
                <span className="text-muted-foreground">{formatDateTime(event.lastSeenAt)}</span>
              </li>
            ))}
            {!data?.sessions.length && <li className="text-muted-foreground">{t("noSessionsYet")}</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function LicenseTab() {
  const { t } = useI18n();
  const data = useDashboard();
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<null | "active" | "inactive">(null);
  const [checkError, setCheckError] = useState("");
  const license = data?.licenses[0];
  const key = license?.key ?? license?.keyPreview ?? t("noLicenseYet");
  const copy = () => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const checkLicense = async () => {
    setCheckError("");
    try {
      const result = await json<{ status: string }>(await api("/user/license/verify", { method: "POST" }));
      setChecked(result.status === "ACTIVE" ? "active" : "inactive");
    } catch (error) {
      setChecked("inactive");
      setCheckError(error instanceof Error && error.message ? error.message : t("licValidationFailed"));
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("navLicense")}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashLicenseSub")}</p>
      </div>

      <Card title={t("licenseKey")}>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-foreground">
          <span className="truncate tracking-widest">{key}</span>
          <button onClick={copy} disabled={!license} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </Card>

      <Card title={t("checkStatus")}>
        <p className="text-sm text-muted-foreground">{t("checkStatusDesc")}</p>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={checkLicense} disabled={!license} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.06] disabled:opacity-40">
            <ShieldCheck className="h-4 w-4" />
            {t("checkNow")}
          </button>
          {checked && (
            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${checked === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {checked === "active" ? t("active") : t("inactive")}
            </span>
          )}
        </div>
        {checkError && <p className="mt-3 text-sm text-red-400">{checkError}</p>}
      </Card>

      <Card title={t("extendLicense")}>
        <p className="text-sm text-muted-foreground">{t("extendDesc")}</p>
        <Link to="/purchase" className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]">
          {t("extendNow")}
        </Link>
      </Card>
    </div>
  );
}

function Downloads() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("navDownloads")}</h1>
        <p className="mt-1 text-muted-foreground">{t("scriptLoaderDesc")}</p>
      </div>
      <Card title={t("scriptLoader")}>
        <ScriptBox script={DASHBOARD_SCRIPT} label="loader.lua" />
      </Card>
    </div>
  );
}

function statRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function statValue(stats: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = stats[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function statText(value: unknown) {
  if (typeof value === "number") return new Intl.NumberFormat("id-ID").format(value);
  if (typeof value === "string" && value) return value;
  return "-";
}

function moneyText(value: unknown) {
  return typeof value === "number" ? formatMoney(value) : statText(value);
}

function durationText(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "-";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole / 60) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

function Monitoring() {
  const { t } = useI18n();
  const data = useDashboard();
  const [issuedCode, setIssuedCode] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  async function issueCode() {
    setCodeStatus("");
    try {
      const result = await json<{ code: string }>(await api("/user/monitoring-code", { method: "POST" }));
      setIssuedCode(result.code);
      setCodeStatus(t("monCodeStatus"));
    } catch (error) {
      setCodeStatus(error instanceof Error && error.message ? error.message : t("monCodeFailed"));
    }
  }

  const monitoringCode = issuedCode || data?.monitoring.code || "";
  async function copyCode() {
    if (!monitoringCode) return;
    await navigator.clipboard.writeText(monitoringCode);
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 1500);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("monitoringTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("monitoringSub")}</p>
      </div>

      <Card title={t("monitoringAccess")}>
        <p className="text-sm text-muted-foreground">{t("monCodeDesc")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-dashed border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground">
            {monitoringCode || t("monNoCode")}
          </code>
          {!monitoringCode && <button onClick={issueCode} className="rounded-full bg-[#f3efe7] px-4 py-2 text-sm font-semibold text-[#111]">{t("monGenerate")}</button>}
          {monitoringCode && <button onClick={copyCode} className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${codeCopied ? "scale-95 border-emerald-400/40 bg-emerald-500/15 text-emerald-400" : "border-white/10 text-foreground"}`}>
            {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {codeCopied ? t("copied") : t("copy")}
          </button>}
        </div>
        {codeStatus && <p className="mt-3 text-xs text-muted-foreground">{codeStatus}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
          {(data?.sessions ?? []).map((session) => {
          const stats = statRecord(session.stats);
          return <Card key={session.id} title={session.robloxUsername ?? session.scriptFile ?? t("scriptInstance")}>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("statusLabel")}</dt><dd className="max-w-52 text-right text-foreground">{statText(session.currentTask) !== "-" ? statText(session.currentTask) : session.status}</dd></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("elapsed")}</dt><dd className="text-right tabular-nums text-foreground">{durationText(statValue(stats, ["elapsed"]))}</dd></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("currentMoney")}</dt><dd className="text-right text-foreground">{moneyText(statValue(stats, ["currentMoney", "money", "cash", "beli"]))}</dd></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("earnedLabel")}</dt><dd className="text-right text-foreground">{moneyText(statValue(stats, ["totalEarned", "earned", "sessionEarned"]))}</dd></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("moneyPerHour")}</dt><dd className="text-right text-foreground">{moneyText(statValue(stats, ["moneyPerHour", "moneyHour"]))}</dd></div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"><dt className="text-muted-foreground">{t("lastSeen")}</dt><dd className="text-right text-foreground">{formatDateTime(session.lastSeenAt)}</dd></div>
            </dl>
          </Card>;
        })}
      </div>
    </div>
  );
}

function Billing() {
  const { t } = useI18n();
  const data = useDashboard();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("navBilling")}</h1>
        <p className="mt-1 text-muted-foreground">{t("billingIntro")}</p>
      </div>
      <Card title={t("orderHistory")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="pb-3 font-medium">{t("order")}</th>
              <th className="pb-3 font-medium">{t("date")}</th>
              <th className="pb-3 font-medium">{t("item")}</th>
              <th className="pb-3 font-medium">{t("total")}</th>
              <th className="pb-3 font-medium">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(data?.payments ?? []).map((o) => (
              <tr key={o.id} className="anim-row-hover text-foreground">
                <td className="py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                <td className="py-3">{o.plan}</td>
                <td className="py-3">{formatMoney(o.amount, o.currency)}</td>
                <td className="py-3">
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Support() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("navSupport")}</h1>
        <p className="mt-1 text-muted-foreground">{t("supportIntro")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={t("discordTitle")}>
          <p className="text-sm text-muted-foreground">{t("discordDesc")}</p>
          <a href="https://discord.gg/nznt" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-sm font-semibold text-[#111]">
            {t("openDiscord")}
          </a>
        </Card>
        <Card title={t("emailUs")}>
          <p className="text-sm text-muted-foreground">
            {t("emailDesc")}{" "}
            <a href="mailto:support@nznt.store" className="text-foreground underline">
              support@nznt.store
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const NAV = useNav();

  async function load() {
    try {
      setData(await dashboard());
      setError("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("loginRequired"));
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Network/CORS failure must not trap the user in the session.
    } finally {
      try {
        localStorage.removeItem("nznt_admin_token");
      } catch {}
      setData(null);
      setError("");
      void navigate({ to: "/" });
    }
  }

  useEffect(() => {
    load();
    if (!data) return;
    const timer = window.setInterval(load, 10_000);
    return () => window.clearInterval(timer);
  }, [Boolean(data)]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-6 py-20">
        <AuthPanel onDone={() => void load()} />
        {error && <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{error}</p>}
      </div>
    );
  }

  const displayName = data.user.displayName ?? data.user.username ?? data.user.email ?? t("customer");

  return (
    <DashboardContext.Provider value={data}>
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar tab={tab} setTab={setTab} signOut={signOut} signingOut={signingOut} />
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-white/5 bg-[#0e0e0e] px-6 py-4">
            <div className="flex items-center gap-2 md:hidden">
              <img src="/nznt-logo.png" alt="" className="h-6 w-6 rounded-md object-cover" />
              <span className="text-sm font-extrabold text-foreground">nznt's hub</span>
            </div>
            <div className="hidden text-sm text-muted-foreground md:block">
              {t("signedInAs")}{" "}<span className="text-foreground">{displayName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/redeem" className="hidden text-sm text-muted-foreground transition hover:text-foreground sm:block">
                {t("redeem")}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.66_0.23_25)] to-[oklch(0.78_0.18_55)] text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label={t("closeMenu")} onClick={() => setMenuOpen(false)} />
                    <div role="menu" className="anim-scale-in anim-visible absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#141414] p-1.5 shadow-xl">
                      <Link to="/redeem" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-white/[0.06]">
                        {t("redeem")}
                      </Link>
                      <Link to="/terms" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
                        {t("terms")}
                      </Link>
                      <Link to="/privacy" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground">
                        {t("privacy")}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-white/5 bg-[#0e0e0e] px-2 py-2 md:hidden">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition ${tab === n.id ? "bg-white/[0.06] text-foreground" : "text-muted-foreground"}`}>
                {n.label}
              </button>
            ))}
          </nav>

          <main className="mx-auto max-w-5xl px-6 py-10">
            <div key={tab} className="anim-fade-in anim-visible">
              {tab === "overview" && <Overview />}
              {tab === "downloads" && <Downloads />}
              {tab === "license" && <LicenseTab />}
              {tab === "monitoring" && <Monitoring />}
              {tab === "billing" && <Billing />}
              {tab === "support" && <Support />}
            </div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
