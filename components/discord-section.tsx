"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function DiscordSection() {
  return (
    <section className="relative py-32 overflow-hidden bg-black">
      {/* Purple glow at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/20 rounded-full blur-[120px]" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-semibold text-white mb-8">
            nznt&apos;s hub.
          </h2>
          
          <a 
            href="https://discord.gg/q6dUF4CsKH" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 rounded-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Join Discord
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
