"use client";

import { useState } from "react";
import { Check, Copy, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SCRIPT = `loadstring(game:HttpGet("https://vonalia.com/api/v1/scripts/1780567340102"))()`;

const details = [
  ["Build", "Stable free loader"],
  ["Access", "Public"],
  ["Coverage", "Multi-game"],
];

export const FreeScript = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="free-script" className="relative py-28 scroll-mt-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Free Loader
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Start with the public build.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              The free script uses the stable Vonalia endpoint and stays pointed at the
              current public loader.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {details.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/75 bg-card/35 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-card/45">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">free.loader.lua</p>
                  <p className="text-xs text-muted-foreground">Vonalia stable API</p>
                </div>
              </div>
              <Button
                onClick={copy}
                size="sm"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="p-4">
              <pre className="max-h-40 overflow-x-auto rounded-md border border-border/70 bg-background/70 p-4 font-mono text-[13px] leading-6 text-emerald-200">
                <code>{SCRIPT}</code>
              </pre>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={copy}
                  size="lg"
                  className="h-11 flex-1 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Free Script"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-lg border-amber-300/35 text-amber-200 hover:bg-amber-300/10 hover:text-amber-100"
                  asChild
                >
                  <Link href="/premium">View Premium</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
