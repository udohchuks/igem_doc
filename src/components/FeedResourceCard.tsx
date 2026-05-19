import { formatDistanceToNow } from 'date-fns'
import { Link2, FileText, File as FileIcon, StickyNote, Video, Sparkles } from 'lucide-react'
import { RetryProcessButton } from '@/components/RetryProcessButton'
import { DeleteResourceButton } from '@/components/DeleteResourceButton'

interface ResourceProps {
  resource: {
    id: string
    title: string
    summary: string | null
    type: 'url' | 'pdf' | 'doc' | 'note' | 'video'
    tags: string[] | null
    status: 'pending' | 'processing' | 'ready' | 'error'
    createdAt: Date
    url: string | null
    metadata: any | null
  }
}

const typeConfig = {
  url: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Link2 },
  pdf: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: FileIcon },
  doc: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: FileText },
  note: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: StickyNote },
  video: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Video }
}

export function FeedResourceCard({ resource }: ResourceProps) {
  const config = typeConfig[resource.type]
  const Icon = config.icon

  return (
    <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-300 group hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/50 overflow-hidden">
      {/* Subtle background glow based on type */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full ${config.bg.replace('/10', '')}`} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <h3 className="font-bold text-lg sm:text-xl text-white leading-tight flex-1">
          {resource.url ? (
            <a href={resource.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
              {resource.title}
            </a>
          ) : (
            resource.title
          )}
        </h3>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 sm:py-1.5 rounded-full uppercase tracking-wider ${config.bg} ${config.color} ${config.border} border shadow-sm`}>
            <Icon className="w-3.5 h-3.5" />
            {resource.type}
          </div>
          <DeleteResourceButton resourceId={resource.id} />
        </div>
      </div>
      
      <div className="relative z-10">
        {resource.status === 'ready' ? (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
            {resource.summary}
          </p>
        ) : resource.status === 'error' ? (
          <RetryProcessButton resourceId={resource.id} />
        ) : (
          <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-4 italic bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10 w-fit">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI is processing this resource...
          </div>
        )}
      </div>

    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-4 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-2">
          {resource.tags?.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 px-2.5 py-1 rounded-md border border-white/[0.08] transition-colors cursor-default">
              {tag}
            </span>
          ))}
          {resource.tags && resource.tags.length > 4 && (
            <span className="text-xs text-gray-500 bg-transparent px-1 py-1">
              +{resource.tags.length - 4} more
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {resource.metadata && (resource.metadata as any).storageUrl && (
            <a href={(resource.metadata as any).storageUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline transition-colors">
              Open Document
            </a>
          )}
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  )
}
