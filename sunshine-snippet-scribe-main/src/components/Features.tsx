import { Zap, ShieldCheck, Sparkles, Users } from "lucide-react";

const features = [
  { icon: Zap, title: "Built for speed", desc: "Optimised autofarms with realistic earning rates — no babysitting required." },
  { icon: ShieldCheck, title: "Executor friendly", desc: "Tested across the major executors. We tell you when yours isn't supported." },
  { icon: Sparkles, title: "Constant updates", desc: "Patched fast when games update. Premium gets the fix first." },
  { icon: Users, title: "Active community", desc: "Hundreds of players on Discord sharing configs, friends and feedback." },
];

export const Features = () => (
  <section id="features" className="relative py-28">
    <div className="container">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Why nznt's hub</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
          Tools that actually work.
        </h2>
        <p className="mt-4 text-muted-foreground">No bloat, no fake features — just scripts that hold up.</p>
      </div>
      <div className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative rounded-2xl border border-border/80 bg-card/40 p-6 transition-colors hover:border-primary/40 hover:bg-card/70"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
              <f.icon className="h-4 w-4" />
            </div>
            <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
