import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { workspaces, workspaceMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Fetch workspaces the user is a member of
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
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Workspaces</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {userWorkspaces.map(ws => (
          <a key={ws.id} href={`/workspaces/${ws.id}`} className="block p-6 bg-white border rounded-lg shadow hover:bg-gray-50 transition">
            <h3 className="font-semibold text-lg">{ws.name}</h3>
            <span className="text-sm text-gray-500 uppercase tracking-wide">{ws.role}</span>
          </a>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow max-w-md border">
        <h3 className="text-lg font-bold mb-4">Create New Workspace</h3>
        <form action="/api/workspaces" method="post" className="flex flex-col gap-4">
          <input 
            type="text" 
            name="name" 
            placeholder="Workspace Name" 
            required
            className="border rounded px-4 py-2"
          />
          <button type="submit" className="bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700">
            Create Workspace
          </button>
        </form>
      </div>
    </div>
  )
}
