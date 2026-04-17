"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const scrollToFreeScript = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("free-script");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.15),transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-pulse" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm text-muted-foreground">
            Undetected & Working
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight text-balance"
        >
          <span className="text-foreground">nznt&apos;s</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-cyan-400 to-accent drop-shadow-[0_0_30px_rgba(0,212,255,0.5)]">
            hub
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4"
        >
          The ultimate script for{" "}
          <span className="text-accent font-semibold">Drag Drive Simulator</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-muted-foreground/70 max-w-xl mx-auto mb-12"
        >
          First hub to fully bypass the anticheat. Earn 20-30M/hour with our
          undetectable autofarm. 100% safe to use on main.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={scrollToFreeScript}
            size="lg"
            className="group relative px-8 py-6 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Get Free Script
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="group px-8 py-6 text-lg font-bold border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400 transition-all duration-300"
          >
            <Link href="/premium">
              <Crown className="w-5 h-5 mr-2" />
              Buy Premium
            </Link>
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground/60"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm">Anticheat Bypass</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">20-30M/Hour</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm">100% Undetected</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
