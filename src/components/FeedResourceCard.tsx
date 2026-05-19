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
  url: 'bg-blue-100 text-blue-800',
  pdf: 'bg-red-100 text-red-800',
  doc: 'bg-blue-100 text-blue-800',
  note: 'bg-yellow-100 text-yellow-800',
  video: 'bg-purple-100 text-purple-800'
}

export function FeedResourceCard({ resource }: ResourceProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-900 leading-tight">
          {resource.url ? (
            <a href={resource.url} target="_blank" rel="noreferrer" className="hover:underline">
              {resource.title}
            </a>
          ) : (
            resource.title
          )}
        </h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${typeColors[resource.type]}`}>
          {resource.type}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {resource.status === 'ready' 
          ? resource.summary 
          : <span className="italic text-gray-400">AI is processing this resource...</span>
        }
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {resource.tags?.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
          {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
