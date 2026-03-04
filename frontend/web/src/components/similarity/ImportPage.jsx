import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { tasksAPI, similarityAPI } from '@/services/api'
import { Card, Button, Alert, Badge, Select, Input } from '@/components/ui'
import { getLevelConfig, formatScore, truncate, getMethodLabel } from '@/utils/helpers'
import { cn } from '@/utils/helpers'
import {
  Upload, FileSpreadsheet, X, Eye, AlertTriangle,
  CheckCircle2, ArrowRight, RefreshCw, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

function BulkResultRow({ item, index }) {
  const [open, setOpen] = useState(false)
  const hasMatch  = item.matches.length > 0
  const topMatch  = hasMatch ? item.matches[0] : null
  const cfg       = topMatch ? getLevelConfig(topMatch.level) : getLevelConfig('unique')

  return (
    <div className={cn('rounded-xl border transition-all', cfg.bg, cfg.border, open && 'shadow-card-hover')}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => hasMatch && setOpen(o => !o)}
      >
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-obsidian-200 truncate">{item.title}</p>
          {!hasMatch && <p className="text-xs text-jade-400 font-body mt-0.5">✓ Unique — aucune similarité</p>}
        </div>
        {hasMatch && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={cn('text-sm font-mono font-bold', cfg.color)}>
              {formatScore(topMatch.similarity_score)}
            </span>
            <span className={cn('text-xs font-mono font-bold uppercase', cfg.color)}>{cfg.label}</span>
            <ArrowRight size={13} className={cn(cfg.color, open && 'rotate-90 transition-transform')} />
          </div>
        )}
      </button>
      {open && hasMatch && (
        <div className="px-4 pb-4 space-y-2 animate-slide-up border-t border-obsidian-800/50 pt-3">
          {item.matches.map((m, i) => {
            const mc = getLevelConfig(m.level)
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-obsidian-900/50 border border-obsidian-800">
                <span className={cn('font-mono font-bold text-sm flex-shrink-0', mc.color)}>
                  {formatScore(m.similarity_score)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-semibold text-obsidian-200 mb-1">{m.title}</p>
                  <p className="text-xs text-obsidian-500 font-body leading-relaxed">{truncate(m.description, 100)}</p>
                  {m.common_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.common_keywords.slice(0, 6).map(kw => (
                        <span key={kw} className="px-1.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-700 text-[10px] font-mono text-obsidian-400">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ImportPage() {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [mapping,  setMapping]  = useState({ title_col: '', description_col: '' })
  const [results,  setResults]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [previewing, setPrev]   = useState(false)
  const [error,    setError]    = useState('')
  const [activeTab, setTab]     = useState('analyze') // 'analyze' | 'import'

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(null)
    setResults(null)
    setError('')
    // Auto-preview
    setPrev(true)
    try {
      const { data } = await tasksAPI.preview(f)
      setPreview(data)
      setMapping({
        title_col:       data.auto_detected.title_col || '',
        description_col: data.auto_detected.description_col || '',
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur de lecture du fichier')
    } finally {
      setPrev(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  })

  const colOptions = preview
    ? [{ value: '', label: '— Sélectionner une colonne —' }, ...preview.columns.map(c => ({ value: c, label: c }))]
    : [{ value: '', label: '— Importer un fichier d\'abord —' }]

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const { data } = await similarityAPI.analyzeBulk(file, {
        title_col: mapping.title_col || undefined,
        description_col: mapping.description_col || undefined,
      })
      setResults(data)
      toast.success(`${data.total_submitted} tâche(s) analysée(s)`)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur d\'analyse')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const { data } = await tasksAPI.import(file, {
        title_col: mapping.title_col || undefined,
        description_col: mapping.description_col || undefined,
      })
      toast.success(data.message)
      setResults(null)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur d\'import')
    } finally {
      setLoading(false)
    }
  }

  const stats = results ? {
    total: results.total_submitted,
    dup:   results.results.filter(r => r.matches.some(m => m.level === 'doublon')).length,
    strong:results.results.filter(r => !r.matches.some(m => m.level === 'doublon') && r.matches.some(m => m.level === 'forte')).length,
    clean: results.results.filter(r => !r.matches.length).length,
  } : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-iris-600/20 border border-iris-500/30 flex items-center justify-center">
            <FileSpreadsheet size={13} className="text-iris-400" />
          </div>
          <h1 className="font-display font-bold text-xl text-white">Import & Analyse</h1>
        </div>
        <p className="text-sm text-obsidian-500 font-body ml-9">
          Analysez ou importez n'importe quel CSV/Excel — mapping automatique ou manuel
        </p>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left panel */}
        <div className="col-span-2 space-y-4">
          {/* Drop zone */}
          <Card className={cn('p-1 transition-all', isDragActive && 'border-iris-500/60 shadow-iris')}>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive ? 'border-iris-400 bg-iris-500/5' : 'border-obsidian-700 hover:border-obsidian-600 hover:bg-obsidian-800/30'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                  isDragActive ? 'bg-iris-500/20 border border-iris-500/30' : 'bg-obsidian-800 border border-obsidian-700')}>
                  <Upload size={20} className={isDragActive ? 'text-iris-400' : 'text-obsidian-500'} />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-obsidian-300">
                    {isDragActive ? 'Déposez ici' : 'Glissez votre fichier'}
                  </p>
                  <p className="text-xs text-obsidian-500 mt-0.5 font-body">CSV, XLS, XLSX acceptés</p>
                </div>
              </div>
            </div>
          </Card>

          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-obsidian-900 border border-obsidian-700 animate-slide-up">
              <FileSpreadsheet size={16} className="text-jade-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-semibold text-obsidian-200 truncate">{file.name}</p>
                <p className="text-[10px] font-mono text-obsidian-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                  {preview && ` · ${preview.total_rows} lignes · ${preview.columns.length} colonnes`}
                </p>
              </div>
              <button onClick={() => { setFile(null); setPreview(null); setResults(null) }}
                      className="text-obsidian-600 hover:text-crimson-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {error && <Alert type="error">{error}</Alert>}

          {/* Column mapping */}
          {preview && (
            <Card className="p-4 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-xs text-obsidian-300">Mapping des colonnes</p>
                <Badge variant={preview.needs_manual_mapping ? 'gold' : 'jade'}>
                  {preview.needs_manual_mapping ? 'Manuel requis' : 'Auto-détecté'}
                </Badge>
              </div>

              {preview.needs_manual_mapping && (
                <Alert type="warning" className="text-xs">
                  Colonnes non détectées automatiquement. Sélectionnez manuellement.
                </Alert>
              )}

              <Select
                label="Colonne titre"
                options={colOptions}
                value={mapping.title_col}
                onChange={e => setMapping(p => ({ ...p, title_col: e.target.value }))}
              />
              <Select
                label="Colonne description"
                options={colOptions}
                value={mapping.description_col}
                onChange={e => setMapping(p => ({ ...p, description_col: e.target.value }))}
              />

              {/* Sample preview */}
              {preview.sample_rows?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-display font-semibold text-obsidian-500 uppercase tracking-wider mb-2">Aperçu (3 lignes)</p>
                  <div className="overflow-x-auto rounded-lg border border-obsidian-800">
                    <table className="w-full text-[10px] font-mono">
                      <thead>
                        <tr className="bg-obsidian-900 border-b border-obsidian-800">
                          {preview.columns.slice(0, 4).map(col => (
                            <th key={col} className={cn('px-2 py-1.5 text-left font-bold',
                              col === mapping.title_col ? 'text-iris-400' :
                              col === mapping.description_col ? 'text-jade-400' : 'text-obsidian-500')}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample_rows.map((row, i) => (
                          <tr key={i} className="border-b border-obsidian-800/50 last:border-0">
                            {preview.columns.slice(0, 4).map(col => (
                              <td key={col} className="px-2 py-1.5 text-obsidian-500 max-w-[80px] truncate">
                                {String(row[col] || '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Actions */}
          {file && (
            <div className="space-y-2 animate-slide-up">
              <Button
                onClick={handleAnalyze}
                loading={loading}
                className="w-full"
                icon={Eye}
                disabled={!file}
              >
                Analyser les similarités
              </Button>
              <Button
                onClick={handleImport}
                variant="secondary"
                loading={loading}
                className="w-full"
                icon={Upload}
              >
                Importer dans la base
              </Button>
            </div>
          )}

          {/* Mapping info */}
          {results?.column_mapping && (
            <Card className="p-3 bg-obsidian-900/40">
              <div className="flex items-center gap-1.5 mb-2">
                <Info size={11} className="text-iris-500" />
                <p className="text-[10px] font-display font-semibold text-obsidian-400 uppercase tracking-wider">Mapping utilisé</p>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-obsidian-500">
                <p><span className="text-iris-400">titre</span> → {results.column_mapping.title_col}</p>
                <p><span className="text-jade-400">description</span> → {results.column_mapping.description_col}</p>
                <p><span className="text-obsidian-600">méthode</span> → {getMethodLabel(results.column_mapping.method)}</p>
                <p><span className="text-obsidian-600">lignes valides</span> → {results.column_mapping.valid_rows}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right panel - Results */}
        <div className="col-span-3">
          {!results && !loading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-obsidian-800/50 border border-obsidian-700/50 flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet size={28} className="text-obsidian-600" />
                </div>
                <p className="font-display font-semibold text-obsidian-500">Importez un fichier pour commencer</p>
                <p className="text-xs text-obsidian-600 mt-1 font-body">Les résultats s'afficheront ici</p>
              </div>
            </Card>
          )}

          {loading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-2 border-iris-500/20 border-t-iris-400 animate-spin" />
                </div>
                <p className="text-sm text-obsidian-500 font-body animate-pulse">Analyse en cours…</p>
              </div>
            </Card>
          )}

          {results && !loading && (
            <div className="space-y-4">
              {/* Stats summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Soumises',  val: stats.total, color: 'text-obsidian-300' },
                  { label: 'Doublons',  val: stats.dup,   color: 'text-crimson-400'  },
                  { label: 'Forte sim.', val: stats.strong, color: 'text-ember-400'  },
                  { label: 'Uniques',   val: stats.clean, color: 'text-jade-400'     },
                ].map(({ label, val, color }) => (
                  <Card key={label} className="p-3 text-center">
                    <p className={cn('font-display font-bold text-2xl', color)}>{val}</p>
                    <p className="text-[10px] font-body text-obsidian-500 mt-0.5">{label}</p>
                  </Card>
                ))}
              </div>

              {/* Results list */}
              <Card className="p-4">
                <p className="font-display font-semibold text-sm text-obsidian-200 mb-3">
                  Résultats par tâche
                  <span className="ml-2 text-obsidian-500 font-body font-normal text-xs">
                    (cliquer pour voir les détails)
                  </span>
                </p>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {results.results.map((item, i) => (
                    <BulkResultRow key={i} item={item} index={i} />
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
