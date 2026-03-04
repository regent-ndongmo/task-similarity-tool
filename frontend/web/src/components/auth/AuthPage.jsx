import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/authStore'
import { Input, Button, Alert } from '@/components/ui'
import { Hexagon, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode]   = useState('login')
  const [loading, setL]   = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const nav = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setL(true)
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password })
        toast.success('Bienvenue !')
        nav('/')
      } else {
        await register(form)
        toast.success('Compte créé ! Connectez-vous.')
        setMode('login')
        setForm(p => ({ ...p, email: '' }))
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    } finally {
      setL(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-950 bg-grid-obsidian bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-iris-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-iris-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-iris-600 to-iris-400 items-center justify-center mb-4 shadow-iris-lg glow-iris">
            <Hexagon size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">TaskSimilar</h1>
          <p className="text-sm text-obsidian-500 font-body">Détection intelligente de doublons par ML</p>
        </div>

        {/* Card */}
        <div className="bg-obsidian-900/90 backdrop-blur-xl border border-obsidian-700/60 rounded-2xl p-7 shadow-[0_8px_60px_rgba(0,0,0,0.5)]">
          {/* Tabs */}
          <div className="flex rounded-xl bg-obsidian-950 border border-obsidian-800 p-1 mb-6 gap-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-iris-600 text-white shadow-md'
                    : 'text-obsidian-500 hover:text-obsidian-300'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom d'utilisateur"
              icon={User}
              placeholder="votre_nom"
              value={form.username}
              onChange={set('username')}
              required
              autoFocus
            />
            {mode === 'register' && (
              <Input
                label="Adresse email"
                icon={Mail}
                type="email"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            )}
            <Input
              label="Mot de passe"
              icon={Lock}
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 caractères' : '••••••••'}
              value={form.password}
              onChange={set('password')}
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          {/* Feature hint */}
          <div className="mt-6 pt-5 border-t border-obsidian-800">
            <div className="flex items-start gap-2.5 text-xs text-obsidian-500">
              <Sparkles size={13} className="text-iris-500 mt-0.5 flex-shrink-0" />
              <span className="font-body leading-relaxed">
                Analysez vos tâches par <strong className="text-obsidian-400">TF-IDF + Cosine Similarity</strong>,
                importez n'importe quel CSV/Excel, générez des rapports PDF & Excel professionnels.
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-obsidian-600 mt-5 font-body">
          Vos données sont isolées et sécurisées par JWT — v2.0
        </p>
      </div>
    </div>
  )
}
