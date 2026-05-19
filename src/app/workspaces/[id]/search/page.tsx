'use client'

import { useState } from 'react'
import { Search, MessageSquare, Send } from 'lucide-react'

export default function SearchViewPage({ params }: { params: Promise<{ id: string }> }) {
  const [mode, setMode] = useState<'search' | 'chat'>('search')
  const [query, setQuery] = useState('')

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Search & Synthesis</h2>
        <p className="text-gray-500 text-sm">Ask questions or search your knowledge base.</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col flex-1 max-h-[700px]">
        <div className="border-b border-white/[0.06] p-4 bg-white/[0.02]">
          <div className="flex bg-white/[0.05] rounded-xl p-1 w-64 mb-4">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-lg transition ${mode === 'search' ? 'bg-emerald-500 text-[#0a0e14] shadow' : 'text-gray-500 hover:text-white'}`}
              onClick={() => setMode('search')}
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-lg transition ${mode === 'chat' ? 'bg-emerald-500 text-[#0a0e14] shadow' : 'text-gray-500 hover:text-white'}`}
              onClick={() => setMode('chat')}
            >
              <MessageSquare className="w-4 h-4" /> Ask AI
            </button>
          </div>

          <form className="relative" onSubmit={(e) => { e.preventDefault(); }}>
            <input 
              type="text" 
              placeholder={mode === 'search' ? "Search by keyword or meaning..." : "Ask a question about your resources..."}
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition text-sm"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-2 p-2 bg-emerald-500 text-[#0a0e14] rounded-lg hover:bg-emerald-400 transition">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white/[0.01] flex flex-col items-center justify-center text-gray-600">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p>Enter a query above to see results.</p>
          <p className="text-sm mt-2">(Hybrid Search and AI RAG will be implemented in Phase 4)</p>
        </div>
      </div>
    </div>
  )
}
