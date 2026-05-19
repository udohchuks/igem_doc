import { db } from '@/lib/db/client'
import { resources, activityLog } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { FeedResourceCard } from '@/components/FeedResourceCard'
import { AddResourceModal } from '@/components/AddResourceModal'
import { SearchChatView } from '@/components/SearchChatView'
import { Activity } from 'lucide-react'

export default async function FeedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params

  const recentResourcesPromise = db.select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))
    .limit(50)

  // Fetch actual activity log and join with resources to get the title
  const activityLogPromise = db.select({
    id: activityLog.id,
    action: activityLog.action,
    createdAt: activityLog.createdAt,
    resourceTitle: resources.title
  })
  .from(activityLog)
  .leftJoin(resources, eq(activityLog.resourceId, resources.id))
  .where(eq(activityLog.workspaceId, workspaceId))
  .orderBy(desc(activityLog.createdAt))
  .limit(10)

  const [recentResources, recentActivities] = await Promise.all([recentResourcesPromise, activityLogPromise])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div className="lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Knowledge Feed</h2>
            <p className="text-gray-500 text-xs sm:text-sm">Latest resources added to this workspace.</p>
          </div>
          <AddResourceModal workspaceId={workspaceId}>
            <button className="self-start sm:self-auto bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold px-4 py-2.5 sm:py-2 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.97]">
              + Add Resource
            </button>
          </AddResourceModal>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {recentResources.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white/[0.03] border border-dashed border-white/[0.06] rounded-xl sm:rounded-2xl px-6">
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">No resources yet</h3>
              <p className="text-gray-500 text-sm">Get started by adding your first URL or document.</p>
            </div>
          ) : (
            recentResources.map(resource => (
              <FeedResourceCard key={resource.id} resource={resource} />
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-1 flex flex-col">
        <SearchChatView workspaceId={workspaceId} />

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl shadow-emerald-500/5 flex-1">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Activity Log
          </h3>
          <div className="space-y-4">
            {recentActivities.map(activity => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-gray-300">
                    <span className="text-white font-medium">A member</span> {activity.action.replace('_', ' ')}{' '}
                    {activity.resourceTitle && <span className="text-emerald-400">{activity.resourceTitle.slice(0,30)}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.createdAt?.toLocaleDateString()} {activity.createdAt?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
