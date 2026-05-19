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
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-white/10 backdrop-blur-xl bg-black/40 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold text-white">Scholarly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition px-4 py-2">
              Sign in
            </Link>
            <Link href="/login" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">AI-powered knowledge management</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Your research,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              connected
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Add papers, links, notes, and videos. Scholarly automatically summarizes, tags, and maps relationships between everything — so you can find insights faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-xl transition text-lg">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-medium px-8 py-3.5 rounded-xl transition text-lg">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for deep research</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Every resource you add is enriched by AI — automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400 text-lg">Three steps from raw resource to connected knowledge.</p>
          </div>

          <div className="space-y-8">
            <Step number="01" title="Add a resource" desc="Paste a URL, upload a PDF, drop in notes, or add a video link. Anything goes in." />
            <Step number="02" title="AI processes it" desc="Within seconds, Scholarly extracts text, generates a summary, assigns tags, and creates a semantic embedding." />
            <Step number="03" title="Explore & connect" desc="View your resources as a feed, timeline, topic clusters, or an interactive knowledge graph. Ask AI questions about everything." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to connect your research?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Create a workspace and start adding resources. It's free.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3.5 rounded-xl transition text-lg">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-black" />
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition group">
      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <span className="text-emerald-400 font-bold text-sm font-mono">{number}</span>
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-400">{desc}</p>
      </div>
    </div>
  )
}
