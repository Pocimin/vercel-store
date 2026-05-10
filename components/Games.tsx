"use client";

import type { ComponentType } from "react";
import { Car, Check, Sparkles, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Feature = {
  label: string;
  included: boolean;
};

type Game = {
  id: string;
  name: string;
  tagline: string;
  icon: ComponentType<{ className?: string }>;
  features: Feature[];
  footerTitle: string;
  footerSubtitle: string;
};

const games: Game[] = [
  {
    id: "dds",
    name: "Drag Drive Simulator",
    tagline: "Full DDS coverage, free and premium.",
    icon: Car,
    features: [
      { label: "Auto Drive Farm", included: true },
      { label: "Barista Autofarm", included: true },
      { label: "Teleport, Speedhack, Anti-Ban", included: true },
      { label: "Universal Vehicle Auto Drive", included: true },
      { label: "Drag, Mandalika & Office Autofarms", included: true },
      { label: "Locked behind paywall", included: false },
    ],
    footerTitle: "Free + Premium.",
    footerSubtitle: "Premium unlocks every method.",
  },
  {
    id: "cdid",
    name: "CDID",
    tagline: "We don't pay for secure, full feature set for everyone.",
    icon: Truck,
    features: [
      { label: "Autofarm Without Gamepass (7.5-8M/Hour)", included: true },
      { label: "Support for Lower Devices", included: true },
      { label: "Minigames Feature", included: true },
      { label: "Advanced Anti-Detect Method", included: true },
      { label: "Anti Admin / Staff", included: true },
      { label: "FPS & Ping Counter", included: true },
      { label: "Ping-Based TP (AI Integration)", included: true },
      { label: "Premium-only restrictions", included: false },
    ],
    footerTitle: "Freemium For All.",
    footerSubtitle: "No premium perks.",
  },
  {
    id: "slime",
    name: "Slime RNG",
    tagline: "Full automation from farm to rebirth.",
    icon: Sparkles,
    features: [
      { label: "Auto Farm", included: true },
      { label: "Auto Upgrade", included: true },
      { label: "Auto Zone", included: true },
      { label: "Auto Rebirth", included: true },
      { label: "Auto Farm Drops", included: true },
      { label: "Auto TP To Custom Player", included: true },
      { label: "Premium-only restrictions", included: false },
    ],
    footerTitle: "Freemium For All.",
    footerSubtitle: "No premium perks.",
  },
];

export const Games = () => (
  <section id="games" className="relative py-28 scroll-mt-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
          Our Games
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          So, what are you waiting for?
          <br />
          Start using our <span className="text-foreground">Freemium</span> scripts today.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  </section>
);

const GameCard = ({ game }: { game: Game }) => {
  const Icon = game.icon;

  return (
    <article className="group relative flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card/55 p-7 transition-colors hover:border-primary/35">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80"
      />

      <header className="relative flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{game.name}</h3>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{game.tagline}</p>
        </div>
      </header>

      <div className="my-7 h-px w-full bg-border/70" />

      <ul className="relative space-y-3.5">
        {game.features.map((feature) => (
          <li
            key={feature.label}
            className={`flex items-center gap-3 text-sm leading-6 ${
              feature.included ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                feature.included
                  ? "border-primary/35 bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {feature.included ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
            </span>
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-10">
        <p className="text-2xl font-semibold tracking-tight">{game.footerTitle}</p>
        <p className="mt-1 text-base text-muted-foreground">{game.footerSubtitle}</p>
        <Button
          asChild
          size="lg"
          className="mt-7 h-12 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90"
        >
          <a href="#free-script">Start Using Today</a>
        </Button>
      </div>
    </article>
  );
};
