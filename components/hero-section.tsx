"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black pt-20 pb-10">
      {/* Background gradient - Purple/Blue like Solara */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.15),transparent_50%)]" />
      
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Main Heading - Solara style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="text-white">nznt&apos;s</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              hub
            </span>
          </h1>
        </motion.div>

        {/* Tagline - The first script to fully bypass the anticheat */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-8"
        >
          The first script to fully bypass the anticheat.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Button
            asChild
            size="lg"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-6 text-lg rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25"
          >
            <Link href="/dashboard">
              <ExternalLink className="w-5 h-5 mr-2" />
              Get Started
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-6 text-lg rounded-xl transition-all duration-300"
          >
            <Link href="/premium">
              <Crown className="w-5 h-5 mr-2" />
              Buy Premium
            </Link>
          </Button>
        </motion.div>

        {/* Rounded image container like Solara */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1">
            <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-[16/9] flex items-center justify-center">
              {/* Placeholder for the UI mockup - replace with actual image */}
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-white/60 text-lg">Dashboard Preview</p>
                <p className="text-white/40 text-sm">Replace with actual screenshot</p>
              </div>
            </div>
          </div>
          
          {/* Glow effect behind the image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50 -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
