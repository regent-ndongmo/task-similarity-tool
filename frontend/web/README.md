# TaskSimilar — Frontend React

Interface professionnelle construite avec **React 18 + Vite + Tailwind CSS**.

## Stack

| Lib | Rôle |
|-----|------|
| React 18 + Vite | Framework + bundler ultra-rapide |
| React Router v6 | Routing SPA |
| Tailwind CSS v3 | Design system utility-first |
| Recharts | Graphiques (AreaChart, BarChart, PieChart) |
| react-dropzone | Drag & drop fichiers |
| axios | Client HTTP avec intercepteurs JWT |
| react-hot-toast | Notifications toast |
| lucide-react | Icônes cohérentes |
| date-fns | Formatage de dates |

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'URL de l'API
cp .env.example .env
# → VITE_API_URL=http://localhost:8000

# 3. Lancer en développement
npm run dev
# → http://localhost:3000

# 4. Build de production
npm run build
```

## Pages & Fonctionnalités

### 🏠 Dashboard
- Vue d'ensemble avec statistiques globales
- Graphiques : AreaChart (tendances 14j) + PieChart (distribution)
- Raccourcis vers toutes les fonctionnalités
- Dernières analyses récentes

### 🔍 Analyser
- Formulaire titre + description avec compteurs de caractères
- Résultats en temps réel avec cards colorées par niveau
- Barre de progression animée pour chaque score
- Mots-clés communs mis en évidence
- Bouton "Sauvegarder" pour enrichir le corpus

### 📁 Import fichier
- Drag & drop ou sélection
- **Preview automatique** : colonnes détectées + aperçu 3 lignes
- Sélecteur de colonnes si détection insuffisante
- Résultats expandables par tâche avec drill-down
- Tableau récapitulatif (doublons / forte / uniques)

### 📋 Mes tâches
- Liste paginée avec recherche full-text
- Édition inline avec sauvegarde
- Suppression avec confirmation
- Création rapide depuis la page

### 📊 Rapports
- Génération PDF ou Excel en un clic
- Mapping colonnes intégré
- Description du contenu de chaque rapport
- Téléchargement direct (blob URL)

### 📜 Historique
- Journal complet de toutes les analyses
- Filtres : Tous / Unitaire / Bulk
- Détail expansible avec stats + mapping utilisé
- BarChart tendances sur 30 jours

## Architecture des composants

```
src/
├── components/
│   ├── ui/          # Primitives réutilisables (Card, Button, Input, Badge…)
│   ├── layout/      # Sidebar + AppLayout
│   ├── auth/        # AuthPage + ProtectedRoute
│   ├── dashboard/   # Dashboard avec graphiques
│   ├── similarity/  # AnalyzePage + ImportPage + SimilarityResults
│   ├── tasks/       # TasksPage (CRUD)
│   ├── reports/     # ReportsPage
│   └── logs/        # LogsPage
├── services/
│   └── api.js       # axios + tous les endpoints
├── store/
│   └── authStore.jsx # Context React auth + JWT
└── utils/
    └── helpers.js   # getLevelConfig, formatDate, formatScore…
```

## Design System

**Couleurs** : Palette `obsidian` (dark) + `iris` (accent) + niveaux sémantiques
- 🔴 `crimson` — doublon
- 🟠 `ember` — forte similarité
- 🟡 `gold` — similarité modérée
- 🟢 `jade` — unique

**Typographie** :
- Display : Syne (titres, labels)
- Body : DM Sans (textes, descriptions)
- Mono : JetBrains Mono (scores, codes, données)

**Classes utilitaires** :
- `.glass-card` — glassmorphism card
- `.btn-primary / secondary / ghost / danger`
- `.input-base` — input unifié
- `.badge-doublon / forte / moderee / unique`
- `.text-gradient` — gradient iris
- `.skeleton` — shimmer loading
