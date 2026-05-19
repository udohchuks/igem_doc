import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces } from '@/lib/db/schema'
import { Folder, Plus, ArrowRight, Sparkles, Users } from 'lucide-react'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const userWorkspaces = await db.select().from(workspaces)

  return (
    <div className="space-y-10 sm:space-y-14 p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium tracking-wide">Knowledge Hub</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Your Workspaces</h2>
          <p className="text-gray-400 text-sm sm:text-base">Manage and switch between your research knowledge bases</p>
        </div>
      </div>
      
      {userWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 stagger-children">
          {userWorkspaces.map(ws => (
            <a key={ws.id} href={`/workspaces/${ws.id}`} className="group relative block bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all duration-300 active:scale-[0.98] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/[0.02] group-hover:to-emerald-500/[0.08] transition-colors" />
              
              <div className="relative z-10 flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all duration-300 text-gray-400">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.06] px-2.5 py-1 rounded-md border border-white/[0.04]">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">MEMBER</span>
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="font-semibold text-white text-lg sm:text-xl group-hover:text-emerald-400 transition-colors mb-1 truncate">{ws.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 group-hover:text-gray-400 transition-colors">
                  Enter workspace <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all duration-300" />
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 sm:p-16 text-center overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-transparent opacity-50" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
              <Folder className="w-10 h-10 text-gray-500 group-hover:text-emerald-400 transition-colors duration-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">No workspaces yet</h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
              Workspaces are shared environments where you and your team can organize research, documents, and findings.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Create New Workspace</h3>
            <p className="text-xs sm:text-sm text-gray-400">Start a new knowledge base for your research</p>
          </div>
        </div>
        
        <form action="/api/workspaces" method="post" className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              name="name" 
              placeholder="e.g. SynBio Literature Review" 
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:bg-white/[0.05] transition text-sm sm:text-base"
            />
          </div>
          <button type="submit" className="group bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.97] flex items-center justify-center gap-2">
            Create 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  )
}
