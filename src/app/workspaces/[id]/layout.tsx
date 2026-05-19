import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces, workspaceMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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

  const memberRecords = await db.select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, user.id), eq(workspaceMembers.workspaceId, workspaceId)))

  if (memberRecords.length === 0) {
    return redirect('/workspaces')
  }

  const ws = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))
  const workspaceName = ws[0]?.name || 'Workspace'

  const navItems = [
    { name: 'Feed', href: `/workspaces/${workspaceId}`, icon: 'LayoutList' },
    { name: 'Topics', href: `/workspaces/${workspaceId}/topics`, icon: 'Tags' },
    { name: 'Timeline', href: `/workspaces/${workspaceId}/timeline`, icon: 'Clock' },
    { name: 'Map', href: `/workspaces/${workspaceId}/map`, icon: 'Network' },
    { name: 'Search', href: `/workspaces/${workspaceId}/search`, icon: 'Search' },
  ]

  return (
    <SidebarLayout navItems={navItems} workspaceName={workspaceName} role={memberRecords[0].role}>
      {children}
    </SidebarLayout>
  )
}
