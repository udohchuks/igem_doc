'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutList, Tags, Clock, Network, Search, Menu, X } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutList, Tags, Clock, Network, Search
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

  return (
    <div className="flex h-[calc(100vh-57px)] sm:h-[calc(100vh-73px)] -m-4 sm:-m-6 relative">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-5 right-5 z-50 sm:hidden bg-emerald-500 text-[#0a0e14] w-12 h-12 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition hover:bg-emerald-400"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 sm:w-56 lg:w-64 bg-[#0d1117] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        sm:relative sm:translate-x-0
        border-r border-white/[0.06]
      `}>
        <div className="h-14 sm:hidden" />
        <div className="p-3 sm:p-4 border-b border-white/[0.06]">
          <Link href="/workspaces" className="block hover:opacity-80 transition">
            <h2 className="font-bold text-base sm:text-lg truncate">{workspaceName}</h2>
          </Link>
          <span className="text-xs text-gray-500 capitalize">{role}</span>
        </div>
        <nav className="flex-1 py-2 sm:py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-2 sm:px-3">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.06] transition text-sm font-medium text-gray-400 hover:text-white"
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 bg-[#0a0e14] overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
