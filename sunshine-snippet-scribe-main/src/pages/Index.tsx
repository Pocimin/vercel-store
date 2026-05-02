import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Compare } from "@/components/Compare";
import { FreeScript } from "@/components/FreeScript";
import { FAQ } from "@/components/FAQ";
import { CTAFooter } from "@/components/CTAFooter";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Compare />
      <FreeScript />
      <FAQ />
      <CTAFooter />
    </main>
  );
};

export default Index;
