"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Hero = () => (
  <section className="relative overflow-hidden pt-36 pb-28">
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[700px] w-[1100px] -translate-x-1/2 animate-glow"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(265 85% 55% / 0.35), transparent 60%)",
      }}
    />

    <div className="container mx-auto px-4 relative">
      <div className="mx-auto max-w-3xl text-center animate-fade-up">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] text-gradient">
          The #1 Script Hub
          <br />
          for <span className="text-gradient-purple">Roblox</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base md:text-lg text-muted-foreground">
          One hub, multiple games. Undetectable autofarms, anti-ban, and
          premium features that actually work. 100% safe on main.
        </p>

        <div
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <Button variant="hero" size="lg" className="min-w-[180px]" asChild>
            <a href="#free-script">
              <Download className="h-4 w-4" />
              Get Free Script
            </a>
          </Button>
          <Button variant="ghostMuted" size="lg" className="min-w-[180px]" asChild>
            <Link href="/premium">View Premium</Link>
          </Button>
        </div>
      </div>

      <div
        id="scripts"
        className="relative mt-20 mx-auto max-w-6xl animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="grid gap-8 md:grid-cols-2">
          <ProductCard
            label="Free"
            badgeClass="bg-secondary text-foreground"
            src="/ui-free.png"
            alt="nznt's hub — Free UI"
          />
          <ProductCard
            label="Premium"
            badgeClass="bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] text-primary-foreground"
            src="/ui-premium.png"
            alt="nznt's hub — Premium UI"
            highlighted
          />
        </div>
      </div>
    </div>
  </section>
);

const ProductCard = ({
  label,
  badgeClass,
  src,
  alt,
  highlighted,
}: {
  label: string;
  badgeClass: string;
  src: string;
  alt: string;
  highlighted?: boolean;
}) => (
  <div className="group relative">
    {highlighted && (
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(265 85% 55% / 0.55), transparent 70%)",
        }}
      />
    )}
    <div className={`beam-border ${highlighted ? "beam-border-strong" : ""}`}>
      <div className="beam-inner p-2">
        <div className="absolute left-4 top-4 z-10">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
            {label}
          </span>
        </div>
        <Image
          src={src}
          alt={alt}
          width={600}
          height={400}
          loading="lazy"
          decoding="async"
          className="w-full h-auto rounded-xl"
        />
      </div>
    </div>
  </div>
);
