"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  RefreshCw,
  Crown,
  Lock,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  { label: "Barista Farm", included: true },
  { label: "Anticheat Bypass", included: true },
  { label: "Motor Speedhack", included: true },
  { label: "Auto Drive Farm", included: true },
  { label: "Undetectable Autofarm", included: false },
  { label: "Webhook Integration", included: false },
  { label: "Banwave Detection", included: false },
  { label: "Unlimited HWID Changes", included: false },
];

const premiumFeatures = [
  { label: "All Free Features", included: true },
  { label: "Undetectable Autofarm (20-30M/hr)", included: true },
  { label: "Webhook Integration", included: true },
  { label: "Banwave Detection", included: true },
  { label: "Auto Rejoin", included: true },
  { label: "Works on All Vehicles", included: true },
  { label: "Unlimited HWID Changes", included: true },
  { label: "Priority Updates", included: true },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Compare <span className="text-accent">Free</span> vs{" "}
            <span className="text-yellow-400">Premium</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Choose the plan that fits your needs
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-sm text-muted-foreground">Basic features</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {freeFeatures.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  {feature.included ? (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={
                      feature.included
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild variant="outline" className="w-full">
                <Link href="#free-script">Get Free Script</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-xl border-2 border-yellow-500/50 bg-gradient-to-b from-yellow-500/5 to-transparent p-6"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-yellow-950 text-xs font-bold rounded-full">
              RECOMMENDED
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/20">
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-400">Premium</h3>
                <p className="text-sm text-muted-foreground">
                  From Rp 10,000/week
                </p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {premiumFeatures.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-foreground">{feature.label}</span>
                </li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold"
              >
                <Link href="/premium">Buy Premium</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Why Choose Us */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-20 grid gap-6 sm:grid-cols-3"
        >
          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 font-semibold">Undetected</h3>
            <p className="text-sm text-muted-foreground">
              First hub to fully bypass the anticheat
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <RefreshCw className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 font-semibold">Regular Updates</h3>
            <p className="text-sm text-muted-foreground">
              Premium updates faster than free version
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Headphones className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 font-semibold">24/7 Support</h3>
            <p className="text-sm text-muted-foreground">
              Get help anytime via Discord
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
