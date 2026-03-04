import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { similarityAPI, tasksAPI, downloadBlob } from '@/services/api'
import { Card, Button, Alert, Select, Badge } from '@/components/ui'
import { getMethodLabel } from '@/utils/helpers'
import { cn } from '@/utils/helpers'
import {
  BarChart3, FileText, Upload, Download,
  FileSpreadsheet, Eye, CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [file,     setFile]    = useState(null)
  const [preview,  setPreview] = useState(null)
  const [mapping,  setMapping] = useState({ title_col: '', description_col: '' })
  const [loading,  setLoading] = useState(null) // 'pdf' | 'excel' | 'preview'
  const [error,    setError]   = useState('')

  const onDrop = useCallback(async (accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f); setPreview(null); setError('')
    setLoading('preview')
    try {
      const { data } = await tasksAPI.preview(f)
      setPreview(data)
      setMapping({
        title_col:       data.auto_detected.title_col || '',
        description_col: data.auto_detected.description_col || '',
      })
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur lecture fichier')
    } finally { setLoading(null) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 1,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })

  const opts = { title_col: mapping.title_col || undefined, description_col: mapping.description_col || undefined }

  async function genPDF() {
    if (!file) return
    setLoading('pdf'); setError('')
    try {
      const { data } = await similarityAPI.reportPDF(file, opts)
      downloadBlob(data, `rapport_similarite_${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success('Rapport PDF téléchargé !')
    } catch (e) {
      const msg = e.response?.data ? 'Erreur de génération PDF' : e.message
      setError(msg); toast.error(msg)
    } finally { setLoading(null) }
  }

  async function genExcel() {
    if (!file) return
    setLoading('excel'); setError('')
    try {
      const { data } = await similarityAPI.reportExcel(file, opts)
      downloadBlob(data, `rapport_similarite_${new Date().toISOString().slice(0,10)}.xlsx`)
      toast.success('Rapport Excel téléchargé !')
    } catch (e) {
      setError('Erreur de génération Excel'); toast.error('Erreur Excel')
    } finally { setLoading(null) }
  }

  const colOptions = preview
    ? [{ value: '', label: '— Auto —' }, ...preview.columns.map(c => ({ value: c, label: c }))]
    : [{ value: '', label: '— Fichier requis —' }]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-iris-600/20 border border-iris-500/30 flex items-center justify-center">
            <BarChart3 size={13} className="text-iris-400" />
          </div>
          <h1 className="font-display font-bold text-xl text-white">Générer un rapport</h1>
        </div>
        <p className="text-sm text-obsidian-500 font-body ml-9">
          Exportez un rapport complet — PDF professionnel ou Excel multi-onglets
        </p>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left - Config */}
        <div className="col-span-2 space-y-4">
          {/* Drop zone */}
          <Card>
            <div
              {...getRootProps()}
              className={cn(
                'p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200',
                isDragActive ? 'border-iris-400 bg-iris-500/5' : 'border-obsidian-700 hover:border-obsidian-600 hover:bg-obsidian-800/20'
              )}
            >
              <input {...getInputProps()} />
              <Upload size={24} className={cn('mx-auto mb-3', isDragActive ? 'text-iris-400' : 'text-obsidian-500')} />
              <p className="font-display font-semibold text-sm text-obsidian-300">
                {file ? file.name : 'Glissez votre fichier'}
              </p>
              <p className="text-xs text-obsidian-600 mt-1 font-body">CSV, XLS, XLSX</p>
              {file && (
                <p className="text-xs font-mono text-jade-400 mt-2">
                  ✓ {(file.size / 1024).toFixed(1)} KB
                  {preview && ` · ${preview.total_rows} lignes`}
                </p>
              )}
            </div>
          </Card>

          {error && <Alert type="error">{error}</Alert>}

          {/* Mapping */}
          {preview && (
            <Card className="p-4 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-xs text-obsidian-300">Colonnes</p>
                <Badge variant={preview.needs_manual_mapping ? 'gold' : 'jade'} className="text-[10px]">
                  {preview.needs_manual_mapping ? '⚠ Manuel' : '✓ Auto'}
                </Badge>
              </div>
              <Select label="Colonne titre" options={colOptions} value={mapping.title_col}
                      onChange={e => setMapping(p => ({ ...p, title_col: e.target.value }))} />
              <Select label="Colonne description" options={colOptions} value={mapping.description_col}
                      onChange={e => setMapping(p => ({ ...p, description_col: e.target.value }))} />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {preview.columns.map(col => (
                  <span key={col} className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-mono border',
                    col === mapping.title_col ? 'bg-iris-500/15 text-iris-300 border-iris-500/25' :
                    col === mapping.description_col ? 'bg-jade-500/15 text-jade-400 border-jade-500/25' :
                    'bg-obsidian-800 text-obsidian-500 border-obsidian-700'
                  )}>
                    {col}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Export buttons */}
          <div className="space-y-2.5">
            <button
              onClick={genPDF}
              disabled={!file || !!loading}
              className={cn(
                'w-full group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
                !file || loading ? 'opacity-50 cursor-not-allowed border-obsidian-800 bg-obsidian-900/30' :
                'border-crimson-500/20 bg-crimson-500/5 hover:bg-crimson-500/10 hover:border-crimson-500/40 hover:shadow-card-hover'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-crimson-500/15 border border-crimson-500/20 flex items-center justify-center flex-shrink-0">
                {loading === 'pdf'
                  ? <div className="w-4 h-4 border-2 border-crimson-400/30 border-t-crimson-400 rounded-full animate-spin" />
                  : <FileText size={18} className="text-crimson-400" />
                }
              </div>
              <div className="flex-1 text-left">
                <p className="font-display font-bold text-sm text-obsidian-200">Rapport PDF</p>
                <p className="text-xs text-obsidian-500 font-body mt-0.5">Document professionnel complet</p>
              </div>
              <Download size={16} className="text-obsidian-600 group-hover:text-crimson-400 transition-colors" />
            </button>

            <button
              onClick={genExcel}
              disabled={!file || !!loading}
              className={cn(
                'w-full group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
                !file || loading ? 'opacity-50 cursor-not-allowed border-obsidian-800 bg-obsidian-900/30' :
                'border-jade-500/20 bg-jade-500/5 hover:bg-jade-500/10 hover:border-jade-500/40 hover:shadow-card-hover'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-jade-500/15 border border-jade-500/20 flex items-center justify-center flex-shrink-0">
                {loading === 'excel'
                  ? <div className="w-4 h-4 border-2 border-jade-400/30 border-t-jade-400 rounded-full animate-spin" />
                  : <FileSpreadsheet size={18} className="text-jade-400" />
                }
              </div>
              <div className="flex-1 text-left">
                <p className="font-display font-bold text-sm text-obsidian-200">Rapport Excel</p>
                <p className="text-xs text-obsidian-500 font-body mt-0.5">Multi-onglets avec code couleur</p>
              </div>
              <Download size={16} className="text-obsidian-600 group-hover:text-jade-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Right - Info panels */}
        <div className="col-span-3 space-y-4">
          {/* PDF content */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-crimson-400" />
              <p className="font-display font-bold text-sm text-obsidian-200">Contenu du rapport PDF</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Info,           color: 'text-iris-400',    title: 'En-tête professionnel',       desc: 'Utilisateur, date, fichier source, colonnes mappées, méthode de détection' },
                { icon: BarChart3,      color: 'text-iris-400',    title: 'Résumé statistique',          desc: 'Tableau avec doublons / similarités / tâches uniques / proportions et actions recommandées' },
                { icon: CheckCircle2,   color: 'text-jade-400',    title: '✅ Tâches uniques à conserver', desc: 'Liste complète des tâches sans doublon — le rapport net livrable au client' },
                { icon: AlertTriangle,  color: 'text-crimson-400', title: '🔴 Doublons détectés (≥90%)', desc: 'Tâche soumise → tâche existante similaire, score, mots-clés communs' },
                { icon: AlertTriangle,  color: 'text-ember-400',   title: '🟠 Similarités fortes (70-89%)', desc: 'Tâches à vérifier manuellement avant validation' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon size={14} className={cn(color, 'mt-0.5 flex-shrink-0')} />
                  <div>
                    <p className="text-xs font-display font-semibold text-obsidian-200">{title}</p>
                    <p className="text-xs text-obsidian-500 font-body mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Excel content */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet size={16} className="text-jade-400" />
              <p className="font-display font-bold text-sm text-obsidian-200">Onglets du rapport Excel</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Résumé',          color: 'iris',    desc: 'Méta-données et statistiques globales' },
                { label: '✅ Tâches uniques', color: 'jade',   desc: 'Tâches sans doublon à conserver' },
                { label: '🔴 Doublons',       color: 'crimson', desc: 'Quasi-identiques avec correspondance' },
                { label: '📊 Toutes similarités', color: 'ember', desc: 'Vue complète avec code couleur' },
              ].map(({ label, color, desc }) => (
                <div key={label} className="p-3 rounded-xl bg-obsidian-900/60 border border-obsidian-800">
                  <Badge variant={color} className="mb-2 text-[10px]">{label}</Badge>
                  <p className="text-xs text-obsidian-500 font-body leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-iris-500/3 border-iris-500/10">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-iris-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-obsidian-500 font-body leading-relaxed space-y-1.5">
                <p><strong className="text-obsidian-400">Astuce :</strong> Le rapport compare votre fichier contre les tâches déjà importées dans votre corpus. Importez d'abord vos tâches de référence via la page <em>Import</em>.</p>
                <p>Le mapping de colonnes est automatique — utilisez le sélecteur si votre fichier a des colonnes non-standard.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
