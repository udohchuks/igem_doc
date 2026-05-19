import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces, workspaceMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const memberRecords = await db.select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))

  const userWorkspaces = []
  for (const record of memberRecords) {
    const ws = await db.select().from(workspaces).where(eq(workspaces.id, record.workspaceId))
    if (ws.length > 0) {
      userWorkspaces.push({ ...ws[0], role: record.role })
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Your Workspaces</h2>
        <p className="text-gray-500 text-xs sm:text-sm">Manage your research knowledge bases</p>
      </div>
      
      {userWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {userWorkspaces.map(ws => (
            <a key={ws.id} href={`/workspaces/${ws.id}`} className="block bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-6 hover:border-emerald-500/30 hover:bg-white/[0.05] transition group active:scale-[0.98]">
              <h3 className="font-semibold text-white text-base sm:text-lg group-hover:text-emerald-400 transition truncate">{ws.name}</h3>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{ws.role}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <p className="text-gray-400 text-sm mb-2">You haven't joined any workspaces yet.</p>
          <p className="text-gray-500 text-xs sm:text-sm">Create one below or ask a team member to invite you.</p>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Create New Workspace</h3>
        <form action="/api/workspaces" method="post" className="flex flex-col gap-3 sm:gap-4">
          <input 
            type="text" 
            name="name" 
            placeholder="Workspace name" 
            required
            className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition text-sm"
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.97]">
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  )
}
