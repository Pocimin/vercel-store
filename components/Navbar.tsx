"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const Navbar = () => (
  <header className="fixed top-0 inset-x-0 z-50">
    <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-full border border-border/70 bg-background/60 px-4 py-2 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2 pl-2 text-sm font-semibold tracking-tight">
        <Image 
          src="/avatar.png" 
          alt="nznt's hub" 
          width={24} 
          height={24} 
          className="rounded-md object-cover"
        />
        <span>nznt&apos;s hub</span>
      </Link>
      <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
        <Link href="/games" className="hover:text-foreground transition-colors">Games</Link>
        <a href="/#free-script" className="hover:text-foreground transition-colors">Script</a>
        <Link href="/features" className="hover:text-foreground transition-colors">Compare</Link>
        <Link href="/premium" className="hover:text-foreground transition-colors">Premium</Link>
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>
      <Button variant="hero" size="sm" asChild>
        <a href="https://discord.gg/q6dUF4CsKH" target="_blank" rel="noreferrer">Join Discord</a>
      </Button>
    </div>
  </header>
);
