import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SidebarLayout } from '@/components/SidebarLayout'

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

  const ws = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
  
  if (ws.length === 0) {
    return redirect('/workspaces')
  }

  const workspaceName = ws[0]?.name || 'Workspace'

  const navItems = [
    { name: 'Feed', href: `/workspaces/${workspaceId}`, icon: 'LayoutList' },
    { name: 'Files', href: `/workspaces/${workspaceId}/files`, icon: 'Folder' },
    { name: 'Journal', href: `/workspaces/${workspaceId}/journal`, icon: 'BookOpen' },
    { name: 'Timeline', href: `/workspaces/${workspaceId}/timeline`, icon: 'Clock' },
    { name: 'Map', href: `/workspaces/${workspaceId}/map`, icon: 'Network' },
    { name: 'Search', href: `/workspaces/${workspaceId}/search`, icon: 'Search' },
    { name: 'API Monitor', href: `/workspaces/${workspaceId}/monitor`, icon: 'Activity' },
  ]

  return (
    <SidebarLayout navItems={navItems} workspaceName={workspaceName} role="member">
      {children}
    </SidebarLayout>
  )
}
