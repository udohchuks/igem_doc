'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  RefreshCw, Trash2, Cpu, CheckCircle2, XCircle, 
  AlertTriangle, Clock, ArrowRight, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react'

interface LogEntry {
  id: string
  service: string
  endpoint: string
  status: string
  latencyMs: number | null
  tokensUsed: number | null
  errorMessage: string | null
  createdAt: Date
}

interface StatsGroup {
  service: string
  status: string
  count: number
  avgLatency: number | null
}

interface MonitorClientProps {
  workspaceId: string
  initialLogs: LogEntry[]
  initialStats: StatsGroup[]
}

export function MonitorClient({ workspaceId, initialLogs, initialStats }: MonitorClientProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [filterService, setFilterService] = useState<'all' | 'gemini' | 'voyage'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  // Calculations
  const totalCalls = initialStats.reduce((acc, curr) => acc + curr.count, 0)
  const errorCalls = initialStats.filter(s => s.status === 'error').reduce((acc, curr) => acc + curr.count, 0)
  const successCalls = initialStats.filter(s => s.status === 'success').reduce((acc, curr) => acc + curr.count, 0)
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100

  // Latency calculation
  const totalLatencySum = initialStats.reduce((acc, curr) => acc + (curr.avgLatency || 0) * curr.count, 0)
  const avgLatency = totalCalls > 0 ? Math.round(totalLatencySum / totalCalls) : 0

  // Service specific stats
  const geminiCalls = initialStats.filter(s => s.service === 'gemini').reduce((acc, curr) => acc + curr.count, 0)
  const geminiErrors = initialStats.filter(s => s.service === 'gemini' && s.status === 'error').reduce((acc, curr) => acc + curr.count, 0)
  const geminiSuccessRate = geminiCalls > 0 ? Math.round(((geminiCalls - geminiErrors) / geminiCalls) * 100) : 100

  const voyageCalls = initialStats.filter(s => s.service === 'voyage').reduce((acc, curr) => acc + curr.count, 0)
  const voyageErrors = initialStats.filter(s => s.service === 'voyage' && s.status === 'error').reduce((acc, curr) => acc + curr.count, 0)
  const voyageSuccessRate = voyageCalls > 0 ? Math.round(((voyageCalls - voyageErrors) / voyageCalls) * 100) : 100

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all API logs for this workspace?')) return
    setIsClearing(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/monitor/clear`, {
        method: 'POST'
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsClearing(false)
    }
  }

  // Filter logs
  const filteredLogs = initialLogs.filter(log => {
    const matchService = filterService === 'all' || log.service.toLowerCase() === filterService
    const matchStatus = filterStatus === 'all' || log.status.toLowerCase() === filterStatus
    return matchService && matchStatus
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            API & Telemetry Monitor
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Monitor model usage, request latencies, and diagnose free-tier API rate limits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-white disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleClearLogs}
            disabled={isClearing || totalCalls === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success Rate */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Overall Health</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{successRate}%</div>
          <div className="text-xs text-gray-400 mt-1">Success rate over all calls</div>
        </div>

        {/* Total Calls */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Total API Requests</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{totalCalls}</div>
          <div className="text-xs text-gray-400 mt-1">All logged interactions</div>
        </div>

        {/* Errors / Quota Limits */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Failed Requests</span>
            {errorCalls > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className={`text-3xl font-black tracking-tight ${errorCalls > 0 ? 'text-amber-400' : 'text-white'}`}>{errorCalls}</div>
          <div className="text-xs text-gray-400 mt-1">Including 429 quota exceptions</div>
        </div>

        {/* Average Latency */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Average Latency</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{avgLatency > 0 ? `${(avgLatency / 1000).toFixed(2)}s` : '0.00s'}</div>
          <div className="text-xs text-gray-400 mt-1">AI response turnaround time</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Service Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
              <h3 className="font-bold text-white text-sm sm:text-base">Google Gemini AI</h3>
            </div>
            <span className="text-xs font-semibold text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
              gemini-3.1-flash-lite
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Calls</div>
              <div className="text-lg font-bold text-white">{geminiCalls}</div>
            </div>
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Health</div>
              <div className={`text-lg font-bold ${geminiSuccessRate > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{geminiSuccessRate}%</div>
            </div>
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Errors</div>
              <div className={`text-lg font-bold ${geminiErrors > 0 ? 'text-red-400' : 'text-gray-500'}`}>{geminiErrors}</div>
            </div>
          </div>
          <div className="text-[11px] text-gray-500">
            Used for summarizing, auto-tagging resources, and synthesis of daily progress reports.
          </div>
        </div>

        {/* Voyage Service Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.6)]" />
              <h3 className="font-bold text-white text-sm sm:text-base">Voyage AI Vectors</h3>
            </div>
            <span className="text-xs font-semibold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              voyage-4-lite
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Calls</div>
              <div className="text-lg font-bold text-white">{voyageCalls}</div>
            </div>
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Health</div>
              <div className={`text-lg font-bold ${voyageSuccessRate > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{voyageSuccessRate}%</div>
            </div>
            <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-xl">
              <div className="text-xs text-gray-500 mb-0.5">Errors</div>
              <div className={`text-lg font-bold ${voyageErrors > 0 ? 'text-red-400' : 'text-gray-500'}`}>{voyageErrors}</div>
            </div>
          </div>
          <div className="text-[11px] text-gray-500">
            Used for building 1024-dimensional semantic search vectors and reciprocal rank fusion hybrid queries.
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-[#0b0f19] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-bold text-white text-sm sm:text-base">Recent Request Logs</h3>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value as any)}
              className="bg-white/[0.04] border border-white/[0.08] text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500/50 transition cursor-pointer"
            >
              <option value="all">All Services</option>
              <option value="gemini">Gemini</option>
              <option value="voyage">Voyage AI</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-white/[0.04] border border-white/[0.08] text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500/50 transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              No logs found matching selection.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01] text-gray-500 font-medium">
                  <th className="p-4">Service</th>
                  <th className="p-4">Endpoint</th>
                  <th className="p-4">Latency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const isError = log.status === 'error'
                  
                  return (
                    <>
                      <tr 
                        key={log.id} 
                        className={`hover:bg-white/[0.02] transition cursor-pointer ${isExpanded ? 'bg-white/[0.01]' : ''}`}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                            log.service === 'gemini' 
                              ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20' 
                              : 'text-teal-400 bg-teal-500/10 border border-teal-500/20'
                          }`}>
                            {log.service}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-gray-300">{log.endpoint}</td>
                        <td className="p-4 font-medium text-gray-400">
                          {log.latencyMs ? `${log.latencyMs} ms` : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 font-semibold ${isError ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isError ? (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          {isError && (
                            <button className="text-gray-500 hover:text-white transition">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Expanded error row */}
                      {isExpanded && isError && (
                        <tr className="bg-red-950/20 border-l-2 border-red-500">
                          <td colSpan={6} className="p-4 bg-[#0a0c10]/40">
                            <div className="space-y-2">
                              <div className="text-red-400 font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                Error Details
                              </div>
                              <pre className="text-xs font-mono text-gray-300 bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48">
                                {log.errorMessage || 'No error message provided'}
                              </pre>
                              <div className="text-gray-500 text-[10px]">
                                Troubleshooting tip: Standard free-tier requests allow 15 RPM for Gemini and 3 RPM for Voyage. If you receive "Too Many Requests (429)", pause actions for 60 seconds.
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
