import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function getLevelConfig(level) {
  const configs = {
    doublon: {
      label: 'Doublon',
      color: 'text-crimson-400',
      bg: 'bg-crimson-500/10',
      border: 'border-crimson-500/20',
      bar: 'bg-gradient-to-r from-crimson-500 to-crimson-400',
      dot: 'bg-crimson-400',
      icon: '●',
      badgeClass: 'badge-doublon',
    },
    forte: {
      label: 'Forte',
      color: 'text-ember-400',
      bg: 'bg-ember-500/10',
      border: 'border-ember-500/20',
      bar: 'bg-gradient-to-r from-ember-500 to-ember-400',
      dot: 'bg-ember-400',
      icon: '◆',
      badgeClass: 'badge-forte',
    },
    'modérée': {
      label: 'Modérée',
      color: 'text-gold-400',
      bg: 'bg-gold-500/10',
      border: 'border-gold-500/20',
      bar: 'bg-gradient-to-r from-gold-500 to-gold-400',
      dot: 'bg-gold-400',
      icon: '▲',
      badgeClass: 'badge-moderee',
    },
    unique: {
      label: 'Unique',
      color: 'text-jade-400',
      bg: 'bg-jade-500/10',
      border: 'border-jade-500/20',
      bar: 'bg-gradient-to-r from-jade-500 to-jade-400',
      dot: 'bg-jade-400',
      icon: '✓',
      badgeClass: 'badge-unique',
    },
  }
  return configs[level] || configs.unique
}

export function formatScore(score) {
  return `${Math.round(score * 100)}%`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short',
  }).format(new Date(dateStr))
}

export function truncate(str, max = 120) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function getMethodLabel(method) {
  const labels = {
    explicit: 'Mapping manuel',
    auto_synonym: 'Détection automatique',
    fallback: 'Fallback (colonnes 1 & 2)',
    single_column_fallback: 'Colonne unique',
    partial_explicit: 'Partiel + Auto',
  }
  return labels[method] || method
}

export function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase()
}
