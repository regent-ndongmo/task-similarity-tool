# ⬡ Task Similarity Analyzer

> Outil intelligent de détection de doublons et d'analyse de similarité entre tâches — basé sur le Machine Learning (TF-IDF + Cosine Similarity).

---

## 📋 Table des matières

1. [Présentation](#présentation)
2. [Architecture technique](#architecture-technique)
3. [Algorithme ML](#algorithme-ml)
4. [Installation rapide](#installation-rapide)
5. [Configuration](#configuration)
6. [Lancement](#lancement)
7. [Utilisation de l'interface](#utilisation-de-linterface)
8. [API REST — Endpoints](#api-rest--endpoints)
9. [Sécurité & Authentification](#sécurité--authentification)
10. [Structure du projet](#structure-du-projet)
11. [Niveaux de similarité](#niveaux-de-similarité)
12. [FAQ](#faq)

---

## Présentation

Dans les environnements d'ingénierie et de gestion de projet, des tâches ou études sont fréquemment recréées alors qu'elles existent déjà. Cette duplication entraîne une perte de temps, un gaspillage de ressources et une mauvaise capitalisation des connaissances.

**Task Similarity Analyzer** permet de :
- Détecter automatiquement les doublons et les tâches similaires
- Calculer un score de similarité précis (0 à 100 %)
- Identifier les mots-clés communs entre tâches
- Analyser en masse via import CSV ou Excel
- Garantir la confidentialité des données par utilisateur (JWT)

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│           HTML/CSS/JS (interface web mono-fichier)          │
│                  Appels REST vers l'API                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend — FastAPI                         │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │  API Layer    │  │ Service Layer│  │  ML Engine    │    │
│  │  (Routers)    │→ │ (Métier)     │→ │ (Similarité)  │    │
│  │  auth/tasks/  │  │ task_service │  │ TF-IDF +      │    │
│  │  similarity   │  │              │  │ Cosine Sim.   │    │
│  └───────────────┘  └──────────────┘  └───────────────┘    │
│                           │                                  │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │              Data Access Layer                      │    │
│  │           SQLAlchemy ORM (models)                   │    │
│  └────────────────────────┬────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    MySQL Database                           │
│              (users + tasks, isolées par user)              │
└─────────────────────────────────────────────────────────────┘
```

### Séparation des responsabilités

| Couche | Rôle | Fichiers |
|--------|------|----------|
| **API Layer** | Exposition des endpoints REST, validation HTTP, auth JWT | `app/api/auth.py`, `tasks.py`, `similarity.py` |
| **Service Layer** | Logique métier, accès aux données | `app/services/task_service.py` |
| **ML Engine** | Moteur d'analyse, vectorisation, calcul de score | `app/services/similarity_engine.py` |
| **Data Layer** | ORM SQLAlchemy, connexion BDD | `app/db/`, `app/models/` |
| **Core** | Config, sécurité JWT, utilitaires | `app/core/` |

---

## Algorithme ML

### TF-IDF (Term Frequency-Inverse Document Frequency)

Chaque texte est transformé en vecteur numérique où chaque dimension représente l'importance d'un terme :

```
TF(t,d)  = nombre d'occurrences du terme t dans le document d
IDF(t)   = log(N / df(t))  [N = total docs, df = docs contenant t]
TF-IDF   = TF × IDF
```

Les termes **rares** mais présents dans les deux documents → score élevé.  
Les termes **trop communs** (stopwords) → filtrés.

### Cosine Similarity

La similarité entre deux vecteurs est calculée via le cosinus de l'angle entre eux :

```
sim(A, B) = (A · B) / (||A|| × ||B||)  →  résultat entre 0 et 1
```

- `1.0` = textes identiques
- `0.0` = aucun mot en commun

### Pondération titre/description

Le titre est répété 2× dans le vecteur (poids double) car il est plus discriminant :

```python
text = f"{titre} {titre} {description}"
```

### N-grammes

L'analyse utilise des unigrammes (1 mot) et bigrammes (2 mots consécutifs) pour capturer les associations de termes (`"analyse réseau"`, `"migration cloud"`, etc.).

---

## Installation rapide

### Prérequis

- Python 3.10+
- MySQL 8.0+
- (Optionnel) Docker & Docker Compose

### Option A — Installation manuelle

```bash
# 1. Cloner/extraire le projet
cd task-similarity-tool/backend

# 2. Créer un environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/macOS
# ou
venv\Scripts\activate           # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres MySQL
```

### Option B — Docker Compose (recommandé)

```bash
cd task-similarity-tool
docker-compose up --build
```

L'API sera disponible sur `http://localhost:8000`.

---

## Configuration

Éditez le fichier `backend/.env` :

```env
# Base de données MySQL
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/task_similarity

# Clé secrète JWT (générer avec : python -c "import secrets; print(secrets.token_hex(32))")
SECRET_KEY=votre-cle-secrete-tres-longue

# Durée de validité du token (minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Seuil de similarité (0.70 = 70%)
SIMILARITY_THRESHOLD=0.70
```

### Base de données MySQL

```sql
-- Exécuter le script d'initialisation
mysql -u root -p < backend/init_db.sql
```

Ou créer manuellement :

```sql
CREATE DATABASE task_similarity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Lancement

```bash
# Depuis le dossier backend/
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

| Interface | URL |
|-----------|-----|
| **API** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **Frontend** | Ouvrir `frontend/index.html` dans un navigateur |

---

## Utilisation de l'interface

### 1. Créer un compte

Ouvrez `frontend/index.html` → cliquez sur **Inscription** → remplissez les champs.

### 2. Analyser une tâche unique

1. Onglet **Analyser**
2. Saisissez le **titre** et la **description**
3. Cliquez sur **Analyser les similarités**
4. Les résultats apparaissent avec le score et les mots-clés communs

### 3. Import en masse

1. Onglet **Import fichier**
2. Préparez un fichier CSV/Excel avec les colonnes `title` et `description`
3. Sélectionnez le fichier
4. Cliquez sur **Analyser les similarités** (analyse sans sauvegarder) ou **Importer seulement** (sauvegarde en base)

### Format de fichier attendu

| title | description |
|-------|-------------|
| Audit réseau | Analyse complète de l'infrastructure réseau de l'entreprise... |
| Migration cloud | Étude de migration de l'infrastructure vers AWS... |

> ✅ Colonnes acceptées : `title` ou `titre` (insensible à la casse)

---

## API REST — Endpoints

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Créer un compte |
| `POST` | `/api/v1/auth/login` | Se connecter (retourne JWT) |

### Tâches

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v1/tasks/` | Lister mes tâches |
| `POST` | `/api/v1/tasks/` | Créer une tâche |
| `GET` | `/api/v1/tasks/{id}` | Détail d'une tâche |
| `PUT` | `/api/v1/tasks/{id}` | Modifier une tâche |
| `DELETE` | `/api/v1/tasks/{id}` | Supprimer une tâche |
| `POST` | `/api/v1/tasks/import/file` | Importer depuis CSV/Excel |

### Similarité

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v1/similarity/analyze` | Analyser une tâche unique |
| `POST` | `/api/v1/similarity/analyze/bulk` | Analyser un fichier entier |

### Exemples cURL

```bash
# 1. Inscription
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret123"}'

# 2. Connexion → récupérer le token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Créer une tâche
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Audit réseau","description":"Analyse de l infrastructure réseau..."}'

# 4. Analyser une similarité
curl -X POST http://localhost:8000/api/v1/similarity/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Revue réseau","description":"Étude du réseau informatique..."}'

# 5. Import fichier
curl -X POST http://localhost:8000/api/v1/tasks/import/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@mes_taches.csv"
```

---

## Sécurité & Authentification

### Système JWT

- Chaque utilisateur obtient un **token JWT** valable 24h à la connexion
- Toutes les routes (sauf `/auth/*`) requièrent le header : `Authorization: Bearer <token>`
- Les données sont **strictement isolées** : un utilisateur ne voit jamais les tâches d'un autre

### Isolation des données

```python
# Toutes les requêtes filtrent par owner_id
tasks = db.query(Task).filter(Task.owner_id == current_user.id).all()
```

### Sécurité des mots de passe

- Hashage **bcrypt** (via passlib) — jamais stocké en clair
- Vérification à la connexion par comparaison du hash

---

## Structure du projet

```
task-similarity-tool/
├── backend/
│   ├── app/
│   │   ├── api/               # Endpoints REST (routers FastAPI)
│   │   │   ├── auth.py        # /auth/register, /auth/login
│   │   │   ├── tasks.py       # CRUD tâches + import fichier
│   │   │   └── similarity.py  # Analyse unique + bulk
│   │   ├── core/
│   │   │   ├── config.py      # Variables d'environnement
│   │   │   └── security.py    # JWT, bcrypt, get_current_user
│   │   ├── db/
│   │   │   └── database.py    # Engine SQLAlchemy, session
│   │   ├── models/
│   │   │   ├── user.py        # Modèle SQLAlchemy User
│   │   │   └── task.py        # Modèle SQLAlchemy Task
│   │   ├── schemas/
│   │   │   └── schemas.py     # Schémas Pydantic (validation)
│   │   ├── services/
│   │   │   ├── similarity_engine.py  # ⭐ Moteur ML TF-IDF
│   │   │   └── task_service.py       # Logique métier tâches
│   │   └── main.py            # Application FastAPI + CORS
│   ├── requirements.txt
│   ├── .env.example
│   ├── init_db.sql            # Script SQL d'initialisation
│   └── Dockerfile
├── frontend/
│   └── index.html             # Interface web complète
├── docker-compose.yml
└── README.md
```

---

## Niveaux de similarité

| Icône | Niveau | Score | Signification |
|-------|--------|-------|---------------|
| 🔴 | **doublon** | ≥ 90% | Tâche quasi-identique — très probablement un doublon |
| 🟠 | **forte** | ≥ 70% | Tâche très similaire — vérifier avant de créer |
| 🟡 | **modérée** | ≥ 50% | Similarité partielle — peut être complémentaire |
| ⚪ | *non affiché* | < 50% | Tâche distincte |

---

## FAQ

**Q : Puis-je ajuster le seuil de similarité ?**  
R : Oui, modifiez `SIMILARITY_THRESHOLD` dans `.env` (valeur entre 0.0 et 1.0).

**Q : L'outil supporte-t-il le français et l'anglais ?**  
R : Oui, les stopwords (mots non significatifs) incluent les deux langues. La normalisation supprime également les accents.

**Q : Combien de tâches peut-on analyser en masse ?**  
R : Il n'y a pas de limite stricte, mais au-delà de 1000 tâches la vectorisation peut prendre quelques secondes.

**Q : Mes données sont-elles partagées entre utilisateurs ?**  
R : Non. Chaque utilisateur est strictement isolé. L'analyse compare uniquement vos propres tâches.

**Q : Comment régénérer la clé secrète JWT ?**  
R : `python -c "import secrets; print(secrets.token_hex(32))"` puis mettez à jour `.env`.

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend | FastAPI 0.111 |
| ML | scikit-learn (TF-IDF + Cosine) |
| Base de données | MySQL 8 + SQLAlchemy 2 |
| Authentification | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |
| Documentation API | Swagger UI / ReDoc |
| Frontend | HTML5 / CSS3 / JS vanilla |
| Import fichiers | pandas, openpyxl |

---

*Task Similarity Analyzer — v1.0.0*
