import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FreeScriptSection } from "@/components/free-script-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FreeScriptSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  )
}
