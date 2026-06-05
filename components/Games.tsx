import { ArrowRight, Check } from "lucide-react";

type Game = {
  name: string;
  image: string;
  label: string;
  summary: string;
  notes: string[];
  availability: "Free" | "Premium" | "Free + Premium";
};

const games: Game[] = [
  {
    name: "Blox Fruits",
    image: "https://tr.rbxcdn.com/180DAY-a64f70da20fc1e80ee76fe5d49c1be0a/256/256/Image/Webp/noFilter",
    label: "Progression",
    summary: "Questing, farming, and travel tools for the usual grind loop.",
    notes: ["Farm routines", "Movement helpers", "Boss and quest flow"],
    availability: "Free",
  },
  {
    name: "Drag Drive Simulator",
    image: "https://tr.rbxcdn.com/180DAY-b722091cca44e695cd73ed89af4be42c/256/256/Image/Webp/noFilter",
    label: "Vehicles",
    summary: "DDS gets the deepest coverage, including the paid vehicle methods.",
    notes: ["Auto drive farm", "Barista route", "Premium route set"],
    availability: "Free + Premium",
  },
  {
    name: "CDID",
    image: "https://tr.rbxcdn.com/180DAY-9f546c3a4929e483241f27ddabc09945/256/256/Image/Webp/noFilter",
    label: "Driving",
    summary: "A full public setup focused on money routes and device-friendly checks.",
    notes: ["Low device mode", "Minigame tools", "Ping-aware teleport"],
    availability: "Free",
  },
  {
    name: "Evade",
    image: "https://tr.rbxcdn.com/180DAY-bf95a86e5f5e37bf61a5f33401e95deb/512/512/Image/Webp/noFilter",
    label: "Survival",
    summary: "Movement and round tools made for quick escapes and cleaner farming.",
    notes: ["Round assists", "Mobility tools", "Safe utility toggles"],
    availability: "Free",
  },
  {
    name: "Slime RNG",
    image: "https://tr.rbxcdn.com/180DAY-2f7978b674aeb4273e19ba6fa25bb846/512/512/Image/Webp/noFilter",
    label: "RNG",
    summary: "A simple automation stack from rolling through upgrades and rebirths.",
    notes: ["Auto farm", "Auto upgrade", "Zone and rebirth flow"],
    availability: "Free",
  },
  {
    name: "Sailor Piece",
    image: "https://tr.rbxcdn.com/180DAY-ccd8518083f3003a2f934784176030d3/512/512/Image/Webp/noFilter",
    label: "Adventure",
    summary: "Quest, farm, and progression helpers for keeping the route moving.",
    notes: ["Quest routines", "Farm helpers", "Travel utility"],
    availability: "Free",
  },
];

export const Games = () => (
  <section id="games" className="relative py-28 scroll-mt-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/85">
          Game Library
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          Built around the games people actually open.
        </h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Each card maps to a supported title, with coverage that stays close to what
          the current loader is meant to do.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.name} game={game} />
        ))}
      </div>
    </div>
  </section>
);

const GameCard = ({ game }: { game: Game }) => (
  <article className="group flex min-h-[410px] flex-col overflow-hidden rounded-lg border border-border/80 bg-card/40 transition-colors hover:border-primary/40">
    <div className="relative border-b border-border/70 bg-secondary/25 p-5">
      <div className="flex items-start gap-4">
        <img
          src={game.image}
          alt={`${game.name} icon`}
          className="h-20 w-20 shrink-0 rounded-lg border border-white/10 object-cover shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]"
          loading="lazy"
        />
        <div className="min-w-0 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {game.label}
            </span>
            <span
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                game.availability === "Free + Premium"
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  : "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
              }`}
            >
              {game.availability}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{game.name}</h3>
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <p className="text-sm leading-6 text-muted-foreground">{game.summary}</p>

      <ul className="mt-6 space-y-3">
        {game.notes.map((note) => (
          <li key={note} className="flex items-center gap-3 text-sm">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span>{note}</span>
          </li>
        ))}
      </ul>

      <a
        href="#free-script"
        className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        Open loader
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  </article>
);
