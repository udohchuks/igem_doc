'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Link as LinkIcon, FileText, Type, Loader2, UploadCloud } from 'lucide-react'

type TabType = 'link' | 'upload' | 'note'

export function AddResourceModal({ workspaceId, children }: { workspaceId: string, children: React.ReactNode }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('link')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // File drag & drop state
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setIsLoading(false)
    setError(null)
    setSelectedFile(null)
    setIsDragging(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetState()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    
    try {
      let res: Response
      
      if (activeTab === 'link') {
        const url = formData.get('url') as string
        res = await fetch('/api/ingest/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, title, workspaceId })
        })
      } else if (activeTab === 'upload') {
        if (!selectedFile) throw new Error('Please select a file to upload')
        const uploadData = new FormData()
        uploadData.append('file', selectedFile)
        uploadData.append('workspaceId', workspaceId)
        if (title) uploadData.append('title', title)
        
        res = await fetch('/api/ingest/document', {
          method: 'POST',
          body: uploadData
        })
      } else {
        const text = formData.get('text') as string
        res = await fetch('/api/ingest/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, title, workspaceId })
        })
      }

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add resource')
      }

      // Trigger the background AI processing pipeline asynchronously
      fetch('/api/process', { method: 'POST' }).catch(console.error)

      router.refresh()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0e14] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <LinkIcon className="w-4 h-4 text-[#0a0e14]" />
                </div>
                Add Resource
              </h3>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-2 rounded-xl active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 pt-6">
              <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] mb-6">
                <TabButton active={activeTab === 'link'} onClick={() => { setActiveTab('link'); resetState() }} icon={<LinkIcon className="w-4 h-4" />} label="Link / Video" />
                <TabButton active={activeTab === 'upload'} onClick={() => { setActiveTab('upload'); resetState() }} icon={<FileText className="w-4 h-4" />} label="PDF / Doc" />
                <TabButton active={activeTab === 'note'} onClick={() => { setActiveTab('note'); resetState() }} icon={<Type className="w-4 h-4" />} label="Raw Text" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Title (Optional)</label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder={activeTab === 'link' ? "Auto-detects if left blank..." : "Document title..."}
                  className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.04] transition"
                />
              </div>

              {activeTab === 'link' && (
                <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-300">
                  <label className="text-sm font-medium text-gray-300">URL <span className="text-red-400">*</span></label>
                  <input 
                    type="url" 
                    name="url" 
                    required
                    placeholder="https://youtube.com/... or https://nature.com/..."
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.04] transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports any web page, research paper link, or YouTube video.</p>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-300">
                  <label className="text-sm font-medium text-gray-300">File <span className="text-red-400">*</span></label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]'} ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setSelectedFile(e.dataTransfer.files[0])
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0])
                        }
                      }}
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${selectedFile ? 'bg-emerald-500 text-[#0a0e14]' : 'bg-white/[0.05] text-gray-400'}`}>
                      {selectedFile ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {selectedFile ? (
                      <>
                        <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                        <p className="text-gray-500 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-gray-500 text-xs">PDF, DOC, or TXT (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'note' && (
                <div className="space-y-1.5 animate-in slide-in-from-right-4 duration-300">
                  <label className="text-sm font-medium text-gray-300">Content <span className="text-red-400">*</span></label>
                  <textarea 
                    name="text" 
                    required
                    rows={5}
                    placeholder="Paste your raw text, transcript, or markdown notes here..."
                    className="w-full bg-white/[0.02] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.04] transition resize-none"
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || (activeTab === 'upload' && !selectedFile)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-[#0a0e14] font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Add to Workspace'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white/[0.06] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'}`}
    >
      {icon}
      {label}
    </button>
  )
}

