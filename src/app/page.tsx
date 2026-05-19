import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Brain, Network, Search, Clock, Users, ArrowRight, Sparkles, Database, Zap } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/workspaces')
  }

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#0a0e14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-5 h-5 text-[#0a0e14]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Scholarly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-28 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-10">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">AI-powered knowledge management</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] mb-8 tracking-tight">
            Your research,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400">
              connected
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Add papers, links, notes, and videos. Scholarly automatically summarizes, tags, and maps relationships between everything — so you can find insights faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-10 py-4 rounded-xl transition text-lg shadow-xl shadow-emerald-500/25">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 border border-white/10 hover:border-white/25 hover:bg-white/5 text-white font-medium px-10 py-4 rounded-xl transition text-lg">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">Built for deep research</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Every resource you add is enriched by AI — automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Auto Summaries"
              desc="Gemini AI reads every resource and generates a 2–3 sentence summary so you know what it's about at a glance."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Smart Tags"
              desc="AI-generated topic tags organize your resources into themes automatically. No manual categorization needed."
            />
            <FeatureCard
              icon={<Network className="w-6 h-6" />}
              title="Knowledge Graph"
              desc="Semantic embeddings detect relationships between resources. See how papers cite, contradict, or extend each other."
            />
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Semantic Search"
              desc="Search by meaning, not just keywords. Find relevant resources even if they use different terminology."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Timeline View"
              desc="See how a body of knowledge evolved over time. Resources plotted by their publication date."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Team Workspaces"
              desc="Invite collaborators with role-based access. Everyone sees the same connected knowledge base."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">How it works</h2>
            <p className="text-gray-400 text-xl">Three steps from raw resource to connected knowledge.</p>
          </div>

          <div className="space-y-12">
            <Step number="01" title="Add a resource" desc="Paste a URL, upload a PDF, drop in notes, or add a video link. Anything goes in." />
            <Step number="02" title="AI processes it" desc="Within seconds, Scholarly extracts text, generates a summary, assigns tags, and creates a semantic embedding." />
            <Step number="03" title="Explore & connect" desc="View your resources as a feed, timeline, topic clusters, or an interactive knowledge graph. Ask AI questions about everything." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-emerald-500/10 border border-emerald-500/20 rounded-3xl p-16 lg:p-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to connect your research?</h2>
          <p className="text-gray-400 text-xl mb-10 leading-relaxed">
            Create a workspace and start adding resources. It's free.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-10 py-4 rounded-xl transition text-lg shadow-xl shadow-emerald-500/25">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-[#0a0e14]" />
            </div>
            <span className="font-semibold text-gray-400">Scholarly</span>
          </div>
          <span>Built for iGEM 2026</span>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
      <p className="text-gray-400 text-base leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-8 items-start group">
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all duration-300">
        <span className="text-emerald-400 font-bold text-lg font-mono">{number}</span>
      </div>
      <div className="pt-2">
        <h3 className="text-white font-semibold text-2xl mb-2">{title}</h3>
        <p className="text-gray-400 text-lg leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
