import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { FeedResourceCard } from '@/components/FeedResourceCard'
import { Folder } from 'lucide-react'

export default async function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-8 sm:mb-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium tracking-wide">Workspace Files</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">All Resources</h2>
          <p className="text-gray-500 text-sm sm:text-base">A complete list of every document, URL, and note ingested into this workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {allResources.length === 0 ? (
          <div className="text-center py-20 sm:py-24 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-2xl px-6">
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No files found</h3>
            <p className="text-gray-500">Resources added to the Feed will appear here automatically.</p>
          </div>
        ) : (
          allResources.map(resource => (
            <FeedResourceCard key={resource.id} resource={resource} />
          ))
        )}
      </div>
    </div>
  )
}
