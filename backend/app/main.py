from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, tasks, similarity, logs
from app.db.database import engine, Base

# Importer tous les modèles pour que SQLAlchemy les crée
from app.models import user, task, analysis_log  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Similarity Analyzer",
    description="""
## ⬡ Outil d'Analyse de Similarité de Tâches

Détectez automatiquement les doublons et fortes similarités entre vos tâches.

### Fonctionnalités
- 🔐 **Authentification JWT** — données isolées par utilisateur
- 🤖 **Moteur ML** — TF-IDF + Cosine Similarity avec n-grammes
- 📁 **Import flexible** — CSV/Excel avec détection automatique ou mapping manuel de colonnes
- 📊 **Statistiques & Logs** — historique complet de toutes les analyses
- 📄 **Rapports** — export PDF et Excel avec tâches sans doublons

### Niveaux de similarité
| Niveau | Seuil | Description |
|--------|-------|-------------|
| 🔴 doublon | ≥ 90% | Tâche quasi-identique |
| 🟠 forte | ≥ 70% | Tâche très similaire |
| 🟡 modérée | ≥ 50% | Similarité partielle |
""",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["🔐 Authentification"])
app.include_router(tasks.router,      prefix="/api/v1/tasks",      tags=["📋 Tâches & Fichiers"])
app.include_router(similarity.router, prefix="/api/v1/similarity", tags=["🔍 Similarité & Rapports"])
app.include_router(logs.router,       prefix="/api/v1/logs",       tags=["📜 Logs & Statistiques"])


@app.get("/", tags=["🏠 Santé"])
def root():
    return {"message": "Task Similarity Analyzer API v2", "docs": "/docs"}

@app.get("/health", tags=["🏠 Santé"])
def health():
    return {"status": "ok", "version": "2.0.0"}
