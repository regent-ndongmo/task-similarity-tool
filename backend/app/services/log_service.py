from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.analysis_log import AnalysisLog


def create_log(db: Session, user_id: int, **kwargs) -> AnalysisLog:
    log = AnalysisLog(user_id=user_id, **kwargs)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs_by_user(
    db: Session,
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    analysis_type: Optional[str] = None,
) -> List[AnalysisLog]:
    q = db.query(AnalysisLog).filter(AnalysisLog.user_id == user_id)
    if analysis_type:
        q = q.filter(AnalysisLog.analysis_type == analysis_type)
    return q.order_by(desc(AnalysisLog.created_at)).offset(offset).limit(limit).all()


def get_log_count(db: Session, user_id: int) -> int:
    return db.query(AnalysisLog).filter(AnalysisLog.user_id == user_id).count()


def get_global_stats(db: Session, user_id: int) -> dict:
    """Calcule les statistiques globales d'un utilisateur."""
    logs = db.query(AnalysisLog).filter(
        AnalysisLog.user_id == user_id,
        AnalysisLog.status != "error",
    ).all()

    if not logs:
        return {
            "total_analyses": 0,
            "total_tasks_submitted": 0,
            "total_duplicates_found": 0,
            "total_strong_matches": 0,
            "total_moderate_matches": 0,
            "total_clean": 0,
            "duplicate_rate": 0.0,
            "single_analyses": 0,
            "bulk_analyses": 0,
            "last_analysis_at": None,
        }

    total_submitted = sum(l.total_submitted for l in logs)
    total_dups = sum(l.duplicates_found for l in logs)
    total_strong = sum(l.strong_matches for l in logs)
    total_mod = sum(l.moderate_matches for l in logs)
    total_clean = sum(l.clean_tasks for l in logs)
    single = sum(1 for l in logs if l.analysis_type == "single")
    bulk = sum(1 for l in logs if l.analysis_type == "bulk")
    last = max(l.created_at for l in logs)

    return {
        "total_analyses": len(logs),
        "total_tasks_submitted": total_submitted,
        "total_duplicates_found": total_dups,
        "total_strong_matches": total_strong,
        "total_moderate_matches": total_mod,
        "total_clean": total_clean,
        "duplicate_rate": round(total_dups / total_submitted * 100, 1) if total_submitted else 0.0,
        "single_analyses": single,
        "bulk_analyses": bulk,
        "last_analysis_at": last.isoformat() if last else None,
    }


def get_trend_stats(db: Session, user_id: int, days: int = 30) -> List[dict]:
    """Statistiques journalières sur les N derniers jours."""
    since = datetime.utcnow() - timedelta(days=days)
    logs = db.query(AnalysisLog).filter(
        AnalysisLog.user_id == user_id,
        AnalysisLog.created_at >= since,
        AnalysisLog.status != "error",
    ).all()

    # Grouper par jour
    daily: dict = {}
    for log in logs:
        day = log.created_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"date": day, "analyses": 0, "tasks": 0, "duplicates": 0}
        daily[day]["analyses"] += 1
        daily[day]["tasks"] += log.total_submitted
        daily[day]["duplicates"] += log.duplicates_found

    return sorted(daily.values(), key=lambda x: x["date"])
