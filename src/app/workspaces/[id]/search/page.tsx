'use client'

import { useState } from 'react'
import { Search, MessageSquare, Send } from 'lucide-react'

export default function SearchViewPage({ params }: { params: Promise<{ id: string }> }) {
  const [mode, setMode] = useState<'search' | 'chat'>('search')
  const [query, setQuery] = useState('')

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Search & Synthesis</h2>
        <p className="text-gray-500">Ask questions or search your knowledge base.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col flex-1 max-h-[700px]">
        {/* Mode Toggle & Input */}
        <div className="border-b p-4 bg-gray-50">
          <div className="flex bg-gray-200 rounded-lg p-1 w-64 mb-4">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition ${mode === 'search' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setMode('search')}
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition ${mode === 'chat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setMode('chat')}
            >
              <MessageSquare className="w-4 h-4" /> Ask AI
            </button>
          </div>

          <form className="relative" onSubmit={(e) => { e.preventDefault(); /* Trigger search */ }}>
            <input 
              type="text" 
              placeholder={mode === 'search' ? "Search by keyword or meaning..." : "Ask a question about your resources..."}
              className="w-full pl-4 pr-12 py-3 rounded-lg border-gray-300 border focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p>Enter a query above to see results.</p>
          <p className="text-sm mt-2">(Hybrid Search and AI RAG will be implemented in Phase 4)</p>
        </div>
      </div>
    </div>
  )
}
