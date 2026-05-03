"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const CTAFooter = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
  <footer ref={sectionRef} className="relative overflow-hidden border-t border-border/60">
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(265 85% 55% / 0.25), transparent 65%)",
      }}
    />
    <div className="container py-24 text-center px-4">
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-gradient">
          Ready to ship your run?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Free loader, instant Premium activation. Join the Discord to stay on the latest build.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="hero" size="lg" asChild>
            <a href="https://nznt.store" target="_blank" rel="noreferrer">Get Premium</a>
          </Button>
          <Button variant="ghostMuted" size="lg" asChild>
            <a href="https://discord.gg/q6dUF4CsKH" target="_blank" rel="noreferrer">Join Discord</a>
          </Button>
        </div>
      </div>
      <div className="mt-20 flex flex-col items-center justify-center gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} nznt&apos;s hub. Created by _nznt.</p>
        <div className="flex items-center gap-5">
          <a href="https://nznt.store" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Store</a>
          <a href="https://discord.gg/q6dUF4CsKH" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Discord</a>
        </div>
      </div>
    </div>
  </footer>
  );
};
