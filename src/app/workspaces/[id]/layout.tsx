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
    <div className="flex h-[calc(100vh-73px)] -m-6">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-lg truncate">{workspaceName}</h2>
          <span className="text-xs text-gray-400 capitalize">{memberRecords[0].role}</span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href} 
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition text-sm font-medium"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
