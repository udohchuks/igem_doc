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
          <h2 className="text-2xl font-bold text-gray-900">Feed</h2>
          <p className="text-gray-500">The latest resources added to this workspace.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-blue-700">
          + Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {recentResources.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
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
