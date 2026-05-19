import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { format } from 'date-fns'

export default async function TimelineViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))

  const timelineItems = allResources.sort((a, b) => {
    const dateA = a.datePublished?.getTime() || a.createdAt.getTime()
    const dateB = b.datePublished?.getTime() || b.createdAt.getTime()
    return dateB - dateA
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Timeline</h2>
        <p className="text-gray-500 text-sm">The historical development of your knowledge base.</p>
      </div>

      <div className="relative border-l-2 border-emerald-500/20 ml-4 space-y-8">
        {timelineItems.length === 0 ? (
          <div className="pl-6 text-gray-500">No resources available.</div>
        ) : (
          timelineItems.map((res) => {
            const displayDate = res.datePublished ? res.datePublished : res.createdAt
            
            return (
              <div key={res.id} className="relative pl-8">
                <div className="absolute w-4 h-4 bg-emerald-500 rounded-full -left-[9px] top-1.5 ring-4 ring-[#0a0e14]" />
                
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">
                      {format(new Date(displayDate), 'MMM yyyy')}
                      {!res.datePublished && <span className="ml-2 text-xs font-normal text-gray-600">(Added date)</span>}
                    </span>
                    <span className="text-xs text-gray-500 bg-white/[0.05] px-2 py-1 rounded border border-white/[0.06]">
                      {res.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                    <a href={res.url || '#'} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">
                      {res.title}
                    </a>
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4">
                    {res.summary}
                  </p>
                  
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {res.tags.map(tag => (
                        <span key={tag} className="text-xs bg-white/[0.05] text-gray-400 px-2 py-1 rounded border border-white/[0.06]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
