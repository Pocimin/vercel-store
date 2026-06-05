"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SCRIPT = `loadstring(game:HttpGet("https://vonalia.com/api/v1/scripts/1780567340102"))()`;

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
        <div className="border-y border-border/80 py-10 md:grid md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-14">
          <div className="md:pr-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Free Script
            </p>
            <h2 className="mt-5 max-w-lg text-4xl font-semibold tracking-tight md:text-6xl">
              Public loader, kept direct.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
              This is the current free loader URL on Vonalia stable. The premium loader
              stays separate for paid keys.
            </p>
            <Link
              href="/premium"
              className="mt-8 inline-flex text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View premium access
            </Link>
          </div>

          <div className="mt-10 md:mt-0">
            <div className="grid grid-cols-[112px_1fr] border-t border-border/70 text-sm">
              <div className="border-b border-border/70 py-3 text-muted-foreground">
                Build
              </div>
              <div className="border-b border-border/70 py-3 font-medium">
                Free public
              </div>
              <div className="border-b border-border/70 py-3 text-muted-foreground">
                Endpoint
              </div>
              <div className="border-b border-border/70 py-3 font-medium">
                Vonalia stable
              </div>
            </div>

            <div className="mt-6 border border-border/80 bg-background/60">
              <div className="border-b border-border/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                loader.lua
              </div>
              <pre className="overflow-x-auto px-4 py-5 font-mono text-[13px] leading-6 text-primary">
                <code>{SCRIPT}</code>
              </pre>
              <div className="border-t border-border/70 p-3">
                <Button
                  onClick={copy}
                  size="lg"
                  className="h-11 w-full rounded-md bg-foreground text-background hover:bg-foreground/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy free script"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
