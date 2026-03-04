from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import LogsResponse, AnalysisLogOut, StatsResponse, GlobalStats, TrendPoint
from app.services import log_service
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=LogsResponse, summary="Historique des analyses")
def get_logs(
    limit: int = Query(50, ge=1, le=200, description="Nombre de logs à retourner"),
    offset: int = Query(0, ge=0, description="Décalage pour la pagination"),
    analysis_type: Optional[str] = Query(None, description="Filtrer par type : 'single' ou 'bulk'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne l'historique complet des analyses de l'utilisateur.

    Chaque entrée contient :
    - le type d'analyse (unitaire ou en masse)
    - le fichier source si applicable
    - les statistiques de l'analyse (doublons, similarités, tâches uniques)
    - le mapping de colonnes utilisé
    - la date et l'heure
    """
    logs = log_service.get_logs_by_user(
        db, current_user.id,
        limit=limit, offset=offset,
        analysis_type=analysis_type,
    )
    total = log_service.get_log_count(db, current_user.id)
    return LogsResponse(
        logs=[AnalysisLogOut.model_validate(l) for l in logs],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/stats", response_model=StatsResponse, summary="Statistiques globales")
def get_stats(
    trend_days: int = Query(30, ge=7, le=365, description="Nombre de jours pour la tendance"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les statistiques globales de l'utilisateur :

    - **global_stats** : totaux cumulés (analyses, tâches, doublons, taux de duplication)
    - **trend** : évolution journalière sur les N derniers jours
    """
    g = log_service.get_global_stats(db, current_user.id)
    trend_raw = log_service.get_trend_stats(db, current_user.id, days=trend_days)

    return StatsResponse(
        global_stats=GlobalStats(**g),
        trend=[TrendPoint(**t) for t in trend_raw],
    )
