"use client"

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function DeleteResourceButton({ resourceId }: { resourceId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resource? This will remove it from the database and Google Drive permanently.')) {
      return
    }

    setIsDeleting(true)
    try {
      await fetch(`/api/resource/${resourceId}`, { method: 'DELETE' })
      // Refresh the page to remove the resource from the list
      window.location.reload()
    } catch (e) {
      console.error(e)
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-white/[0.04] transition-colors disabled:opacity-50"
      title="Delete resource"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
