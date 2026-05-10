import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Games } from "@/components/Games";
import { Compare } from "@/components/Compare";
import { FreeScript } from "@/components/FreeScript";
import { FAQ } from "@/components/FAQ";
import { CTAFooter } from "@/components/CTAFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Games />
      <Compare />
      <FreeScript />
      <FAQ />
      <CTAFooter />
    </main>
  );
}
