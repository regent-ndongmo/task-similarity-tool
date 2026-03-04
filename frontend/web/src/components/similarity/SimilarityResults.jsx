import { getLevelConfig, formatScore, truncate } from '@/utils/helpers'
import { Card, ProgressBar, Badge } from '@/components/ui'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/helpers'

function MatchCard({ match, index }) {
  const cfg = getLevelConfig(match.level)
  const pct = Math.round(match.similarity_score * 100)

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 hover:shadow-card-hover animate-slide-up',
        cfg.bg, cfg.border
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-[10px] font-mono font-bold uppercase tracking-widest', cfg.color)}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <p className="font-display font-semibold text-sm text-obsidian-200 leading-snug">
            {match.title}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className={cn('font-mono font-bold text-xl leading-none', cfg.color)}>{pct}%</span>
          <p className="text-[10px] text-obsidian-500 mt-0.5">similarité</p>
        </div>
      </div>

      <ProgressBar value={match.similarity_score} colorClass={cfg.bar} className="mb-3" />

      <p className="text-xs text-obsidian-500 font-body leading-relaxed mb-3">
        {truncate(match.description, 140)}
      </p>

      {match.common_keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.common_keywords.slice(0, 8).map((kw) => (
            <span key={kw} className="px-2 py-0.5 rounded-md bg-obsidian-800/80 border border-obsidian-700 text-[11px] font-mono text-obsidian-400">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SimilarityResults({ result, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-iris-500/20 border-t-iris-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-iris-400/10 border-b-iris-300 animate-spin animate-spin-slow" style={{ animationDirection: 'reverse' }} />
        </div>
        <p className="text-sm text-obsidian-500 font-body animate-pulse">Analyse en cours…</p>
      </div>
    )
  }

  if (!result) return null

  const { matches, total_analyzed, duplicates_found, submitted_title, submitted_description } = result
  const hasDuplicates = duplicates_found > 0
  const hasMatches    = matches.length > 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary header */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-obsidian-900/50 border-obsidian-700">
        {hasMatches ? (
          <AlertTriangle size={16} className={hasDuplicates ? 'text-crimson-400' : 'text-ember-400'} />
        ) : (
          <CheckCircle2 size={16} className="text-jade-400" />
        )}
        <div className="flex-1">
          <p className="text-xs font-display font-semibold text-obsidian-300">
            {total_analyzed} tâche(s) analysée(s)
          </p>
          <p className="text-xs text-obsidian-500 font-body">
            {matches.length} correspondance(s) · {duplicates_found} doublon(s)
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: matches.filter(m => m.level === 'doublon').length, cfg: getLevelConfig('doublon') },
            { label: matches.filter(m => m.level === 'forte').length,   cfg: getLevelConfig('forte')   },
          ].map(({ label, cfg }, i) => (
            label > 0 && (
              <span key={i} className={cn('px-2 py-0.5 rounded-md text-xs font-mono font-bold border', cfg.bg, cfg.color, cfg.border)}>
                {label}
              </span>
            )
          ))}
        </div>
      </div>

      {!hasMatches ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-jade-500/10 border border-jade-500/20 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-jade-400" />
          </div>
          <p className="font-display font-semibold text-jade-300">Aucune similarité détectée</p>
          <p className="text-xs text-obsidian-500 font-body text-center max-w-xs">
            Cette tâche est unique par rapport aux {total_analyzed} tâches existantes.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {matches.map((match, i) => (
            <MatchCard key={match.task_id} match={match} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
