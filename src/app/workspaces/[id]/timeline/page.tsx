import { db } from '@/lib/db/client'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { format } from 'date-fns'

export default async function TimelineViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const allResources = await db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    // We order by datePublished first (using createdAt as fallback via JS below)
    .orderBy(desc(resources.createdAt))

  // Sort logically by publication date or created date
  const timelineItems = allResources.sort((a, b) => {
    const dateA = a.datePublished?.getTime() || a.createdAt.getTime()
    const dateB = b.datePublished?.getTime() || b.createdAt.getTime()
    return dateB - dateA
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900">Timeline</h2>
        <p className="text-gray-500">The historical development of your knowledge base.</p>
      </div>

      <div className="relative border-l-2 border-blue-200 ml-4 space-y-8">
        {timelineItems.length === 0 ? (
          <div className="pl-6 text-gray-500">No resources available.</div>
        ) : (
          timelineItems.map((res, i) => {
            const displayDate = res.datePublished ? res.datePublished : res.createdAt
            
            return (
              <div key={res.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1.5 ring-4 ring-white" />
                
                <div className="bg-white p-5 rounded-lg border shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-blue-600 tracking-wide uppercase">
                      {format(new Date(displayDate), 'MMM yyyy')}
                      {!res.datePublished && <span className="ml-2 text-xs font-normal text-gray-400">(Added date)</span>}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {res.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    <a href={res.url || '#'} target="_blank" rel="noreferrer" className="hover:underline">
                      {res.title}
                    </a>
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {res.summary}
                  </p>
                  
                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {res.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-50 border text-gray-500 px-2 py-1 rounded">
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
