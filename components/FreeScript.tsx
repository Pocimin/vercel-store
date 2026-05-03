"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";

const SCRIPT = `loadstring(game:HttpGet("https://raw.githubusercontent.com/nznt/dds-hub/main/free.lua"))()`;

const tags = ["Barista Farm", "Antiriot Bypass", "Motor Speedhack", "Auto Drive Farm"];

export const FreeScript = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="free-script" className="relative py-28 scroll-mt-24">
      <div className="container max-w-3xl mx-auto text-center px-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Free Version
        </span>
        <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
          Get Started for{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Free
          </span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Copy the script below and paste it into your executor
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/80 bg-card/60 text-left mx-auto max-w-2xl">
          <div className="flex items-center justify-between border-b border-border/60 bg-secondary/40 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              Script
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
          </div>
          <pre className="overflow-x-auto px-5 py-5 text-sm leading-relaxed text-emerald-300 font-mono">
            <code>{SCRIPT}</code>
          </pre>
          <div className="border-t border-border/60 p-3">
            <Button
              onClick={copy}
              size="lg"
              className="w-full rounded-xl bg-emerald-400 text-background hover:bg-emerald-300"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Script"}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {tags.map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-4 py-2 text-sm text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              {t}
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Want more features? Check out Premium!
        </p>
        <Button
          variant="outline"
          className="mt-3 rounded-xl border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
          asChild
        >
          <Link href="/premium">View Premium Features</Link>
        </Button>
      </div>
    </section>
  );
};
