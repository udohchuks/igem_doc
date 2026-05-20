'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutList, Tags, Clock, Network, Search, Menu, X, ChevronLeft, Folder, BookOpen, Activity } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutList, Tags, Clock, Network, Search, Folder, BookOpen, Activity
}

export function SidebarLayout({
  children,
  navItems,
  workspaceName,
  role
}: {
  children: React.ReactNode,
  navItems: { name: string; href: string; icon: string }[],
  workspaceName: string,
  role: string
  }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-[calc(100vh-57px)] sm:h-[calc(100vh-73px)] -m-4 sm:-m-6 relative">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-5 right-5 z-50 sm:hidden bg-emerald-500 text-[#0a0e14] w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition hover:bg-emerald-400"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-[#0d1117]/95 backdrop-blur-xl text-white flex flex-col
        transform transition-all duration-300 ease-in-out shadow-2xl sm:shadow-none
        ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
        ${desktopCollapsed ? 'sm:w-0 sm:-translate-x-full sm:opacity-0 sm:pointer-events-none border-r-0' : 'sm:relative sm:translate-x-0 sm:w-64 lg:w-72'}
        border-r border-white/[0.06]
      `}>
        <div className="h-14 sm:hidden" />
        <div className="p-4 sm:p-5 border-b border-white/[0.06] shrink-0">
          <Link href="/workspaces" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3 group">
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            All Workspaces
          </Link>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-lg sm:text-xl truncate text-white flex-1">{workspaceName}</h2>
            <button
              onClick={() => setDesktopCollapsed(true)}
              className="hidden sm:flex p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 active:scale-95 transition"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-wider">{role}</span>
          </div>
        </div>
        <nav className="flex-1 py-4 sm:py-6 overflow-y-auto px-3 sm:px-4">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon]
              const isActive = pathname === item.href
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden
                      ${isActive 
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm' 
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-r-full" />
                    )}
                    {Icon && (
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    )}
                    <span className="truncate group-hover:translate-x-0.5 transition-transform duration-200">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0a0e14]/80 backdrop-blur-sm z-30 sm:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      <main className="flex-1 bg-[#0a0e14] overflow-y-auto min-w-0 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />
        
        {desktopCollapsed && (
          <button
            onClick={() => setDesktopCollapsed(false)}
            className="hidden sm:flex fixed left-4 top-20 z-30 bg-[#0d1117]/90 border border-white/[0.08] p-2.5 rounded-xl text-emerald-400 hover:text-white shadow-xl hover:bg-[#161b22] active:scale-95 transition-all duration-200 animate-in fade-in zoom-in-75 duration-200"
            title="Expand Sidebar"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        )}

        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
