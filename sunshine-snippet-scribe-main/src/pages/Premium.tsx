import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Upload, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Plan = { id: "weekly" | "monthly" | "lifetime"; name: string; sub: string; price: string; usd: string; best?: boolean };
type Method = "qris" | "paypal" | "robux";

const plans: Plan[] = [
  { id: "weekly", name: "Weekly", sub: "7 days", price: "Rp 10,000", usd: "~$1" },
  { id: "monthly", name: "Monthly", sub: "30 days", price: "Rp 30,000", usd: "~$3" },
  { id: "lifetime", name: "Lifetime", sub: "Forever", price: "Rp 50,000", usd: "~$4", best: true },
];

const scriptFeatures = [
  "User-Friendly Interface",
  "Undetectable Autofarm (First to bypass anticheat)",
  "Fully Optimized (No lag)",
  "Fast Autofarm (20-30M/hour)",
  "Webhook Autofarm Integration",
  "Banwave Detection",
  "Auto Rejoin",
  "Updates faster than Free",
  "Works on all vehicles",
  "Beta and Stable option",
  "100% Safe on main account",
];

const whitelistFeatures = [
  "Unlimited HWID Changes",
  "No HWID Reset Cooldown",
  "Instant & Easy Execution",
  "Easy to use AIO panel",
];

const Premium = () => {
  const [plan, setPlan] = useState<Plan["id"]>("lifetime");
  const [method, setMethod] = useState<Method | null>(null);
  const [discord, setDiscord] = useState("");
  const [proof, setProof] = useState<File | null>(null);

  const submit = () => {
    if (!proof) {
      toast({ title: "Missing payment proof", description: "Please upload a screenshot." });
      return;
    }
    toast({
      title: "Payment proof submitted",
      description: "We'll DM you on Discord once it's approved.",
    });
    setProof(null);
    setDiscord("");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative pt-32 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[1000px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(40 95% 55% / 0.18), transparent 65%)",
          }}
        />
        <div className="container">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="mt-8 text-center">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">
              Upgrade to{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Premium
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Unlock all features and dominate Drag Drive Simulator
            </p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* LEFT — checkout flow */}
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-semibold">1. Choose Your Plan</h2>
                <div className="mt-4 space-y-3">
                  {plans.map((p) => {
                    const active = plan === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlan(p.id)}
                        className={`relative w-full rounded-2xl border p-5 text-left transition-colors ${
                          active
                            ? "border-amber-400 bg-amber-400/5"
                            : "border-border/80 bg-card/40 hover:border-border"
                        }`}
                      >
                        {p.best && (
                          <span className="absolute -top-2.5 left-4 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-background">
                            Best Value
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sub}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-amber-400">{p.price}</p>
                            <p className="text-xs text-muted-foreground">{p.usd}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold">2. Payment Method</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {(["qris", "paypal", "robux"] as Method[]).map((m) => {
                    const labels = { qris: ["QRIS", "Indonesia"], paypal: ["PayPal", "Global"], robux: ["Robux", "Gamepass"] }[m];
                    const active = method === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`rounded-2xl border p-4 text-center transition-colors ${
                          active
                            ? "border-emerald-400/60 bg-emerald-400/5"
                            : "border-border/80 bg-card/40 hover:border-border"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${active ? "text-emerald-300" : ""}`}>
                          {labels[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">{labels[1]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {method && (
                <div className="animate-fade-up">
                  <h2 className="text-xl font-semibold">3. Make Payment</h2>
                  <div className="mt-4 rounded-2xl border border-border/80 bg-card/40 p-6 text-center">
                    {method === "qris" && (
                      <>
                        <div className="mx-auto grid h-56 w-56 place-items-center rounded-xl bg-white text-xs text-black">
                          QRIS QR Code
                          <br />
                          NZNT'S HUB
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                          Scan with any e-wallet or mobile banking app
                        </p>
                      </>
                    )}
                    {method === "paypal" && (
                      <p className="text-sm">
                        Send payment to{" "}
                        <span className="font-semibold text-foreground">paypal.me/nznt</span>
                      </p>
                    )}
                    {method === "robux" && (
                      <p className="text-sm">
                        Buy the Roblox gamepass linked in our Discord and screenshot the receipt.
                      </p>
                    )}
                  </div>

                  <h2 className="mt-10 text-xl font-semibold">4. Upload Payment Proof</h2>
                  <div className="mt-4 rounded-2xl border border-border/80 bg-card/40 p-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium">
                        Discord Username <span className="text-muted-foreground">(Optional)</span>
                      </label>
                      <Input
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="e.g. username#1234 or @username"
                        className="mt-2"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Used to contact you about your payment
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Payment Screenshot</label>
                      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/80 bg-background/40 p-8 text-center transition-colors hover:border-primary/50">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {proof ? proof.name : "Click to upload screenshot"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    <Button
                      onClick={submit}
                      size="lg"
                      className="w-full rounded-xl bg-amber-400 text-background hover:bg-amber-300"
                    >
                      Submit Payment Proof
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — features */}
            <div className="rounded-2xl border border-border/80 bg-card/40 p-7 h-fit lg:sticky lg:top-28">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-400" />
                <h3 className="text-xl font-semibold">Premium Features</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything included with your premium subscription
              </p>

              <h4 className="mt-6 text-sm font-semibold text-amber-400">Script Features</h4>
              <ul className="mt-3 space-y-2.5">
                {scriptFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400/15 text-amber-400">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <h4 className="mt-6 text-sm font-semibold text-emerald-300">Whitelist Features</h4>
              <ul className="mt-3 space-y-2.5">
                {whitelistFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Premium;
