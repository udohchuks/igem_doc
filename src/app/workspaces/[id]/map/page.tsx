import { db } from '@/lib/db/client'
import { resources, connections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MapGraph } from '@/components/ForceGraph'

export default async function MapViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))

  const resourceIds = allResources.map(r => r.id)
  
  let allLinks: any[] = []
  if (resourceIds.length > 0) {
    const fetchedLinks = await db.select()
      .from(connections)
    allLinks = fetchedLinks.filter(l => resourceIds.includes(l.sourceId))
  }

  const nodes = allResources.map(r => ({
    id: r.id,
    title: r.title,
    group: r.tags && r.tags.length > 0 ? r.tags[0] : 'untagged',
    type: r.type,
    summary: r.summary || undefined,
    tags: r.tags || [],
    createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
    url: r.url || (r.metadata as any)?.storageUrl || undefined
  }))

  const links = allLinks.map(l => ({
    source: l.sourceId,
    target: l.targetId,
    type: l.type
  })).filter(link => {
    // Only include links where both source and target are present in this workspace
    return resourceIds.includes(link.source) && resourceIds.includes(link.target)
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col min-h-0">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Knowledge Map</h2>
        <p className="text-gray-500 text-xs sm:text-sm">Visualizing AI-detected semantic relationships.</p>
      </div>
      
      <MapGraph nodes={nodes} links={links} workspaceId={workspaceId} />
    </div>
  )
}
