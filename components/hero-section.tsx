"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Purple/Blue Gradient Background */}
      <div className="absolute inset-0">
        {/* Left purple blob */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[150px]" />
        {/* Right blue blob */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-semibold mb-8 tracking-tight"
        >
          <span className="text-white">nznt&apos;s</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500">
            hub
          </span>
          <span className="text-white">.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12"
        >
          The First & Best script for{" "}
          <span className="text-purple-400 font-medium">Drag Drive Simulator</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="#free-script">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-medium bg-white text-black hover:bg-gray-200 transition-all duration-300 rounded-lg"
            >
              Get Free Script
            </Button>
          </Link>

          <Link href="/premium">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 rounded-lg"
            >
              Buy Premium
            </Button>
          </Link>
        </motion.div>

        {/* Redeem Key Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-sm text-gray-500"
        >
          Already have a key?{" "}
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 hover:underline">
            Redeem it on Dashboard
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
