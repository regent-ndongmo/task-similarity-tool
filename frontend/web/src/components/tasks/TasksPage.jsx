import { useState, useEffect } from 'react'
import { tasksAPI } from '@/services/api'
import { Card, Button, Input, Textarea, Empty, Skeleton, Alert } from '@/components/ui'
import { formatDate, truncate } from '@/utils/helpers'
import { FileText, Plus, Trash2, Edit3, X, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'

function TaskCard({ task, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ title: task.title, description: task.description })
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    try {
      const updated = await onUpdate(task.id, form)
      setEditing(false)
      toast.success('Tâche mise à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  return (
    <Card hover className="p-4 group">
      {editing ? (
        <div className="space-y-3">
          <Input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Titre"
          />
          <Textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <Button onClick={save} loading={saving} size="sm" icon={Check}>Sauvegarder</Button>
            <Button onClick={() => setEditing(false)} variant="ghost" size="sm" icon={X}>Annuler</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-iris-600/10 border border-iris-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText size={13} className="text-iris-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display font-semibold text-sm text-obsidian-200">{task.title}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg text-obsidian-600 hover:text-iris-400 hover:bg-iris-500/10 transition-all"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-lg text-obsidian-600 hover:text-crimson-400 hover:bg-crimson-500/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="text-xs text-obsidian-500 font-body leading-relaxed mt-1 mb-2">
              {truncate(task.description, 160)}
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-obsidian-600">#{task.id}</span>
              <span className="text-[10px] text-obsidian-600 font-body">{formatDate(task.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function TasksPage() {
  const [tasks,   setTasks]   = useState([])
  const [search,  setSearch]  = useState('')
  const [load,    setLoad]    = useState(true)
  const [error,   setError]   = useState('')
  const [adding,  setAdding]  = useState(false)
  const [newTask, setNew]     = useState({ title: '', description: '' })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoad(true)
    try {
      const { data } = await tasksAPI.list()
      setTasks(data)
    } catch { setError('Erreur de chargement') }
    finally   { setLoad(false) }
  }

  async function addTask() {
    if (!newTask.title || !newTask.description) return
    setSaving(true)
    try {
      const { data } = await tasksAPI.create(newTask)
      setTasks(p => [data, ...p])
      setNew({ title: '', description: '' })
      setAdding(false)
      toast.success('Tâche créée !')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur')
    } finally { setSaving(false) }
  }

  async function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return
    try {
      await tasksAPI.delete(id)
      setTasks(p => p.filter(t => t.id !== id))
      toast.success('Tâche supprimée')
    } catch { toast.error('Erreur de suppression') }
  }

  async function updateTask(id, data) {
    const { data: updated } = await tasksAPI.update(id, data)
    setTasks(p => p.map(t => t.id === id ? updated : t))
    return updated
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-iris-600/20 border border-iris-500/30 flex items-center justify-center">
              <FileText size={13} className="text-iris-400" />
            </div>
            <h1 className="font-display font-bold text-xl text-white">Mes tâches</h1>
          </div>
          <p className="text-sm text-obsidian-500 font-body ml-9">
            {tasks.length} tâche(s) dans votre corpus
          </p>
        </div>
        <Button onClick={() => setAdding(p => !p)} icon={adding ? X : Plus} variant={adding ? 'secondary' : 'primary'}>
          {adding ? 'Annuler' : 'Nouvelle tâche'}
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <Card className="p-5 border-iris-500/20 bg-iris-500/3 animate-slide-up">
          <p className="font-display font-semibold text-sm text-obsidian-200 mb-4">Créer une tâche</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Titre *"
              placeholder="Titre de la tâche"
              value={newTask.title}
              onChange={e => setNew(p => ({ ...p, title: e.target.value }))}
            />
            <div />
            <div className="col-span-2">
              <Textarea
                label="Description *"
                rows={4}
                placeholder="Description détaillée…"
                value={newTask.description}
                onChange={e => setNew(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={addTask} loading={saving} icon={Plus}>Créer</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-obsidian-500" />
        <input
          className="input-base pl-10"
          placeholder="Rechercher dans les tâches…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* List */}
      {load ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={FileText}
          title={search ? 'Aucun résultat' : 'Aucune tâche'}
          description={search ? `Pas de tâche correspondant à "${search}"` : 'Créez votre première tâche pour enrichir le corpus d\'analyse'}
          action={!search && <Button onClick={() => setAdding(true)} icon={Plus}>Créer une tâche</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onDelete={deleteTask} onUpdate={updateTask} />
          ))}
        </div>
      )}
    </div>
  )
}
