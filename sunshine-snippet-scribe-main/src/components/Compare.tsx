import { Check, Lock, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const freeFeatures = [
  { label: "Barista Farm", on: true },
  { label: "Antiriot Bypass", on: true },
  { label: "Motor Speedhack", on: true },
  { label: "Auto Drive Farm", on: true },
  { label: "Undetectable Autofarm", on: false },
  { label: "Webhook Integration", on: false },
  { label: "Banwave Detection", on: false },
  { label: "Unlimited HWID Changes", on: false },
];

const premiumFeatures = [
  "All Free Features",
  "Undetectable Autofarm (20-30M/hr)",
  "Webhook Integration",
  "Banwave Detection",
  "Auto Rejoin",
  "Works on All Vehicles",
  "Unlimited HWID Changes",
  "Priority Updates",
];

export const Compare = () => (
  <section id="features" className="relative py-28">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
          Compare <span className="text-gradient-purple">Free</span> vs{" "}
          <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            Premium
          </span>
        </h2>
        <p className="mt-4 text-muted-foreground">Choose the plan that fits your needs</p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
        {/* FREE */}
        <div className="rounded-2xl border border-border/80 bg-card/40 p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Free</h3>
              <p className="text-sm text-muted-foreground">Basic features</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map((f) => (
              <li
                key={f.label}
                className={`flex items-center gap-3 text-sm ${
                  f.on ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {f.on ? (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
                {f.label}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="mt-7 w-full rounded-xl" asChild>
            <a href="#free-script">Get Free Script</a>
          </Button>
        </div>

        {/* PREMIUM */}
        <div className="relative rounded-2xl border border-amber-400/40 bg-card/40 p-7 shadow-[0_30px_80px_-30px_hsl(40_95%_55%/0.35)]">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-background">
            Recommended
          </span>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-amber-400">Premium</h3>
              <p className="text-sm text-muted-foreground">From Rp 10,000/week</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {premiumFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-400/15 text-amber-400">
                  <Check className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button
            size="lg"
            className="mt-7 w-full rounded-xl bg-amber-400 text-background hover:bg-amber-300"
            asChild
          >
            <Link to="/premium">Buy Premium</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
