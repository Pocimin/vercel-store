import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FreeScriptSection } from "@/components/free-script-section"
import { FeaturesSection } from "@/components/features-section"
import { DiscordSection } from "@/components/discord-section"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FreeScriptSection />
        <FeaturesSection />
        <DiscordSection />
      </main>
    </div>
  )
}
