import { useState } from 'react'
import { similarityAPI, tasksAPI } from '@/services/api'
import { Input, Textarea, Button, Card, Alert } from '@/components/ui'
import SimilarityResults from '@/components/similarity/SimilarityResults'
import { Search, Save, RotateCcw, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyzePage() {
  const [form,    setForm]    = useState({ title: '', description: '' })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function analyze() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Le titre et la description sont obligatoires.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await similarityAPI.analyze(form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse')
    } finally {
      setLoading(false)
    }
  }

  async function saveTask() {
    if (!form.title.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      await tasksAPI.create(form)
      toast.success('Tâche enregistrée dans la base !')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setForm({ title: '', description: '' })
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-iris-600/20 border border-iris-500/30 flex items-center justify-center">
            <Search size={13} className="text-iris-400" />
          </div>
          <h1 className="font-display font-bold text-xl text-white">Analyser une tâche</h1>
        </div>
        <p className="text-sm text-obsidian-500 font-body ml-9">
          Soumettez une tâche unique pour détecter les similarités avec votre base
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={14} className="text-iris-400" />
              <p className="font-display font-semibold text-sm text-obsidian-200">Tâche à analyser</p>
            </div>

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <div className="space-y-4">
              <Input
                label="Titre *"
                placeholder="Ex: Étude de faisabilité réseau LAN"
                value={form.title}
                onChange={set('title')}
              />
              <Textarea
                label="Description *"
                placeholder="Décrivez la tâche en détail — objectifs, périmètre, méthodes, livrables attendus…"
                rows={7}
                value={form.description}
                onChange={set('description')}
              />

              {/* Char counts */}
              <div className="flex justify-between text-[10px] font-mono text-obsidian-600 -mt-2">
                <span>{form.title.length} / 255 titre</span>
                <span>{form.description.length} mots-desc</span>
              </div>
            </div>
          </Card>

          <div className="flex gap-2.5">
            <Button
              onClick={analyze}
              loading={loading}
              icon={Search}
              className="flex-1"
              disabled={!form.title || !form.description}
            >
              Analyser les similarités
            </Button>
            <Button
              onClick={saveTask}
              variant="secondary"
              loading={saving}
              icon={Save}
              disabled={!form.title || !form.description}
            >
              Sauvegarder
            </Button>
            <Button variant="ghost" onClick={reset} icon={RotateCcw} />
          </div>

          {/* Tips */}
          <Card className="p-4 bg-obsidian-900/30">
            <p className="text-xs font-display font-semibold text-obsidian-500 uppercase tracking-wider mb-2.5">Conseils</p>
            <ul className="space-y-1.5 text-xs text-obsidian-500 font-body">
              {[
                'Soyez précis dans la description pour de meilleurs résultats',
                'Le titre a un poids double dans l\'algorithme',
                'Sauvegardez la tâche pour l\'enrichir à votre corpus',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-iris-500 mt-0.5">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Results */}
        <div>
          <Card className="p-5 min-h-[400px]">
            <p className="font-display font-semibold text-sm text-obsidian-200 mb-4">Résultats de l'analyse</p>
            <SimilarityResults result={result} loading={loading} />
          </Card>
        </div>
      </div>
    </div>
  )
}
