import { Check, Crown, Minus, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PlanValue = "yes" | "no" | "limited";

type FeatureRow = {
  group: string;
  name: string;
  free: PlanValue;
  premium: PlanValue;
  detail: string;
};

const rows: FeatureRow[] = [
  {
    group: "Coverage",
    name: "Supported games",
    free: "yes",
    premium: "yes",
    detail: "Public loader access across the supported game list.",
  },
  {
    group: "Coverage",
    name: "Core autofarms",
    free: "yes",
    premium: "yes",
    detail: "The basic farm loops, movement tools, and utility toggles.",
  },
  {
    group: "Safety",
    name: "Anti-ban protection",
    free: "yes",
    premium: "yes",
    detail: "Shared safety checks used by the current stable builds.",
  },
  {
    group: "DDS",
    name: "Universal vehicle auto drive",
    free: "no",
    premium: "yes",
    detail: "Route automation for vehicle-heavy money methods.",
  },
  {
    group: "DDS",
    name: "Drag, Mandalika, Office farms",
    free: "no",
    premium: "yes",
    detail: "Specialized routines kept for paid access.",
  },
  {
    group: "Access",
    name: "Premium-only methods",
    free: "no",
    premium: "yes",
    detail: "Higher value flows and private game-specific methods.",
  },
  {
    group: "Updates",
    name: "Priority fixes",
    free: "limited",
    premium: "yes",
    detail: "Paid builds get first pass when a game update breaks a method.",
  },
  {
    group: "Account",
    name: "HWID resets",
    free: "limited",
    premium: "yes",
    detail: "Premium users can reset hardware binding without waiting.",
  },
  {
    group: "Support",
    name: "Discord support",
    free: "limited",
    premium: "yes",
    detail: "Community help for free users, direct support for premium.",
  },
];

const planCopy: Record<PlanValue, string> = {
  yes: "Included",
  no: "Not included",
  limited: "Limited",
};

const PlanMark = ({ value, premium = false }: { value: PlanValue; premium?: boolean }) => {
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground/55">
        <Minus className="h-4 w-4" />
        <span className="hidden sm:inline">{planCopy[value]}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 ${
        value === "limited"
          ? "text-muted-foreground"
          : premium
            ? "text-amber-300"
            : "text-primary"
      }`}
    >
      <Check className="h-4 w-4" />
      <span className="hidden sm:inline">{planCopy[value]}</span>
    </span>
  );
};

export const Compare = () => (
  <section id="features" className="relative py-28 scroll-mt-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/85">
          Plan Access
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          Free vs Premium, without the fog.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          The free loader stays useful. Premium is for the heavier methods, faster fixes,
          and the parts that need closer upkeep.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-lg border border-border/80 bg-card/35">
        <div className="grid grid-cols-1 border-b border-border/70 md:grid-cols-[1.15fr_0.8fr_0.8fr]">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Feature
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-border/60 px-6 py-5 md:border-l md:border-t-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold">Free</p>
              <p className="text-xs text-muted-foreground">Public build</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-border/60 px-6 py-5 md:border-l md:border-t-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-300/30 bg-amber-300/10 text-amber-300">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-amber-200">Premium</p>
              <p className="text-xs text-muted-foreground">From Rp 10,000/week</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/55">
          {rows.map((row) => (
            <div
              key={`${row.group}-${row.name}`}
              className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-4 md:grid-cols-[1.15fr_0.8fr_0.8fr] md:gap-0 md:px-0 md:py-0"
            >
              <div className="col-span-3 md:col-span-1 md:px-6 md:py-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                    {row.group}
                  </span>
                  <h3 className="text-base font-semibold">{row.name}</h3>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {row.detail}
                </p>
              </div>
              <div className="flex items-center justify-start rounded-md bg-secondary/35 px-3 py-2 md:rounded-none md:border-l md:border-border/55 md:bg-transparent md:px-6 md:py-5">
                <PlanMark value={row.free} />
              </div>
              <div className="flex items-center justify-start rounded-md bg-amber-300/[0.06] px-3 py-2 md:rounded-none md:border-l md:border-border/55 md:px-6 md:py-5">
                <PlanMark value={row.premium} premium />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 border-t border-border/70 bg-secondary/20 p-4 sm:grid-cols-2 sm:p-5">
          <Button variant="outline" className="rounded-lg" asChild>
            <a href="#free-script">Get Free Script</a>
          </Button>
          <Button className="rounded-lg bg-amber-300 text-background hover:bg-amber-200" asChild>
            <Link href="/premium">Buy Premium</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
