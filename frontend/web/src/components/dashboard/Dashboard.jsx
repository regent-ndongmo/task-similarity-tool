import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logsAPI } from '@/services/api'
import { useAuth } from '@/store/authStore'
import { StatCard, Card, Skeleton, Badge, Button } from '@/components/ui'
import { formatDate, formatDateShort, getLevelConfig, formatScore, truncate } from '@/utils/helpers'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Search, FolderOpen, BarChart3, History, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, Zap
} from 'lucide-react'

const COLORS = { duplicates: '#ef4444', strong: '#f97316', moderate: '#f59e0b', clean: '#10b981' }

export default function Dashboard() {
  const { user } = useAuth()
  const nav      = useNavigate()
  const [stats, setStats] = useState(null)
  const [logs,  setLogs]  = useState([])
  const [load,  setLoad]  = useState(true)

  useEffect(() => {
    Promise.all([
      logsAPI.stats({ trend_days: 14 }),
      logsAPI.list({ limit: 5 }),
    ]).then(([s, l]) => {
      setStats(s.data)
      setLogs(l.data.logs)
    }).finally(() => setLoad(false))
  }, [])

  const g = stats?.global_stats

  const pieData = g ? [
    { name: 'Doublons', value: g.total_duplicates_found },
    { name: 'Forte', value: g.total_strong_matches },
    { name: 'Modérée', value: g.total_moderate_matches },
    { name: 'Uniques', value: g.total_clean },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            Bonjour, <span className="text-gradient">{user?.username}</span> 👋
          </h1>
          <p className="text-sm text-obsidian-500 mt-1 font-body">
            Vue d'ensemble de vos analyses de similarité
          </p>
        </div>
        <Button onClick={() => nav('/analyze')} icon={Search}>
          Nouvelle analyse
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Search,     label: 'Analyser une tâche',   sub: 'Tâche unique',         to: '/analyze',  color: 'from-iris-600 to-iris-400'   },
          { icon: FolderOpen, label: 'Import & analyse',     sub: 'CSV / Excel',           to: '/import',   color: 'from-iris-700 to-iris-500'   },
          { icon: BarChart3,  label: 'Générer un rapport',   sub: 'PDF ou Excel',          to: '/reports',  color: 'from-obsidian-800 to-obsidian-700' },
          { icon: History,    label: 'Historique',           sub: 'Logs & statistiques',   to: '/logs',     color: 'from-obsidian-800 to-obsidian-700' },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <button
            key={to}
            onClick={() => nav(to)}
            className={`group p-4 rounded-2xl border border-obsidian-700/50 bg-gradient-to-br ${color}
                        hover:border-iris-500/40 hover:shadow-card-hover transition-all duration-200 text-left`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon size={18} className="text-obsidian-300 group-hover:text-iris-300 transition-colors" />
              <ArrowRight size={14} className="text-obsidian-600 group-hover:text-iris-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="font-display font-semibold text-sm text-obsidian-200">{label}</p>
            <p className="font-body text-xs text-obsidian-500 mt-0.5">{sub}</p>
          </button>
        ))}
      </div>

      {/* Stats row */}
      {load ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : g ? (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Analyses totales"  value={g.total_analyses}           icon={Zap}           color="iris"    sub={`${g.single_analyses} unitaires · ${g.bulk_analyses} bulk`} />
          <StatCard label="Tâches analysées"  value={g.total_tasks_submitted}    icon={TrendingUp}    color="iris"    sub="depuis le début" />
          <StatCard label="Doublons détectés" value={g.total_duplicates_found}   icon={AlertTriangle} color="crimson" sub={`Taux : ${g.duplicate_rate}%`} />
          <StatCard label="Tâches uniques"    value={g.total_clean}              icon={CheckCircle}   color="jade"    sub="sans similarité détectée" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5">
              <p className="text-xs text-obsidian-500 mb-2 font-display uppercase tracking-wider">—</p>
              <p className="font-display font-bold text-3xl text-obsidian-600">0</p>
            </Card>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Trend chart */}
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-display font-semibold text-sm text-obsidian-200">Activité — 14 derniers jours</p>
              <p className="text-xs text-obsidian-500 mt-0.5 font-body">Analyses et doublons détectés</p>
            </div>
          </div>
          {load ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats?.trend || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIris" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCrimson" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                <XAxis dataKey="date" tick={{ fill: '#4a4a75', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                       tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#4a4a75', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{ background: '#12122a', border: '1px solid #2a2a3a', borderRadius: '10px', fontFamily: 'DM Sans', fontSize: 12 }}
                  labelStyle={{ color: '#9999b8' }}
                />
                <Area type="monotone" dataKey="tasks"      stroke="#6366f1" fill="url(#gIris)"    strokeWidth={2} name="Tâches" />
                <Area type="monotone" dataKey="duplicates" stroke="#ef4444" fill="url(#gCrimson)" strokeWidth={2} name="Doublons" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie chart */}
        <Card className="p-5">
          <p className="font-display font-semibold text-sm text-obsidian-200 mb-1">Distribution</p>
          <p className="text-xs text-obsidian-500 mb-4 font-body">Par niveau de similarité</p>
          {load ? (
            <Skeleton className="h-48 w-full rounded-full" />
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#12122a', border: '1px solid #2a2a3a', borderRadius: '10px', fontFamily: 'DM Sans', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-obsidian-600 text-sm font-body">
              Aucune donnée
            </div>
          )}
        </Card>
      </div>

      {/* Recent logs */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold text-sm text-obsidian-200">Analyses récentes</p>
          <Button variant="ghost" size="sm" onClick={() => nav('/logs')}>
            Voir tout <ArrowRight size={13} />
          </Button>
        </div>
        {load ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-obsidian-600 text-center py-8 font-body">Aucune analyse effectuée</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-obsidian-900/60 border border-obsidian-800 hover:border-obsidian-700 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.duplicates_found > 0 ? 'bg-crimson-400' : 'bg-jade-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-semibold text-obsidian-300">
                      {log.analysis_type === 'bulk' ? 'Import' : 'Unitaire'}
                    </span>
                    {log.source_filename && (
                      <span className="text-xs font-mono text-obsidian-500 truncate max-w-[160px]">
                        {log.source_filename}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-obsidian-500 mt-0.5 font-body">
                    {log.total_submitted} tâche(s) · {log.duplicates_found} doublon(s) · {log.clean_tasks} unique(s)
                  </p>
                </div>
                <span className="text-[11px] font-mono text-obsidian-600 flex-shrink-0">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
