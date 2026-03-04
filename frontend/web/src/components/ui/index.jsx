import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'sm', className }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
  return <Loader2 className={cn('animate-spin text-iris-400', sizes[size], className)} />
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-obsidian-800 text-obsidian-300 border-obsidian-700',
    iris:    'bg-iris-600/15 text-iris-300 border-iris-500/25',
    jade:    'bg-jade-500/15 text-jade-400 border-jade-500/25',
    crimson: 'bg-crimson-500/15 text-crimson-400 border-crimson-500/25',
    ember:   'bg-ember-500/15 text-ember-400 border-ember-500/25',
    gold:    'bg-gold-500/15 text-gold-400 border-gold-500/25',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-semibold border',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false }) {
  return (
    <div className={cn(
      'rounded-2xl border',
      hover ? 'glass-card-hover' : 'glass-card',
      className
    )}>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-display font-semibold text-obsidian-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-500">
            <Icon size={15} />
          </div>
        )}
        <input
          className={cn(
            'input-base',
            Icon && 'pl-10',
            error && 'border-crimson-500/50 focus:ring-crimson-500/30',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-crimson-400 font-body">{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-display font-semibold text-obsidian-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'input-base resize-none',
          error && 'border-crimson-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-crimson-400">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, options = [], className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-display font-semibold text-obsidian-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select className={cn('input-base', className)} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', loading = false,
  icon: Icon, iconRight, size = 'md', className, ...props
}) {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }
  const sizes = {
    sm: 'text-xs px-3.5 py-1.5',
    md: '',
    lg: 'text-base px-6 py-3',
  }
  return (
    <button
      className={cn(variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon ? <Icon size={15} /> : null}
      {children}
      {iconRight && !loading && <span className="ml-1">{iconRight}</span>}
    </button>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, colorClass = 'bg-iris-500', className }) {
  return (
    <div className={cn('score-bar', className)}>
      <div
        className={cn('score-fill', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ className }) {
  return <hr className={cn('border-obsidian-800', className)} />
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-obsidian-800/60 border border-obsidian-700/50 flex items-center justify-center mb-5">
          <Icon size={28} className="text-obsidian-500" />
        </div>
      )}
      <p className="font-display font-semibold text-obsidian-300 text-base mb-1.5">{title}</p>
      {description && <p className="text-sm text-obsidian-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'iris', trend }) {
  const colors = {
    iris:    { bg: 'bg-iris-500/10',    icon: 'text-iris-400',    border: 'border-iris-500/15'    },
    jade:    { bg: 'bg-jade-500/10',    icon: 'text-jade-400',    border: 'border-jade-500/15'    },
    crimson: { bg: 'bg-crimson-500/10', icon: 'text-crimson-400', border: 'border-crimson-500/15' },
    ember:   { bg: 'bg-ember-500/10',   icon: 'text-ember-400',   border: 'border-ember-500/15'   },
    gold:    { bg: 'bg-gold-500/10',    icon: 'text-gold-400',    border: 'border-gold-500/15'    },
  }
  const c = colors[color] || colors.iris
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-display font-semibold text-obsidian-500 uppercase tracking-wider mb-3">{label}</p>
          <p className="font-display font-bold text-3xl text-obsidian-100 leading-none">{value}</p>
          {sub && <p className="text-xs text-obsidian-500 mt-1.5 font-body">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', c.bg, c.border)}>
            <Icon size={18} className={c.icon} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={cn('mt-3 text-xs font-mono', trend >= 0 ? 'text-jade-400' : 'text-crimson-400')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs période préc.
        </div>
      )}
    </Card>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children, className }) {
  const types = {
    info:    'bg-iris-500/10 border-iris-500/20 text-iris-300',
    success: 'bg-jade-500/10 border-jade-500/20 text-jade-300',
    warning: 'bg-gold-500/10 border-gold-500/20 text-gold-300',
    error:   'bg-crimson-500/10 border-crimson-500/20 text-crimson-300',
  }
  return (
    <div className={cn('px-4 py-3 rounded-xl border text-sm font-body', types[type], className)}>
      {children}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <Card className="p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </Card>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
export function Tooltip({ content, children }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5
                      bg-obsidian-800 border border-obsidian-700 rounded-lg text-xs text-obsidian-200
                      whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
                      transition-opacity duration-150 z-50 font-body shadow-lg">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-4 border-r-4 border-t-4
                        border-l-transparent border-r-transparent border-t-obsidian-700" />
      </div>
    </div>
  )
}
