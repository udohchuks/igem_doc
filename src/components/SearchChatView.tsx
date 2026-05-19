'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MessageSquare, ArrowRight, Loader2, Link as LinkIcon, FileText, Type } from 'lucide-react'

export function SearchChatView({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'search' | 'chat'>('search')
  
  // Search state
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([])
  const [isChatting, setIsChatting] = useState(false)
  const [citations, setCitations] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    if (mode === 'search') {
      setIsSearching(true)
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, workspaceId })
        })
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    } else {
      // Chat mode
      const newMessages = [...chatMessages, { role: 'user', content: query }]
      setChatMessages(newMessages)
      setQuery('')
      setIsChatting(true)
      setCitations([])

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, workspaceId })
        })

        if (!res.body) throw new Error('No body')
        
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        
        let assistantMessage = ''
        
        // Add empty assistant message
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n\n')
          
          for (const line of lines) {
            if (!line) continue
            try {
              const data = JSON.parse(line)
              if (data.type === 'meta') {
                setCitations(data.citations || [])
              } else if (data.type === 'chunk') {
                assistantMessage += data.text
                setChatMessages(prev => {
                  const newArr = [...prev]
                  newArr[newArr.length - 1].content = assistantMessage
                  return newArr
                })
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsChatting(false)
      }
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden mt-8 mb-8 shadow-xl shadow-emerald-500/5 flex flex-col h-[500px]">
      
      {/* Mode Toggle & Header */}
      <div className="flex border-b border-white/[0.06] bg-black/20 p-2">
        <button 
          onClick={() => setMode('search')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'search' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Search className="w-4 h-4" /> Hybrid Search
        </button>
        <button 
          onClick={() => setMode('chat')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${mode === 'chat' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <MessageSquare className="w-4 h-4" /> AI Chat
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {mode === 'search' ? (
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-emerald-400/50">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm">Semantic + Keyword search running...</p>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(result => (
                <div key={result.id} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl hover:bg-white/[0.04] transition cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    {result.type === 'url' ? <LinkIcon className="w-4 h-4 text-emerald-400" /> : result.type === 'note' ? <Type className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-cyan-400" />}
                    <h4 className="text-white font-semibold line-clamp-1">{result.title}</h4>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">{result.summary}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-white/[0.05] px-2 py-1 rounded-md">Score: {result.rrf_score.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Search className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-sm">Search across all resources in this workspace.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <MessageSquare className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-sm">Ask a question about your resources.</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-cyan-500 text-[#0a0e14] rounded-br-none' : 'bg-white/[0.05] text-gray-200 border border-white/[0.05] rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    
                    {msg.role === 'assistant' && citations.length > 0 && i === chatMessages.length - 1 && !isChatting && (
                      <div className="mt-4 pt-4 border-t border-white/[0.1]">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {citations.map(c => (
                            <a key={c.id} href={c.url || '#'} target="_blank" rel="noreferrer" className="text-xs bg-white/[0.05] hover:bg-white/[0.1] transition px-2 py-1 rounded border border-white/[0.05] flex items-center gap-1 text-cyan-400">
                              [{c.index}] {c.title.slice(0, 20)}...
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isChatting && <div className="text-cyan-400 flex items-center gap-2 text-sm ml-2"><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={mode === 'search' ? "Search resources..." : "Ask a question..."}
            className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition text-sm"
          />
          <button 
            type="submit"
            disabled={!query.trim() || isSearching || isChatting}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-white/[0.05] hover:bg-white/[0.1] rounded-lg flex items-center justify-center transition disabled:opacity-50"
          >
            <ArrowRight className={`w-4 h-4 ${mode === 'search' ? 'text-emerald-400' : 'text-cyan-400'}`} />
          </button>
        </form>
      </div>

    </div>
  )
}
