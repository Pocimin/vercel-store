import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Navbar = () => (
  <header className="fixed top-0 inset-x-0 z-50">
    <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-full border border-border/70 bg-background/60 px-4 py-2 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 pl-2 text-sm font-semibold tracking-tight">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-[10px] font-bold text-primary-foreground">
          N
        </span>
        <span>nznt's hub</span>
      </Link>
      <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
        <a href="/#scripts" className="hover:text-foreground transition-colors">Scripts</a>
        <a href="/#features" className="hover:text-foreground transition-colors">Compare</a>
        <Link to="/premium" className="hover:text-foreground transition-colors">Premium</Link>
        <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a>
      </nav>
      <Button variant="hero" size="sm" asChild>
        <a href="https://discord.gg/q6dUF4CsKH" target="_blank" rel="noreferrer">Join Discord</a>
      </Button>
    </div>
  </header>
);
