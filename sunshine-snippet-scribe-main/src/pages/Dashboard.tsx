import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Crown,
  Clock,
  Shield,
  Key,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Infinity as InfinityIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PREMIUM_KEY =
  "KEY_b131ae6c1ffa2dd9427094bd36307f77e1eaf8c915420157fd2bd4b68a1792cd4d050b3ec5589e3db330a3229";
const PREMIUM_SCRIPT = `loadstring(game:HttpGet("https://beta.vonalia.com/Obfuscate/nzntpremium"))()`;

const Dashboard = () => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const copy = async (text: string, which: "key" | "script") => {
    await navigator.clipboard.writeText(text);
    if (which === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1500);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1500);
    }
    toast({ title: "Copied" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl pt-12 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mt-10 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              nznt
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your account and premium access</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Crown className="h-5 w-5 text-amber-400" />} label="Plan" value="Weekly" iconBg="bg-amber-400/15" />
          <StatCard icon={<Clock className="h-5 w-5 text-cyan-300" />} label="Expires" value="25/04/2026" iconBg="bg-cyan-400/15" />
          <StatCard
            icon={<Shield className="h-5 w-5 text-emerald-300" />}
            label="HWID Resets"
            value={
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <InfinityIcon className="h-4 w-4" /> Unlimited
              </span>
            }
            iconBg="bg-emerald-400/15"
          />
        </div>

        {/* Premium Key */}
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-card/40 p-6">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold">Your Premium Key</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep this key safe. You'll need it to access your premium features.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 p-3">
            <code className="flex-1 truncate font-mono text-xs text-amber-300">{PREMIUM_KEY}</code>
            <Button size="icon" variant="ghost" onClick={() => copy(PREMIUM_KEY, "key")}>
              {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Premium Script */}
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-card/40 p-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-300" />
            <h3 className="font-semibold">Premium Script</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy and paste this into your executor. Enter your key when prompted.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border/70 bg-background/60 p-4 font-mono text-xs text-amber-300">
            <code>{PREMIUM_SCRIPT}</code>
          </pre>
          <Button
            onClick={() => copy(PREMIUM_SCRIPT, "script")}
            className="mt-3 w-full rounded-xl bg-emerald-400 text-background hover:bg-emerald-300"
          >
            {copiedScript ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Script
          </Button>
        </div>

        {/* Reset HWID */}
        <div className="mt-4 rounded-2xl border border-border/80 bg-card/40 p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <h3 className="font-semibold">Reset HWID</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reset your hardware ID if you've changed devices.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 text-sm text-emerald-300">
            <InfinityIcon className="h-4 w-4" />
            Premium users have unlimited HWID resets with no cooldown!
          </div>
          <Button variant="outline" className="mt-3 w-full rounded-xl">
            <RefreshCw className="h-4 w-4" /> Reset HWID
          </Button>
        </div>
      </div>
    </main>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconBg: string;
}) => (
  <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card/40 p-5">
    <div className={`grid h-11 w-11 place-items-center rounded-xl ${iconBg}`}>{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  </div>
);

export default Dashboard;
