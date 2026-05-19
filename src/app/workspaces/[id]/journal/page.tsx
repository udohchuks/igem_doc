'use client'

import { use, useState, useEffect, useRef } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  FileText, 
  CheckCircle, 
  Edit3, 
  Loader2, 
  UploadCloud, 
  Type, 
  AlertCircle,
  FileCheck,
  BookOpen,
  ArrowRight,
  Trash2,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Simple Markdown Renderer
function renderMarkdown(md: string) {
  if (!md) return null
  return md.split('\n').map((line, i) => {
    if (line.startsWith('### ')) {
      return <h4 key={i} className="text-emerald-400 font-bold text-base mt-4 mb-2 tracking-wide">{line.replace('### ', '')}</h4>
    }
    if (line.startsWith('## ')) {
      return <h3 key={i} className="text-white font-bold text-lg mt-5 mb-2.5 border-b border-white/[0.06] pb-1">{line.replace('## ', '')}</h3>
    }
    if (line.startsWith('# ')) {
      return <h2 key={i} className="text-white font-extrabold text-xl mt-6 mb-3">{line.replace('# ', '')}</h2>
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="text-gray-300 ml-4 list-disc text-sm py-1">{line.substring(2)}</li>
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />
    }
    // Bold matching
    let content: React.ReactNode = line
    if (line.includes('**')) {
      const parts = line.split('**')
      content = parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-white font-semibold">{part}</strong> : part)
    }
    return <p key={i} className="text-gray-300 text-sm leading-relaxed mb-2.5">{content}</p>
  })
}

export default function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = use(params)
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // YYYY-MM-DD
  })

  // State
  const [contributions, setContributions] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [aggregating, setAggregating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form State
  const [activeTab, setActiveTab] = useState<'type' | 'upload'>('type')
  const [typedContent, setTypedContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Aggregation Draft State
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [isEditingDraft, setIsEditingDraft] = useState(false)

  // Edit & Delete Contribution states
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingContribId, setEditingContribId] = useState<string | null>(null)
  const [editingContribText, setEditingContribText] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Fetch all contributions and reports
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/journal?workspaceId=${workspaceId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch journal data')
      setContributions(data.contributions || [])
      setReports(data.reports || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Fetch logged-in user details to check ownership
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [workspaceId])

  const handleDeleteContribution = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this contribution?")) return
    setActionLoadingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/journal?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete contribution')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleUpdateContribution = async (id: string) => {
    if (!editingContribText.trim()) return
    setActionLoadingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/journal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editingContribText })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update contribution')
      setEditingContribId(null)
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Helpers to get data for selected date
  const dateContributions = contributions.filter(c => c.date === selectedDate)
  const dateReport = reports.find(r => r.metadata?.journalDate === selectedDate)

  // Sync draft if report exists
  useEffect(() => {
    if (dateReport) {
      setDraftTitle(dateReport.title)
      setDraftContent(dateReport.fullText || '')
      setIsEditingDraft(false)
    } else {
      setDraftTitle('')
      setDraftContent('')
      setIsEditingDraft(false)
    }
  }, [selectedDate, dateReport])

  // Handle Date Navigation
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  // Handle Contribution Submit
  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      let res: Response
      if (activeTab === 'type') {
        if (!typedContent.trim()) throw new Error('Please enter some updates')
        res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            date: selectedDate,
            content: typedContent
          })
        })
      } else {
        if (!selectedFile) throw new Error('Please select a file to upload')
        const formData = new FormData()
        formData.append('workspaceId', workspaceId)
        formData.append('date', selectedDate)
        formData.append('file', selectedFile)
        
        res = await fetch('/api/journal', {
          method: 'POST',
          body: formData
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit contribution')

      // Reset forms
      setTypedContent('')
      setSelectedFile(null)
      
      // Refresh list
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Gemini Aggregation
  const handleAggregate = async () => {
    if (dateContributions.length === 0) return
    setError(null)
    setAggregating(true)
    try {
      const res = await fetch('/api/journal/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, date: selectedDate })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to aggregate contributions')
      
      setDraftTitle(data.title)
      setDraftContent(data.content)
      setIsEditingDraft(true) // Open edit mode to let them review
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAggregating(false)
    }
  }

  // Handle Publishing Report
  const handlePublishReport = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return
    setError(null)
    setPublishing(true)
    try {
      const res = await fetch('/api/journal/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          date: selectedDate,
          title: draftTitle,
          content: draftContent
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish report')

      setIsEditingDraft(false)
      await fetchData() // Refresh reports
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto flex flex-col h-full min-h-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Team Journal
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm">Log daily scientific contributions and synthesize reports with AI.</p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 shadow-lg shadow-black/20">
          <button 
            onClick={() => changeDateByDays(-1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none focus:ring-0 w-32 cursor-pointer text-xs sm:text-sm"
            />
          </div>

          <button 
            onClick={() => changeDateByDays(1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg active:scale-95 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-emerald-400/50">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-sm">Loading journal archive...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0 items-start">
          
          {/* Left Column: Contributions (Grid span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Form to submit contribution */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl shadow-emerald-500/2">
              <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Daily Contribution
              </h3>
              
              <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06] mb-4">
                <button
                  type="button"
                  onClick={() => { setActiveTab('type'); setError(null) }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${activeTab === 'type' ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Type update
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('upload'); setError(null) }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1.5 ${activeTab === 'upload' ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload document
                </button>
              </div>

              <form onSubmit={handleAddContribution} className="flex flex-col gap-4">
                {activeTab === 'type' ? (
                  <textarea
                    rows={4}
                    value={typedContent}
                    onChange={e => setTypedContent(e.target.value)}
                    placeholder="Describe what you worked on, results obtained, or any blockers..."
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition text-sm resize-none"
                    required
                  />
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setIsDragging(false)
                      if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0])
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.01]'} ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".txt,.md,.doc,.docx,.pdf"
                      onChange={e => {
                        if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
                      }}
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${selectedFile ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                      {selectedFile ? <FileCheck className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                    </div>
                    {selectedFile ? (
                      <>
                        <p className="text-white font-medium text-xs truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-medium text-xs">Drag & drop update file here</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">PDF, DOC, TXT, or MD (Max 10MB)</p>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (activeTab === 'upload' && !selectedFile)}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#0a0e14] font-semibold py-2 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-500/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Logging progress...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Submit Contribution
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contributions Archive List */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 shadow-xl shadow-emerald-500/2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-sm">Contributions for {selectedDate}</h3>
                <span className="text-[10px] bg-white/5 border border-white/[0.06] text-gray-400 px-2 py-0.5 rounded-full font-mono font-medium">
                  {dateContributions.length} items
                </span>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {dateContributions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/[0.04] rounded-xl">
                    <p className="text-gray-500 text-xs">No updates logged for this day yet.</p>
                  </div>
                ) : (
                  dateContributions.map(c => {
                    const isOwner = currentUser && c.userId === currentUser.id
                    const isEditing = editingContribId === c.id

                    return (
                      <div key={c.id} className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl hover:bg-white/[0.03] transition relative group">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-400 font-semibold text-xs truncate">{c.userName}</span>
                            {isOwner && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0 font-medium">You</span>
                            )}
                          </div>
                          <span className="text-gray-500 text-[10px] font-mono shrink-0">
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex flex-col gap-2 mt-2">
                            <textarea
                              rows={3}
                              value={editingContribText}
                              onChange={e => setEditingContribText(e.target.value)}
                              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-2.5 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition text-xs resize-none"
                              required
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingContribId(null)}
                                className="px-2 py-1 text-[10px] text-gray-400 hover:text-white bg-white/5 rounded-md active:scale-95 transition"
                                disabled={actionLoadingId === c.id}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateContribution(c.id)}
                                className="px-2.5 py-1 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md active:scale-95 transition flex items-center gap-1"
                                disabled={actionLoadingId === c.id}
                              >
                                {actionLoadingId === c.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-2.5 h-2.5" />
                                )}
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{c.content}</p>
                            
                            {c.fileName && (
                              <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                <FileText className="w-3 h-3" />
                                {c.fileName}
                              </div>
                            )}

                            {isOwner && (
                              <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-[#0a0e14]/90 backdrop-blur-md p-1 rounded-lg border border-white/[0.06] shadow-md">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingContribId(c.id)
                                    setEditingContribText(c.content)
                                  }}
                                  className="p-1 hover:text-white text-gray-400 rounded hover:bg-white/5 transition"
                                  title="Edit Contribution"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteContribution(c.id)}
                                  className="p-1 hover:text-red-400 text-gray-400 rounded hover:bg-white/5 transition"
                                  title="Delete Contribution"
                                  disabled={actionLoadingId === c.id}
                                >
                                  {actionLoadingId === c.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Aggregated Report (Grid span 3) */}
          <div className="lg:col-span-3 flex flex-col h-full">
            
            {/* If a report has been draft/edited or loaded */}
            {draftTitle || draftContent || isEditingDraft ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/2 flex flex-col h-full">
                
                {/* Header Actions */}
                <div className="p-4 border-b border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Daily AI Report</span>
                      <h3 className="text-white font-bold text-sm truncate max-w-[250px]">{draftTitle || "Draft Report"}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isEditingDraft ? (
                      <>
                        <button
                          onClick={() => {
                            if (dateReport) {
                              setDraftTitle(dateReport.title)
                              setDraftContent(dateReport.fullText || '')
                            }
                            setIsEditingDraft(false)
                          }}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 rounded-lg active:scale-95 transition"
                          disabled={publishing}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePublishReport}
                          className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-[#0a0e14] font-semibold rounded-lg active:scale-95 transition flex items-center gap-1"
                          disabled={publishing}
                        >
                          {publishing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Save & Publish
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditingDraft(true)}
                          className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg active:scale-95 transition flex items-center gap-1 border border-white/[0.04]"
                          disabled={aggregating}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Report
                        </button>
                        <button
                          onClick={handleAggregate}
                          className="px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg active:scale-95 transition flex items-center gap-1 border border-emerald-500/20"
                          disabled={aggregating}
                        >
                          {aggregating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          Re-aggregate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor / Report Content */}
                <div className="p-6 flex-1 min-h-[300px] overflow-y-auto custom-scrollbar">
                  {isEditingDraft ? (
                    <div className="flex flex-col gap-4 h-full">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Report Title</label>
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={e => setDraftTitle(e.target.value)}
                          placeholder="Automatic generated title..."
                          className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-emerald-500/50 transition"
                          required
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1.5 min-h-[250px]">
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Report Body (Markdown)</label>
                        <textarea
                          value={draftContent}
                          onChange={e => setDraftContent(e.target.value)}
                          placeholder="Markdown contents..."
                          className="w-full flex-1 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition text-sm font-mono resize-none leading-relaxed min-h-[250px]"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <div className="mb-6">
                        <span className="text-xs text-gray-500 font-mono font-medium">Published in knowledge graph</span>
                        <h2 className="text-white text-xl sm:text-2xl font-bold mt-1 tracking-tight">{draftTitle}</h2>
                      </div>
                      
                      <div className="space-y-1">
                        {renderMarkdown(draftContent)}
                      </div>

                      {dateReport && (
                        <div className="mt-8 pt-4 border-t border-white/[0.06] flex justify-between items-center text-xs text-gray-500">
                          <span>Ref: [Report Resource](file:///workspaces/{workspaceId}/feed)</span>
                          <span>Last updated: {new Date(dateReport.updatedAt || dateReport.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* State: No report generated for today yet */
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 shadow-xl shadow-emerald-500/2 text-center py-20 flex flex-col items-center justify-center gap-6 h-full">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/[0.06] flex items-center justify-center text-gray-400 group-hover:scale-110 transition duration-500">
                  <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">No Daily Report Synthesized</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                    Combine today's {dateContributions.length} team updates into a single cohesive, structured progress report. The output report is fully editable and becomes part of the knowledge map.
                  </p>
                </div>

                <button
                  onClick={handleAggregate}
                  disabled={dateContributions.length === 0 || aggregating}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#0a0e14] font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/20 text-sm"
                >
                  {aggregating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Synthesizing with Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Aggregate Day with Gemini
                    </>
                  )}
                </button>
                
                {dateContributions.length === 0 && (
                  <span className="text-[10px] text-red-400/80 mt-1 flex items-center gap-1">
                    ⚠️ Needs at least 1 team contribution to aggregate.
                  </span>
                )}
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  )
}
