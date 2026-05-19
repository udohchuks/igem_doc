import { formatDistanceToNow } from 'date-fns'

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
  }
}

const typeColors = {
  url: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pdf: 'bg-red-500/10 text-red-400 border border-red-500/20',
  doc: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  note: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  video: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
}

export function FeedResourceCard({ resource }: ResourceProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-white leading-tight">
          {resource.url ? (
            <a href={resource.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">
              {resource.title}
            </a>
          ) : (
            resource.title
          )}
        </h3>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${typeColors[resource.type]}`}>
          {resource.type}
        </span>
      </div>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {resource.status === 'ready' 
          ? resource.summary 
          : <span className="italic text-gray-600">AI is processing this resource...</span>
        }
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-2">
          {resource.tags?.map(tag => (
            <span key={tag} className="text-xs bg-white/[0.05] text-gray-400 px-2 py-1 rounded-md border border-white/[0.06]">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-gray-600 whitespace-nowrap ml-4">
          {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
