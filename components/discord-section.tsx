"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function DiscordSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5865F2]/20 via-[#5865F2]/10 to-transparent border border-[#5865F2]/30 p-8 md:p-12"
        >
          {/* Background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5865F2]/30 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#5865F2]/20 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Discord</h2>
              <p className="text-muted-foreground text-lg">
                Join our community for support, updates, and exclusive content
              </p>
            </div>

            <Button
              asChild
              size="lg"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-[#5865F2]/25 transition-all duration-300 hover:shadow-[#5865F2]/40"
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
        </motion.div>
      </div>
    </section>
  );
}
