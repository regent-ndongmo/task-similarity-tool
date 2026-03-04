from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import (
    TaskCreate, SimilarityResult, SimilarityMatch,
    BulkSimilarityResult, BulkSimilarityItem
)
from app.services.task_service import get_all_tasks_as_corpus
from app.services.similarity_engine import similarity_engine
from app.services.file_parser import extract_tasks
from app.services import log_service
from app.services.report_service import generate_pdf_report, generate_excel_report
from app.core.security import get_current_user

router = APIRouter()


def _compute_stats_summary(results: list) -> dict:
    total = len(results)
    dup = sum(1 for r in results if any(m["level"] == "doublon" for m in r["matches"]))
    strong = sum(1 for r in results
                 if not any(m["level"] == "doublon" for m in r["matches"])
                 and any(m["level"] == "forte" for m in r["matches"]))
    mod = sum(1 for r in results
              if not any(m["level"] in ("doublon", "forte") for m in r["matches"])
              and r["matches"])
    clean = sum(1 for r in results if not r["matches"])
    return {
        "total": total,
        "duplicates": dup,
        "strong": strong,
        "moderate": mod,
        "clean": clean,
        "duplicate_rate": round(dup / total * 100, 1) if total else 0,
    }


@router.post("/analyze", response_model=SimilarityResult,
             summary="Analyser la similarité d'une tâche unique")
def analyze_similarity(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyse la similarité d'une tâche soumise contre toutes les tâches de l'utilisateur.

    **Niveaux de similarité** :
    - 🔴 **doublon** (≥ 90%) — tâche quasi-identique
    - 🟠 **forte** (≥ 70%) — tâche très similaire
    - 🟡 **modérée** (≥ 50%) — similarité partielle

    L'analyse est **loguée** automatiquement dans l'historique.
    """
    corpus = get_all_tasks_as_corpus(db, current_user.id)
    matches_raw = []

    if corpus:
        matches_raw = similarity_engine.compute_similarity(
            task_data.title, task_data.description, corpus
        )

    matches = [SimilarityMatch(**m) for m in matches_raw]
    duplicates = sum(1 for m in matches if m.level == "doublon")
    strong = sum(1 for m in matches if m.level == "forte")
    moderate = sum(1 for m in matches if m.level == "modérée")
    clean = 1 if not matches else 0

    # Log de l'analyse
    log_service.create_log(
        db,
        user_id=current_user.id,
        analysis_type="single",
        total_submitted=1,
        total_analyzed=len(corpus),
        duplicates_found=duplicates,
        strong_matches=strong,
        moderate_matches=moderate,
        clean_tasks=clean,
        status="success",
    )

    return SimilarityResult(
        submitted_title=task_data.title,
        submitted_description=task_data.description,
        matches=matches,
        total_analyzed=len(corpus),
        duplicates_found=duplicates,
    )


@router.post("/analyze/bulk", response_model=BulkSimilarityResult,
             summary="Analyser un fichier CSV/Excel (mapping automatique ou manuel)")
def analyze_bulk(
    file: UploadFile = File(...),
    title_col: Optional[str] = Form(None, description="Colonne titre (laisser vide pour détection auto)"),
    description_col: Optional[str] = Form(None, description="Colonne description (laisser vide pour détection auto)"),
    combine_remaining: bool = Form(False, description="Concaténer les autres colonnes dans la description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyse en masse depuis un fichier CSV ou Excel.

    ### Détection intelligente des colonnes
    Le parser reconnaît automatiquement les colonnes selon leurs synonymes FR/EN.
    En cas d'ambiguïté, utilisez `title_col` et `description_col` pour forcer le mapping.

    ### Paramètres optionnels
    - `title_col` : nom de la colonne titre si non détecté automatiquement
    - `description_col` : nom de la colonne description
    - `combine_remaining` : si `true`, concatène toutes les autres colonnes à la description

    ### Exemple
    Pour un fichier avec les colonnes `Nom_Projet`, `Contenu_Technique`, `Responsable` :
    - `title_col = Nom_Projet`
    - `description_col = Contenu_Technique`
    - `combine_remaining = false`

    L'analyse est **loguée** avec le mapping utilisé.
    """
    content = file.file.read()

    try:
        submitted, mapping = extract_tasks(
            content, file.filename,
            title_col=title_col,
            description_col=description_col,
            combine_remaining=combine_remaining,
        )
    except ValueError as e:
        log_service.create_log(
            db,
            user_id=current_user.id,
            analysis_type="bulk",
            source_filename=file.filename,
            status="error",
            error_message=str(e),
        )
        raise HTTPException(status_code=422, detail=str(e))

    if not submitted:
        raise HTTPException(status_code=422, detail="Aucune donnée valide trouvée dans le fichier")

    corpus = get_all_tasks_as_corpus(db, current_user.id)
    raw_results = similarity_engine.compute_bulk_similarity(submitted, corpus)

    stats = _compute_stats_summary(raw_results)

    # Log
    log_service.create_log(
        db,
        user_id=current_user.id,
        analysis_type="bulk",
        source_filename=file.filename,
        total_submitted=len(submitted),
        total_analyzed=len(corpus),
        duplicates_found=stats["duplicates"],
        strong_matches=stats["strong"],
        moderate_matches=stats["moderate"],
        clean_tasks=stats["clean"],
        column_mapping=mapping,
        status="success",
    )

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
        column_mapping=mapping,
        results=results,
        stats_summary=stats,
    )


@router.post("/report/pdf", summary="Générer un rapport PDF sans doublons")
def export_pdf_report(
    file: UploadFile = File(...),
    title_col: Optional[str] = Form(None),
    description_col: Optional[str] = Form(None),
    combine_remaining: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Génère un **rapport PDF complet** depuis un fichier CSV/Excel :
    - En-tête avec méta-informations et colonnes utilisées
    - Résumé statistique (doublons, similarités, tâches uniques)
    - **Liste des tâches sans doublon** (à conserver)
    - Liste des doublons avec tâche correspondante
    - Liste des similarités fortes

    Retourne le fichier PDF en téléchargement direct.
    """
    content = file.file.read()
    try:
        submitted, mapping = extract_tasks(
            content, file.filename,
            title_col=title_col, description_col=description_col,
            combine_remaining=combine_remaining,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    corpus = get_all_tasks_as_corpus(db, current_user.id)
    raw_results = similarity_engine.compute_bulk_similarity(submitted, corpus)
    stats = _compute_stats_summary(raw_results)

    try:
        pdf_bytes = generate_pdf_report(
            username=current_user.username,
            bulk_results=raw_results,
            stats=stats,
            column_mapping=mapping,
            filename_source=file.filename,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Log
    log_service.create_log(
        db,
        user_id=current_user.id,
        analysis_type="bulk",
        source_filename=file.filename,
        total_submitted=len(submitted),
        total_analyzed=len(corpus),
        duplicates_found=stats["duplicates"],
        strong_matches=stats["strong"],
        moderate_matches=stats["moderate"],
        clean_tasks=stats["clean"],
        column_mapping=mapping,
        status="success",
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=rapport_similarite.pdf"},
    )


@router.post("/report/excel", summary="Générer un rapport Excel multi-onglets")
def export_excel_report(
    file: UploadFile = File(...),
    title_col: Optional[str] = Form(None),
    description_col: Optional[str] = Form(None),
    combine_remaining: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Génère un **rapport Excel** multi-onglets :
    - Onglet **Résumé** : méta-données et statistiques
    - Onglet **✅ Tâches uniques** : tâches sans doublon à conserver
    - Onglet **🔴 Doublons** : tâches quasi-identiques à traiter
    - Onglet **📊 Toutes similarités** : vue complète avec niveaux colorés

    Retourne le fichier `.xlsx` en téléchargement direct.
    """
    content = file.file.read()
    try:
        submitted, mapping = extract_tasks(
            content, file.filename,
            title_col=title_col, description_col=description_col,
            combine_remaining=combine_remaining,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    corpus = get_all_tasks_as_corpus(db, current_user.id)
    raw_results = similarity_engine.compute_bulk_similarity(submitted, corpus)
    stats = _compute_stats_summary(raw_results)

    try:
        excel_bytes = generate_excel_report(
            username=current_user.username,
            bulk_results=raw_results,
            stats=stats,
            column_mapping=mapping,
            filename_source=file.filename,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    log_service.create_log(
        db,
        user_id=current_user.id,
        analysis_type="bulk",
        source_filename=file.filename,
        total_submitted=len(submitted),
        total_analyzed=len(corpus),
        duplicates_found=stats["duplicates"],
        strong_matches=stats["strong"],
        moderate_matches=stats["moderate"],
        clean_tasks=stats["clean"],
        column_mapping=mapping,
        status="success",
    )

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=rapport_similarite.xlsx"},
    )
