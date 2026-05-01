import Link from "next/link"
import { ArrowRight, Shield, Zap, Crown, Terminal, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-xl font-bold text-white">nznt</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
              <Zap className="w-4 h-4" />
              <span>Undetectable & Optimized</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Dominate Drag Drive
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Like Never Before
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The most advanced autofarm script for Drag Drive Simulator. 
              First to bypass anticheat, fully optimized, 20-30M per hour.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link 
                href="/premium" 
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all flex items-center gap-2"
              >
                Get Premium
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/dashboard" 
                className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors border border-white/10"
              >
                Dashboard
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>500+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>24/7 Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Undetectable</h3>
              <p className="text-gray-400">
                First script to bypass Drag Drive anticheat. Safe on main accounts with banwave detection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 hover:border-pink-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400">
                Fully optimized autofarm earning 20-30M per hour. No lag, works on all vehicles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Premium Features</h3>
              <p className="text-gray-400">
                Webhook integration, auto rejoin, unlimited HWID resets, and priority updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-gray-400">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Weekly */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="text-sm text-purple-400 font-semibold mb-2">WEEKLY</div>
              <div className="text-4xl font-bold text-white mb-1">Rp 10K</div>
              <div className="text-gray-500 text-sm mb-6">~$1 USD</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>7 days access</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>All premium features</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Unlimited HWID resets</span>
                </li>
              </ul>
              <Link 
                href="/premium" 
                className="block w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-center font-semibold transition-colors"
              >
                Get Weekly
              </Link>
            </div>

            {/* Monthly */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="text-sm text-purple-400 font-semibold mb-2">MONTHLY</div>
              <div className="text-4xl font-bold text-white mb-1">Rp 30K</div>
              <div className="text-gray-500 text-sm mb-6">~$3 USD</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>30 days access</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>All premium features</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Unlimited HWID resets</span>
                </li>
              </ul>
              <Link 
                href="/premium" 
                className="block w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-center font-semibold transition-colors"
              >
                Get Monthly
              </Link>
            </div>

            {/* Lifetime */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 hover:border-purple-500/70 transition-all relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold">
                BEST VALUE
              </div>
              <div className="text-sm text-purple-400 font-semibold mb-2">LIFETIME</div>
              <div className="text-4xl font-bold text-white mb-1">Rp 50K</div>
              <div className="text-gray-400 text-sm mb-6">~$4 USD</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Forever access</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>All premium features</span>
                </li>
                <li className="flex items-center gap-2 text-white">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Unlimited HWID resets</span>
                </li>
              </ul>
              <Link 
                href="/premium" 
                className="block w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-center font-semibold transition-all"
              >
                Get Lifetime
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Free Script Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 text-center">
            <Terminal className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Try Our Free Script</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Test out the basic features before upgrading to premium. Free version includes basic autofarm functionality.
            </p>
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 mb-6">
              <code className="text-sm text-purple-400 font-mono">
                loadstring(game:HttpGet("https://beta.vonalia.com/Obfuscate/nzntfree"))()
              </code>
            </div>
            <p className="text-sm text-gray-500">
              Copy and paste into your executor to try it out
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-lg font-bold text-white">nznt's hub</span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 nznt. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/premium" className="text-gray-400 hover:text-white transition-colors text-sm">
                Premium
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
