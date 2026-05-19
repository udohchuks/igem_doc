import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces, workspaceMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Link from 'next/link'
import { LayoutList, Tags, Clock, Network, Search } from 'lucide-react'

export default async function WorkspaceDetailLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{ id: string }>
}) {
  const { id: workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Verify membership
  const memberRecords = await db.select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, user.id), eq(workspaceMembers.workspaceId, workspaceId)))

  if (memberRecords.length === 0) {
    return redirect('/workspaces')
  }

  const ws = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
  const workspaceName = ws[0]?.name || 'Workspace'

  const navItems = [
    { name: 'Feed', href: `/workspaces/${workspaceId}`, icon: LayoutList },
    { name: 'Topics', href: `/workspaces/${workspaceId}/topics`, icon: Tags },
    { name: 'Timeline', href: `/workspaces/${workspaceId}/timeline`, icon: Clock },
    { name: 'Map', href: `/workspaces/${workspaceId}/map`, icon: Network },
    { name: 'Search', href: `/workspaces/${workspaceId}/search`, icon: Search },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] -m-6">
      <div className="bg-gray-900 border-b border-gray-800 px-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-white text-lg">{workspaceName}</h2>
            <span className="text-xs text-gray-500 capitalize">{memberRecords[0].role}</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link 
              key={item.name}
              href={item.href} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition hover:bg-gray-800 hover:text-white text-gray-400"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
