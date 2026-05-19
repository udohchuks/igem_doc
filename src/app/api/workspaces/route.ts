import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { workspaces, workspaceMembers } from '@/lib/db/schema'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const name = formData.get('name') as string

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Create Workspace
  const [workspace] = await db.insert(workspaces).values({ name }).returning()

  // Add the user as owner
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: 'owner',
  })

  // Redirect to workspaces page
  return redirect('/workspaces')
}
