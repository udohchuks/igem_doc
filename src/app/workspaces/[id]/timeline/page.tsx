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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Timeline</h2>
        <p className="text-gray-500 text-xs sm:text-sm">The historical development of your knowledge base.</p>
      </div>

      <div className="relative border-l-2 border-emerald-500/20 ml-3 sm:ml-4 space-y-6 sm:space-y-8">
        {timelineItems.length === 0 ? (
          <div className="pl-6 text-gray-500 text-sm">No resources available.</div>
        ) : (
          timelineItems.map((res) => {
            const displayDate = res.datePublished ? res.datePublished : res.createdAt
            
            return (
              <div key={res.id} className="relative pl-6 sm:pl-8">
                <div className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full -left-[9px] top-1.5 ring-4 ring-[#0a0e14]" />
                
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-white/[0.12] transition">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 tracking-wide uppercase">
                      {format(new Date(displayDate), 'MMM yyyy')}
                      {!res.datePublished && <span className="ml-2 text-xs font-normal text-gray-600">(Added date)</span>}
                    </span>
                    <span className="text-xs text-gray-500 bg-white/[0.05] px-2 py-1 rounded border border-white/[0.06] self-start">
                      {res.type}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-tight">
                    <a href={res.url || '#'} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">
                      {res.title}
                    </a>
                  </h3>
                  
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                    {res.summary}
                  </p>
                  
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {res.tags.map(tag => (
                        <span key={tag} className="text-xs bg-white/[0.05] text-gray-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-white/[0.06]">
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
