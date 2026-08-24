import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import ui1Image from "@/assets/ui1.png";
import ui2Image from "@/assets/ui2.png";
import { ScriptBox } from "@/components/ScriptBox";
import { useI18n } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { GAMES } from "@/lib/games";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "nznt's hub - The #1 Script Hub for Roblox" },
      {
        name: "description",
        content:
          "The #1 Script Hub for Roblox. Undetectable autofarms, anti-ban, and premium features that actually work.",
      },
    ],
  }),
  component: Index,
});

const LOADER_SCRIPT_HOME =
  'loadstring(game:HttpGet("https://vonalia.com/api/v1/scripts/1780569996244"))()';

function useSaleCountdown() {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setDiff(Math.max(0, end.getTime() - now.getTime()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Nav() {
  const { t } = useI18n();
  return (
    <header className="anim-fade-down anim-visible sticky top-0 z-50 px-4 pt-5">
      <nav className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-white/5 bg-[#1c1c1c] px-6 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-foreground">
          <img src="/nznt-logo.png" alt="" className="h-7 w-7 rounded-md object-cover" />
          <span>nznt's hub</span>
        </Link>
        <ul className="flex items-center gap-6 text-sm text-muted-foreground">
          <li>
            <Link to="/purchase" className="transition-colors hover:text-foreground">{t("purchase")}</Link>
          </li>
          <li>
            <Link to="/redeem" className="transition-colors hover:text-foreground">{t("redeem")}</Link>
          </li>
          <li>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">{t("dashboard")}</Link>
          </li>
          <li className="hidden sm:block">
            <a href="https://youtu.be/ljYe55Ee3vM?si=6koHaXXcSrXL7_H9" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">{t("showcase")}</a>
          </li>
          <li className="hidden sm:block">
            <a href="https://discord.gg/nznt" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">{t("contact")}</a>
          </li>

        </ul>
      </nav>
    </header>
  );
}

function TimeCell({ value, label }: { value: number; label: string }) {
  const v = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-xl font-semibold tabular-nums text-foreground">{v}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const { days, hours, minutes, seconds } = useSaleCountdown();
  return (
    <section className="px-4 pt-14 pb-8 text-center sm:pt-16">
      <h1 className="anim-fade-up anim-visible anim-delay-1 brand-gradient text-[22vw] font-extrabold leading-none tracking-tight sm:text-[180px]">
        nznt's hub
      </h1>
      <p className="anim-fade-up anim-visible anim-delay-2 mt-6 text-base text-muted-foreground sm:text-lg">
        {t("tagline")}
      </p>

      <div className="anim-fade-up anim-visible anim-delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/free"
          className="anim-shimmer group inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-7 py-3.5 text-base font-semibold text-[#111] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
        >
          {t("getStarted")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          to="/purchase"
          className="anim-shimmer inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-base font-semibold text-foreground transition hover:bg-white/[0.08]"
        >
          {t("buyPremium")}
        </Link>
      </div>

      <div className="anim-fade-up anim-visible anim-delay-4 mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="brand-gradient font-bold">25%</span> {t("saleEndsIn")}
        </p>
        <div className="anim-pulse flex items-center gap-5">
          <TimeCell value={days} label={t("days")} />
          <span className="text-muted-foreground/60">:</span>
          <TimeCell value={hours} label={t("hrs")} />
          <span className="text-muted-foreground/60">:</span>
          <TimeCell value={minutes} label={t("min")} />
          <span className="text-muted-foreground/60">:</span>
          <TimeCell value={seconds} label={t("sec")} />
        </div>
      </div>
    </section>
  );
}

function GamesShowcase() {
  const { t } = useI18n();
  const [active, setActive] = useState(GAMES[0].id);
  const [paused, setPaused] = useState(false);
  const game = GAMES.find((g) => g.id === active) ?? GAMES[0];

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((cur) => {
        const i = GAMES.findIndex((g) => g.id === cur);
        return GAMES[(i + 1) % GAMES.length].id;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(255,140,60,0.10),transparent_70%)]" />

      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#111] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] anim-card-hover anim-tilt">

        <div className="grid gap-0 sm:grid-cols-[210px_1fr]">
          <ul className="border-b border-white/5 bg-[#0c0c0c] p-2 sm:border-b-0 sm:border-r">
            {GAMES.map((g) => {
              const on = g.id === active;
              return (
                <li key={g.id}>
                  <button
                    onClick={() => setActive(g.id)}
                    className={`anim-card-hover-sm group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                      on
                        ? "bg-white/[0.05] text-foreground"
                        : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-6 w-0.5 rounded-full transition ${
                        on ? "bg-foreground/60" : "bg-transparent"
                      }`}
                    />
                    <img
                      src={g.image}
                      alt=""
                      loading="lazy"
                      className={`h-8 w-8 rounded-md object-cover transition ${on ? "" : "grayscale group-hover:grayscale-0"}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {t(g.nameKey)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="p-5">
            <div className="flex items-start gap-4">
              <img
                src={game.image}
                alt={t(game.nameKey)}
                className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t("supportedGames")} · {GAMES.indexOf(game) + 1}/{GAMES.length}
                </div>
                <div className="mt-0.5 text-xl font-extrabold text-foreground">
                  {t(game.nameKey)}
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2 border-t border-white/5 pt-4 text-sm">
              {game.features.map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  <span className="flex-1 text-foreground/90">{f.label}</span>
                  {f.kind === "premium" && (
                    <span className="text-[11px] text-muted-foreground">{t("premium")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


function StackedUI() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  };
  const reset = () => setTilt({ x: 0, y: 0 });
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="relative aspect-[4/3] w-full [perspective:1200px]"
    >
      <div
        className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <img
          src={ui1Image}
          alt="nznt's hub dashboard UI"
          loading="lazy"
          className="absolute left-0 top-0 w-[85%] rounded-xl border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
          style={{ transform: "translateZ(20px)" }}
        />
        <img
          src={ui2Image}
          alt="nznt's hub AutoDrive Farm UI"
          loading="lazy"
          className="absolute bottom-0 right-0 w-[70%] rounded-xl border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
          style={{ transform: "translateZ(60px)" }}
        />
      </div>
    </div>
  );
}


function FreeSection() {
  const { t } = useI18n();
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section id="free" ref={ref} className={`scroll-mt-24 px-4 py-24 anim-fade-up ${inView ? "anim-visible" : ""}`}>
      <div className="mx-auto grid max-w-6xl items-start gap-16 md:grid-cols-2">
        <div>
          <ScriptBox script={LOADER_SCRIPT_HOME} />
          <ol className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[t("freeStep1"), t("freeStep2"), t("freeStep3")].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-foreground">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            {t("f3Title")}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            {t("f3Body")}
          </p>
          <div className="mt-6">
            <Link
              to="/purchase"
              className="anim-shimmer inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-6 py-3 text-base font-semibold text-[#111] transition-transform hover:-translate-y-0.5"
            >
              {t("buyPremium")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


function FeatureRow({
  title,
  body,
  left,
  right,
  reverse,
}: {
  title: string;
  body: string;
  left: React.ReactNode;
  right: React.ReactNode;
  reverse?: boolean;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section ref={ref} className="px-4 py-20">
      <div
        className={`anim-fade-up ${inView ? "anim-visible" : ""} mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 ${
          reverse ? "md:[&>div:first-child]:order-2" : ""
        }`}
      >
        <div>{left}</div>
        <div className={reverse ? "md:text-right" : ""}>
          <h2 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground md:inline-block">
            {body}
          </p>
          <div className="mt-6">{right}</div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/5 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} nznt's hub. {t("rights")}</p>
        <div className="flex gap-6">
          <Link to="/terms" className="hover:text-foreground">{t("terms")}</Link>
          <Link to="/privacy" className="hover:text-foreground">{t("privacy")}</Link>
          <a href="https://discord.gg/nznt" target="_blank" rel="noreferrer" className="hover:text-foreground">
            {t("contact")}
          </a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  const { t } = useI18n();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scroll = () => {
      if (window.location.hash === "#free") {
        const el = document.getElementById("free");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    scroll();
    window.addEventListener("hashchange", scroll);
    return () => window.removeEventListener("hashchange", scroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>

        <Hero />
        <FeatureRow
          title={t("f1Title")}
          body={t("f1Body")}
          left={<GamesShowcase />}
          right={
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-lg font-bold text-foreground transition-opacity hover:opacity-80"
            >
              {t("supportedGames")} <span aria-hidden>→</span>
            </a>
          }
        />
        <FeatureRow
          reverse
          title={t("f2Title")}
          body={t("f2Body")}
          left={<StackedUI />}
          right={
            <a
              href="https://youtu.be/ljYe55Ee3vM?si=6koHaXXcSrXL7_H9"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-lg font-bold text-foreground transition-opacity hover:opacity-80"
            >
              {t("showcase")} <span aria-hidden>→</span>
            </a>

          }
        />
        <FreeSection />

      </main>
      <Footer />
    </div>
  );
}
