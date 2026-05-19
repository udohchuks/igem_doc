import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { FeedResourceCard } from '@/components/FeedResourceCard'

export default async function FeedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const recentResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))
    .limit(50)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Feed</h2>
          <p className="text-gray-500 text-sm">The latest resources added to this workspace.</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-4 py-2 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20">
          + Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recentResources.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.03] border border-white/[0.06] rounded-xl border-dashed">
            <h3 className="text-lg font-medium text-white mb-2">No resources yet</h3>
            <p className="text-gray-500">Get started by adding your first URL or document.</p>
          </div>
        ) : (
          recentResources.map(resource => (
            <FeedResourceCard key={resource.id} resource={resource} />
          ))
        )}
      </div>
    </div>
  )
}
