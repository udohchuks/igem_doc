import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Brain, Network, Search, Clock, Users, ArrowRight, Sparkles, ChevronRight, Zap } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/workspaces')
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] overflow-x-hidden selection:bg-emerald-500/30">
      <nav className="border-b border-white/[0.06] bg-[#0a0e14]/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <BookOpen className="w-5 h-5 text-[#0a0e14]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Scholarly</span>
          </div>
          <Link href="/login" className="text-sm bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-20 sm:pb-32 lg:pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-emerald-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.1] rounded-full px-4 py-2 mb-8 sm:mb-10 hover:bg-white/[0.06] transition-colors cursor-default backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm text-emerald-400/90 font-medium tracking-wide uppercase">Next-Gen Knowledge Base</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold text-white leading-[1.05] sm:leading-[1.1] mb-8 tracking-tight">
            Research,<br className="sm:hidden" />{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-500 relative inline-block">
              Connected.
              <svg className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-3 sm:h-4 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-2xl lg:max-w-3xl mx-auto mb-10 sm:mb-14 leading-relaxed font-light">
            Upload papers, links, and notes. Scholarly's AI automatically summarizes, tags, and maps the relationships between everything — so you can synthesize faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-8 py-4 rounded-2xl transition-all text-lg shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] active:scale-95 group">
              Start your workspace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium px-8 py-4 rounded-2xl transition-all text-lg active:scale-95 group">
              Explore features
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gray-400 group-hover:text-white" />
            </a>
          </div>
        </div>
      </section>

      {/* Bento Box Feature Section */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#0d1117] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">Built for synthesis</h2>
            <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Every resource you add is instantly enriched by our AI pipeline, transforming raw data into a connected graph.
            </p>
          </div>

          {/* Responsive Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[minmax(180px,auto)] lg:auto-rows-[minmax(220px,auto)]">
            
            {/* Knowledge Graph - Large */}
            <BentoCard 
              className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40"
              icon={<Network className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />}
              title="Semantic Knowledge Graph"
              desc="Our embedding engine automatically detects relationships between your resources. Instantly see how papers cite, contradict, or extend each other without manual linking."
              large
            />

            {/* Auto Summaries - Small */}
            <BentoCard 
              className="lg:col-span-1"
              icon={<Brain className="w-6 h-6 text-cyan-400" />}
              title="Auto Summaries"
              desc="AI reads every resource and generates a concise 2–3 sentence summary."
            />

            {/* Smart Tags - Small */}
            <BentoCard 
              className="lg:col-span-1"
              icon={<Sparkles className="w-6 h-6 text-yellow-400" />}
              title="Smart Tags"
              desc="AI organizes resources into themes automatically. Zero manual effort."
            />

            {/* Semantic Search - Small */}
            <BentoCard 
              className="lg:col-span-1"
              icon={<Search className="w-6 h-6 text-purple-400" />}
              title="Semantic Search"
              desc="Search by meaning, not just exact keywords. Find relevant insights faster."
            />

            {/* Timeline View - Small */}
            <BentoCard 
              className="lg:col-span-1"
              icon={<Clock className="w-6 h-6 text-blue-400" />}
              title="Timeline View"
              desc="Watch how a body of knowledge evolved over time, plotted automatically."
            />

            {/* Team Workspaces - Wide */}
            <BentoCard 
              className="md:col-span-2 lg:col-span-2 bg-gradient-to-tr from-cyan-500/5 to-transparent hover:border-cyan-500/30"
              icon={<Users className="w-8 h-8 text-cyan-400" />}
              title="Collaborative Workspaces"
              desc="Invite your research group or lab with role-based access control. Everyone accesses the exact same connected, continuously-updated knowledge base in real-time."
            />
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-[#0a0e14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight">The Pipeline</h2>
            <p className="text-gray-400 text-lg sm:text-xl">Three steps from raw URL to deep synthesis.</p>
          </div>

          <div className="relative">
            {/* Connecting line (Desktop) */}
            <div className="hidden md:block absolute top-[4.5rem] left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
              <Step number="01" title="Ingest" desc="Paste a URL, drop a PDF, or write notes. Our system accepts any format." delay="0" />
              <Step number="02" title="Process" desc="AI extracts text, summarizes, tags, and generates vector embeddings instantly." delay="150" />
              <Step number="03" title="Synthesize" desc="Explore your feed, query the knowledge graph, and uncover hidden connections." delay="300" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 sm:py-40 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-white/[0.06]">
        {/* Background glow for CTA */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0a0e14] to-[#0a0e14] pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-[2.5rem] p-10 sm:p-16 lg:p-24 shadow-2xl shadow-emerald-900/20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-500/10">
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">Ready to level up?</h2>
          <p className="text-gray-400 text-lg sm:text-xl md:text-2xl mb-12 leading-relaxed max-w-2xl mx-auto">
            Join other researchers organizing the world's knowledge faster.
          </p>
          <Link href="/login" className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-bold px-10 py-5 rounded-2xl transition-all text-lg sm:text-xl shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 group">
            Create Free Account
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <BookOpen className="w-3 h-3 text-[#0a0e14]" />
            </div>
            <span className="font-semibold text-gray-400 tracking-wide uppercase text-xs">Scholarly Platform</span>
          </div>
          <span className="text-xs tracking-wider">iGEM 2026 INTERNAL TOOLING</span>
        </div>
      </footer>
    </div>
  )
}

function BentoCard({ icon, title, desc, className = "", large = false }: { icon: React.ReactNode; title: string; desc: string; className?: string; large?: boolean }) {
  return (
    <div className={`group relative bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 sm:p-8 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden flex flex-col justify-between ${className}`}>
      {/* Interactive hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        <div className={`mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out origin-left ${large ? 'w-16 h-16' : 'w-12 h-12'}`}>
          {icon}
        </div>
        <h3 className={`text-white font-bold mb-3 tracking-tight ${large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}>{title}</h3>
        <p className={`text-gray-400 leading-relaxed ${large ? 'text-base sm:text-lg max-w-lg' : 'text-sm sm:text-base'}`}>{desc}</p>
      </div>
    </div>
  )
}

function Step({ number, title, desc, delay }: { number: string; title: string; desc: string; delay: string }) {
  return (
    <div className="flex flex-col items-center text-center group relative z-10" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#0a0e14] border-2 border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 sm:mb-8 relative z-10">
        <span className="text-emerald-400 font-bold text-xl sm:text-2xl font-mono">{number}</span>
      </div>
      <div>
        <h3 className="text-white font-bold text-xl md:text-2xl mb-3 sm:mb-4 group-hover:text-emerald-400 transition-colors duration-300">{title}</h3>
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-4 sm:px-0">{desc}</p>
      </div>
    </div>
  )
}
