from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, tasks, similarity
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Similarity Analyzer",
    description="""
## 🔍 Outil d'Analyse de Similarité de Tâches

Détectez automatiquement les doublons et fortes similarités entre vos tâches et descriptions.

### Fonctionnalités
- **Authentification JWT** sécurisée
- **Analyse de similarité ML** (TF-IDF + Cosine Similarity)
- **Import CSV/Excel** pour analyses massives
- **Détection de doublons** avec score de similarité
- **API REST** complète et documentée
""",
    version="1.0.0",
    contact={"name": "Task Similarity Tool", "email": "support@taskanalyzer.com"},
    license_info={"name": "MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["🔐 Authentification"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["📋 Tâches"])
app.include_router(similarity.router, prefix="/api/v1/similarity", tags=["🔍 Similarité"])


@app.get("/", tags=["🏠 Accueil"])
def root():
    return {
        "message": "Task Similarity Analyzer API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["🏠 Accueil"])
def health():
    return {"status": "ok"}
