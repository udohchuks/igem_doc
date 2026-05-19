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

  const sortedTopics = Object.entries(topicsMap).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Topics</h2>
        <p className="text-gray-500 text-sm">Your resources clustered by AI-generated topics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedTopics.length === 0 ? (
           <div className="col-span-full text-center py-20 text-gray-500">No resources available to group.</div>
        ) : (
          sortedTopics.map(([topic, items]) => (
            <div key={topic} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 flex flex-col max-h-[600px]">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/[0.06]">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span className="text-emerald-400">#</span>
                  {topic}
                </h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {items.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {items.map(res => (
                  <div key={res.id} className="text-sm">
                    <a href={res.url || '#'} target="_blank" rel="noreferrer" className="font-medium text-white hover:text-emerald-400 hover:underline line-clamp-2 leading-tight mb-1 transition">
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
