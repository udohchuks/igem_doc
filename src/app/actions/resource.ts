'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'

export async function addResource(workspaceId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const url = formData.get('url') as string
  const title = formData.get('title') as string
  
  if (!title || !url) {
    throw new Error('Title and URL are required')
  }

  // Insert resource into database
  await db.insert(resources).values({
    workspaceId,
    addedBy: user.id,
    type: 'url',
    url,
    title,
    status: 'pending',
  })

  // Revalidate the workspace feed page so it updates automatically
  revalidatePath(`/workspaces/${workspaceId}`)
  
  return { success: true }
}
