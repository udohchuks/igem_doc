import { db } from '@/lib/db/client'
import { resources, connections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { MapGraph } from '@/components/ForceGraph'

export default async function MapViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))

  // Fetch connections where source is in this workspace
  // (Assuming auto connections are intra-workspace)
  const resourceIds = allResources.map(r => r.id)
  
  let allLinks: any[] = []
  if (resourceIds.length > 0) {
    const fetchedLinks = await db.select()
      .from(connections)
      
    // Filter in JS for simplicity (assuming small scale for now)
    allLinks = fetchedLinks.filter(l => resourceIds.includes(l.sourceId))
  }

  const nodes = allResources.map(r => ({
    id: r.id,
    title: r.title,
    group: r.tags && r.tags.length > 0 ? r.tags[0] : 'untagged',
    val: 1
  }))

  const links = allLinks.map(l => ({
    source: l.sourceId,
    target: l.targetId,
    type: l.type
  }))

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Map</h2>
        <p className="text-gray-500">Visualizing AI-detected semantic relationships.</p>
      </div>
      
      <MapGraph nodes={nodes} links={links} />
    </div>
  )
}
