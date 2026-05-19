"use client"

import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'

export function RetryProcessButton({ resourceId }: { resourceId: string }) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await fetch(`/api/resource/${resourceId}/retry`, { method: 'POST' })
      // Trigger background process
      fetch('/api/process', { method: 'POST' })
      
      // Refresh page to show updated status
      window.location.reload()
    } catch (e) {
      console.error(e)
      setIsRetrying(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-red-400/80 text-sm mb-4 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10 w-fit">
      <AlertCircle className="w-4 h-4" />
      Processing failed.
      <button 
        onClick={handleRetry} 
        disabled={isRetrying}
        className="ml-2 flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  )
}
