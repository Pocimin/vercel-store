"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FreeScriptSection() {
  const [copied, setCopied] = useState(false);

  const freeScript = `loadstring(game:HttpGet("https://raw.githubusercontent.com/nznt/dds-hub/main/free.lua"))()`;

  const handleCopy = () => {
    navigator.clipboard.writeText(freeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const freeFeatures = [
    "Barista Farm",
    "Anticheat Bypass",
    "Motor Speedhack",
    "Auto Drive Farm",
  ];

  return (
    <section id="free-script" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.08),transparent_50%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent">Free Version</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started for <span className="text-accent">Free</span>
            </h2>
            <p className="text-muted-foreground">
              Copy the script below and paste it into your executor
            </p>
          </motion.div>

          {/* Script Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-cyan-500/50 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <div className="relative bg-card border border-border rounded-xl overflow-hidden">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Script
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
              </div>

              {/* Code Area */}
              <div className="p-4 font-mono text-sm">
                <code className="text-accent break-all">{freeScript}</code>
              </div>

              {/* Copy Button */}
              <div className="px-4 py-3 bg-muted/30 border-t border-border">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleCopy}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Script
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Free Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {freeFeatures.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-card/50 border border-border hover:border-accent/30 transition-colors"
              >
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Upgrade CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-2">
              Want more features? Check out Premium!
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <a href="/premium">View Premium Features</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
