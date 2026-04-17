import Link from "next/link"
import { Terminal, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <Terminal className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-accent">nznt&apos;s</span>{" "}
                <span className="text-foreground">hub</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground text-center md:text-left">
              The ultimate script for Dress to Impress. Dominate every round.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 md:items-end">
            <div className="flex gap-4">
              <Link
                href="#free-script"
                className="text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                Free Script
              </Link>
              <Link
                href="/premium"
                className="text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                Premium
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-accent"
              >
                Dashboard
              </Link>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <MessageCircle className="h-4 w-4" />
              Join Discord
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} nznt&apos;s hub. Not affiliated with Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  )
}
