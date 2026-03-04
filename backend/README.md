# Backend — Task Similarity Analyzer

API REST construite avec **FastAPI** + **scikit-learn**.

## Démarrage rapide

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configurer DATABASE_URL
uvicorn app.main:app --reload
```

## Documentation interactive

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc**       : http://localhost:8000/redoc

## Endpoints principaux

```
POST /api/v1/auth/register          → Créer un compte
POST /api/v1/auth/login             → Obtenir un token JWT

GET  /api/v1/tasks/                 → Lister mes tâches
POST /api/v1/tasks/                 → Créer une tâche
POST /api/v1/tasks/import/file      → Import CSV/Excel

POST /api/v1/similarity/analyze        → Analyser une tâche
POST /api/v1/similarity/analyze/bulk   → Analyser un fichier
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `mysql+pymysql://root:password@localhost:3306/task_similarity` | URL MySQL |
| `SECRET_KEY` | — | Clé JWT (obligatoire en prod) |
| `SIMILARITY_THRESHOLD` | `0.70` | Seuil d'affichage (70%) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Durée token (24h) |

## Architecture des fichiers

```
app/
├── api/           → Routers FastAPI (HTTP)
├── core/          → Config + sécurité JWT
├── db/            → SQLAlchemy session
├── models/        → ORM (User, Task)
├── schemas/       → Pydantic (validation)
├── services/      → Logique métier + ML engine
└── main.py        → App FastAPI
```
