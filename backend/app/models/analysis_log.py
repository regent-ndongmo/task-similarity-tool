from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class AnalysisLog(Base):
    """
    Journal de toutes les analyses effectuées.
    Chaque appel à /similarity/analyze ou /similarity/analyze/bulk
    crée une entrée de log pour la traçabilité.
    """
    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Type d'analyse : "single" ou "bulk"
    analysis_type = Column(String(20), nullable=False, default="single")

    # Fichier source (si bulk)
    source_filename = Column(String(255), nullable=True)

    # Statistiques de l'analyse
    total_submitted = Column(Integer, default=1)    # tâches soumises
    total_analyzed = Column(Integer, default=0)     # tâches du corpus
    duplicates_found = Column(Integer, default=0)   # doublons détectés (≥90%)
    strong_matches = Column(Integer, default=0)     # similarité forte (70-89%)
    moderate_matches = Column(Integer, default=0)   # similarité modérée (50-69%)
    clean_tasks = Column(Integer, default=0)        # sans similarité

    # Colonnes mappées (si l'utilisateur a spécifié un mapping personnalisé)
    column_mapping = Column(JSON, nullable=True)

    # Statut : "success", "partial", "error"
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="logs")
