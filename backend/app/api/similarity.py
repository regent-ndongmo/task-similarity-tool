from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io

from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import (
    TaskCreate, SimilarityResult, SimilarityMatch,
    BulkSimilarityResult, BulkSimilarityItem
)
from app.services.task_service import get_all_tasks_as_corpus
from app.services.similarity_engine import similarity_engine
from app.core.security import get_current_user

router = APIRouter()


@router.post("/analyze", response_model=SimilarityResult,
             summary="Analyser la similarité d'une tâche")
def analyze_similarity(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyse la similarité d'une tâche soumise contre toutes les tâches existantes.

    **Niveaux de similarité** :
    - 🔴 **doublon** : score ≥ 90% — tâche quasi-identique
    - 🟠 **forte** : score ≥ 70% — tâche très similaire
    - 🟡 **modérée** : score ≥ 50% — tâche partiellement similaire

    Retourne les correspondances triées par score décroissant.
    """
    corpus = get_all_tasks_as_corpus(db, current_user.id)
    if not corpus:
        return SimilarityResult(
            submitted_title=task_data.title,
            submitted_description=task_data.description,
            matches=[],
            total_analyzed=0,
            duplicates_found=0,
        )

    matches_raw = similarity_engine.compute_similarity(
        task_data.title, task_data.description, corpus
    )

    matches = [SimilarityMatch(**m) for m in matches_raw]
    duplicates = sum(1 for m in matches if m.level == "doublon")

    return SimilarityResult(
        submitted_title=task_data.title,
        submitted_description=task_data.description,
        matches=matches,
        total_analyzed=len(corpus),
        duplicates_found=duplicates,
    )


@router.post("/analyze/bulk", response_model=BulkSimilarityResult,
             summary="Analyser un fichier CSV/Excel")
def analyze_bulk(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyse en masse depuis un fichier CSV ou Excel.

    **Colonnes requises** : `title` (ou `titre`) et `description`

    Chaque ligne est comparée à l'ensemble des tâches existantes en base.
    """
    content = file.file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Format non supporté. Utilisez CSV ou Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture : {str(e)}")

    df.columns = df.columns.str.lower().str.strip()
    if "titre" in df.columns:
        df.rename(columns={"titre": "title"}, inplace=True)

    if "title" not in df.columns or "description" not in df.columns:
        raise HTTPException(
            status_code=422,
            detail="Colonnes 'title' (ou 'titre') et 'description' requises",
        )

    df = df[["title", "description"]].dropna()
    if df.empty:
        raise HTTPException(status_code=422, detail="Aucune donnée valide trouvée")

    submitted = df.to_dict("records")
    corpus = get_all_tasks_as_corpus(db, current_user.id)

    raw_results = similarity_engine.compute_bulk_similarity(submitted, corpus)

    results = [
        BulkSimilarityItem(
            title=r["title"],
            description=r["description"],
            matches=[SimilarityMatch(**m) for m in r["matches"]],
        )
        for r in raw_results
    ]

    return BulkSimilarityResult(
        total_submitted=len(submitted),
        total_analyzed=len(corpus),
        results=results,
    )
