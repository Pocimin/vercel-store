"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function DiscordSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Purple/Blue gradient background like Solara */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
      
      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-indigo-900/40 border border-white/10 backdrop-blur-sm">
            {/* Glow effect */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 blur-xl opacity-50" />
            
            <div className="relative text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
                Discord
              </h2>
              <p className="text-lg text-white/60 mb-8">
                Join our community for support, updates, and exclusive features.
              </p>
              
              <Button
                asChild
                size="lg"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25"
              >
                <a
                  href="https://discord.gg/q6dUF4CsKH"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Join Discord
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
