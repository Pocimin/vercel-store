import { Check, Info } from "lucide-react";

type Feature = {
  name: string;
  free: boolean;
  premium: boolean;
};

const features: Feature[] = [
  { name: "Supported games", free: true, premium: true },
  { name: "Core autofarms", free: true, premium: true },
  { name: "Anti-ban protection", free: true, premium: true },
  { name: "Community support", free: true, premium: true },
  { name: "Universal vehicle auto drive", free: false, premium: true },
  { name: "Drag, Mandalika, Office farms", free: false, premium: true },
  { name: "Premium-only methods", free: false, premium: true },
  { name: "Priority fixes", free: false, premium: true },
  { name: "Unlimited HWID resets", free: false, premium: true },
];

const PlanCheck = ({ enabled }: { enabled: boolean }) => (
  <div className="flex h-full items-center justify-center">
    {enabled ? <Check className="h-4 w-4 text-primary" strokeWidth={2.5} /> : null}
  </div>
);

export const Compare = () => (
  <section id="features" className="relative py-28 scroll-mt-24">
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-6xl overflow-x-auto">
        <div className="min-w-[760px] border-t-4 border-border bg-[#100d11]/80">
          <div className="grid grid-cols-[1.15fr_56px_0.72fr_0.72fr] border-b border-border/70">
            <div className="col-span-2 px-7 py-6 text-xs font-semibold uppercase tracking-[0.16em]">
              Features
            </div>
            <div className="px-7 py-6 text-center text-xs font-semibold uppercase tracking-[0.16em]">
              Free
            </div>
            <div className="px-7 py-6 text-center text-xs font-semibold uppercase tracking-[0.16em]">
              Premium
            </div>
          </div>

          <div className="grid min-h-[145px] grid-cols-[1.15fr_56px_0.72fr_0.72fr] border-b border-border/70">
            <div className="flex items-start px-7 py-8">
              <h2 className="text-2xl font-medium tracking-tight">Access</h2>
            </div>
            <div className="col-span-3 px-7 py-8">
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Free keeps the public loader useful across supported games. Premium is
                for the higher-maintenance routes, faster fixes, and paid-only methods.
              </p>
            </div>
          </div>

          <div>
            {features.map((feature) => (
              <div
                key={feature.name}
                className="grid min-h-[58px] grid-cols-[1.15fr_56px_0.72fr_0.72fr] bg-[#0d0b0e]/55 even:bg-[#100d11]/55"
              >
                <div className="flex items-center px-7 py-4 text-sm font-medium">
                  {feature.name}
                </div>
                <div className="flex items-center justify-center px-2 py-4">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-muted/55 text-muted-foreground/70">
                    <Info className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                </div>
                <PlanCheck enabled={feature.free} />
                <PlanCheck enabled={feature.premium} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
