"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Menu, Sparkles, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToFreeScript = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("free-script");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // If not on home page, navigate first then scroll
      router.push("/#free-script");
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Terminal className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-accent">nznt&apos;s</span>{" "}
            <span className="text-foreground">hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <button
            onClick={scrollToFreeScript}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Free Script
          </button>
          <Link
            href="/premium"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Premium
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Dashboard
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            onClick={scrollToFreeScript}
            variant="ghost"
            size="sm"
            className="text-accent"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Free Script
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
          >
            <Link href="/premium">
              <Crown className="mr-2 h-4 w-4" />
              Buy Premium
            </Link>
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-background md:hidden overflow-hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              <button
                onClick={scrollToFreeScript}
                className="rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Free Script
              </button>
              <Link
                href="/premium"
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Premium
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={scrollToFreeScript}
                  variant="outline"
                  className="w-full justify-center text-accent border-accent"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Free Script
                </Button>
                <Button
                  asChild
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                >
                  <Link href="/premium">
                    <Crown className="mr-2 h-4 w-4" />
                    Buy Premium
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
