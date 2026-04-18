import { HeroSection } from "@/components/hero-section"
import { DiscordSection } from "@/components/discord-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection />
      <DiscordSection />
    </div>
  )
}
