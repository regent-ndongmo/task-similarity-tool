import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { getInitials } from '@/utils/helpers'
import { cn } from '@/utils/helpers'
import {
  LayoutDashboard, Search, FolderOpen, FileText,
  BarChart3, History, LogOut, ChevronRight, Hexagon
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze',   icon: Search,          label: 'Analyser' },
  { to: '/import',    icon: FolderOpen,      label: 'Import fichier' },
  { to: '/tasks',     icon: FileText,        label: 'Mes tâches' },
  { to: '/reports',   icon: BarChart3,       label: 'Rapports' },
  { to: '/logs',      icon: History,         label: 'Historique' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col bg-obsidian-950 border-r border-obsidian-800/60 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-obsidian-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iris-600 to-iris-400 flex items-center justify-center glow-iris">
            <Hexagon size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white leading-none">TaskSimilar</p>
            <p className="font-mono text-[10px] text-obsidian-500 mt-0.5">v2.0 — ML Engine</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-all duration-150 group',
              isActive
                ? 'bg-iris-600/15 text-iris-300 border border-iris-500/20'
                : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-800/50 border border-transparent'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-iris-400' : 'text-obsidian-500 group-hover:text-obsidian-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-iris-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-obsidian-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-obsidian-900/60 border border-obsidian-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris-600/60 to-iris-400/60 flex items-center justify-center border border-iris-500/30 flex-shrink-0">
            <span className="font-display font-bold text-xs text-iris-200">
              {getInitials(user?.username)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-xs text-obsidian-200 truncate">{user?.username}</p>
            <p className="font-body text-[10px] text-obsidian-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-obsidian-600 hover:text-crimson-400 transition-colors p-1 rounded-lg hover:bg-crimson-500/10"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
