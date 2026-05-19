import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { FeedResourceCard } from '@/components/FeedResourceCard'

export default async function TopicViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))

  // Group by tags
  const topicsMap: Record<string, typeof allResources> = {}
  
  allResources.forEach(res => {
    if (!res.tags || res.tags.length === 0) {
      if (!topicsMap['Untagged']) topicsMap['Untagged'] = []
      topicsMap['Untagged'].push(res)
    } else {
      res.tags.forEach(tag => {
        if (!topicsMap[tag]) topicsMap[tag] = []
        topicsMap[tag].push(res)
      })
    }
  })

  // Sort topics by number of resources
  const sortedTopics = Object.entries(topicsMap).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Topics</h2>
        <p className="text-gray-500">Your resources clustered by AI-generated topics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {sortedTopics.length === 0 ? (
           <div className="col-span-full text-center py-20 text-gray-500">No resources available to group.</div>
        ) : (
          sortedTopics.map(([topic, items]) => (
            <div key={topic} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col max-h-[600px]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span className="text-blue-600">#</span>
                  {topic}
                </h3>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {items.map(res => (
                  <div key={res.id} className="text-sm">
                    <a href={res.url || '#'} target="_blank" rel="noreferrer" className="font-medium text-gray-900 hover:text-blue-600 hover:underline line-clamp-2 leading-tight mb-1">
                      {res.title}
                    </a>
                    <p className="text-xs text-gray-500 line-clamp-2">{res.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
