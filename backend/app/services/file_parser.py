"""
Service de parsing intelligent de fichiers CSV/Excel.

Stratégie de détection des colonnes (par ordre de priorité) :
1. Mapping explicite fourni par l'utilisateur (title_col, description_col)
2. Correspondance exacte : title / titre / description
3. Correspondance floue : colonnes contenant 'title', 'titre', 'nom', 'name', 'desc', 'libelle', etc.
4. Fallback : première colonne = title, deuxième colonne = description (si ≥ 2 colonnes)

En cas d'ambiguïté, retourne la liste des colonnes disponibles pour que
l'utilisateur choisisse via l'API (endpoint /files/preview).
"""

import io
import re
import unicodedata
from typing import Optional, Tuple
import pandas as pd


# Synonymes reconnus pour chaque rôle de colonne
TITLE_SYNONYMS = [
    "title", "titre", "nom", "name", "intitule", "intitulé",
    "libelle", "libellé", "sujet", "subject", "task", "tache", "tâche",
    "task_name", "task_title", "nom_tache", "nom_tâche",
]

DESCRIPTION_SYNONYMS = [
    "description", "desc", "detail", "détail", "details", "détails",
    "content", "contenu", "body", "texte", "text", "commentaire",
    "comment", "note", "notes", "resume", "résumé", "summary",
    "observation", "remarque",
]


def _normalize_col(col: str) -> str:
    """Normalise un nom de colonne : minuscules, sans accents, sans espaces."""
    col = str(col).lower().strip()
    col = unicodedata.normalize("NFD", col)
    col = "".join(c for c in col if unicodedata.category(c) != "Mn")
    col = re.sub(r"[\s_\-\.]+", "_", col)
    return col


def _find_column(columns_normalized: dict, synonyms: list) -> Optional[str]:
    """
    Cherche une colonne dans le dataframe selon une liste de synonymes.
    columns_normalized : {normalized_name: original_name}
    Retourne le nom original de la colonne si trouvée.
    """
    # 1. Correspondance exacte
    for syn in synonyms:
        if syn in columns_normalized:
            return columns_normalized[syn]

    # 2. Correspondance partielle (la colonne contient le synonyme)
    for norm_col, orig_col in columns_normalized.items():
        for syn in synonyms:
            if syn in norm_col:
                return orig_col

    return None


def read_file(content: bytes, filename: str) -> pd.DataFrame:
    """
    Lit un fichier CSV ou Excel et retourne un DataFrame brut.
    Gère plusieurs encodages pour les CSV.
    """
    fname = filename.lower()

    if fname.endswith(".csv"):
        for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"):
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding)
                if not df.empty:
                    return df
            except Exception:
                continue
        raise ValueError("Impossible de lire le fichier CSV. Vérifiez l'encodage.")

    elif fname.endswith((".xlsx", ".xls")):
        try:
            df = pd.read_excel(io.BytesIO(content))
            return df
        except Exception as e:
            raise ValueError(f"Impossible de lire le fichier Excel : {e}")

    else:
        raise ValueError("Format non supporté. Utilisez .csv, .xlsx ou .xls")


def preview_columns(content: bytes, filename: str) -> dict:
    """
    Lit le fichier et retourne les informations de colonnes pour le preview.
    Permet à l'utilisateur de voir les colonnes et de choisir le mapping.
    """
    df = read_file(content, filename)

    columns = list(df.columns)
    columns_normalized = {_normalize_col(c): c for c in columns}

    auto_title = _find_column(columns_normalized, TITLE_SYNONYMS)
    auto_desc = _find_column(columns_normalized, DESCRIPTION_SYNONYMS)

    # Aperçu des 3 premières lignes (sans NaN)
    sample = df.head(3).fillna("").to_dict("records")

    return {
        "filename": filename,
        "total_rows": len(df),
        "columns": columns,
        "auto_detected": {
            "title_col": auto_title,
            "description_col": auto_desc,
        },
        "sample_rows": sample,
        "needs_manual_mapping": (auto_title is None or auto_desc is None),
    }


def extract_tasks(
    content: bytes,
    filename: str,
    title_col: Optional[str] = None,
    description_col: Optional[str] = None,
    combine_remaining: bool = False,
) -> Tuple[list, dict]:
    """
    Extrait les tâches (title + description) depuis un fichier.

    Priorité :
    1. title_col / description_col fournis explicitement
    2. Détection automatique par synonymes
    3. Fallback : col[0] = title, col[1] = description

    Args:
        content: Contenu binaire du fichier
        filename: Nom du fichier (pour détecter l'extension)
        title_col: Nom explicite de la colonne titre (optionnel)
        description_col: Nom explicite de la colonne description (optionnel)
        combine_remaining: Si True, concatène toutes les autres colonnes à la description

    Returns:
        (tasks_list, mapping_used)
        tasks_list: [{title, description}, ...]
        mapping_used: {title_col, description_col, method}
    """
    df = read_file(content, filename)

    if df.empty:
        raise ValueError("Le fichier est vide.")

    # Nettoyage des noms de colonnes
    original_columns = list(df.columns)
    columns_normalized = {_normalize_col(c): c for c in original_columns}

    resolved_title = None
    resolved_desc = None
    method = "auto"

    # ── Étape 1 : mapping explicite de l'utilisateur ──
    if title_col:
        # Recherche insensible à la casse
        norm_request = _normalize_col(title_col)
        resolved_title = columns_normalized.get(norm_request)
        if resolved_title is None:
            # Recherche partielle
            for norm, orig in columns_normalized.items():
                if norm_request in norm or norm in norm_request:
                    resolved_title = orig
                    break
        if resolved_title is None:
            raise ValueError(
                f"Colonne titre '{title_col}' introuvable. "
                f"Colonnes disponibles : {original_columns}"
            )
        method = "explicit"

    if description_col:
        norm_request = _normalize_col(description_col)
        resolved_desc = columns_normalized.get(norm_request)
        if resolved_desc is None:
            for norm, orig in columns_normalized.items():
                if norm_request in norm or norm in norm_request:
                    resolved_desc = orig
                    break
        if resolved_desc is None:
            raise ValueError(
                f"Colonne description '{description_col}' introuvable. "
                f"Colonnes disponibles : {original_columns}"
            )
        method = "explicit" if method == "explicit" else "partial_explicit"

    # ── Étape 2 : détection automatique par synonymes ──
    if resolved_title is None:
        resolved_title = _find_column(columns_normalized, TITLE_SYNONYMS)
        if resolved_title:
            method = "auto_synonym"

    if resolved_desc is None:
        resolved_desc = _find_column(columns_normalized, DESCRIPTION_SYNONYMS)
        if resolved_desc:
            method = "auto_synonym" if method == "auto_synonym" else method

    # ── Étape 3 : fallback sur les deux premières colonnes ──
    if resolved_title is None and len(original_columns) >= 1:
        resolved_title = original_columns[0]
        method = "fallback"

    if resolved_desc is None and len(original_columns) >= 2:
        # Prend la deuxième colonne différente du titre
        for col in original_columns:
            if col != resolved_title:
                resolved_desc = col
                break
        method = "fallback"

    if resolved_title is None:
        raise ValueError(
            "Impossible de détecter une colonne titre. "
            f"Colonnes disponibles : {original_columns}. "
            "Utilisez title_col pour spécifier manuellement."
        )

    if resolved_desc is None:
        # Si une seule colonne, on utilise le titre comme description aussi
        resolved_desc = resolved_title
        method = "single_column_fallback"

    # ── Construction du texte de description ──
    # Optionnel : combiner d'autres colonnes à la description
    df_work = df.copy()
    df_work["_title_"] = df_work[resolved_title].fillna("").astype(str).str.strip()

    if combine_remaining and resolved_desc != resolved_title:
        # Concatène toutes les colonnes sauf le titre dans la description
        other_cols = [c for c in original_columns if c != resolved_title]
        df_work["_desc_"] = df_work[other_cols].fillna("").astype(str).apply(
            lambda row: " | ".join(v for v in row if v.strip()), axis=1
        )
    else:
        df_work["_desc_"] = df_work[resolved_desc].fillna("").astype(str).str.strip()

    # Filtrage : supprimer les lignes sans titre ni description
    df_work = df_work[
        (df_work["_title_"].str.len() > 0) | (df_work["_desc_"].str.len() > 0)
    ]

    # Si titre vide mais description présente : utilise les premiers mots de la desc comme titre
    mask_no_title = df_work["_title_"].str.len() == 0
    df_work.loc[mask_no_title, "_title_"] = df_work.loc[mask_no_title, "_desc_"].str[:80]

    # Si description vide : duplique le titre
    mask_no_desc = df_work["_desc_"].str.len() == 0
    df_work.loc[mask_no_desc, "_desc_"] = df_work.loc[mask_no_desc, "_title_"]

    tasks = df_work[["_title_", "_desc_"]].rename(
        columns={"_title_": "title", "_desc_": "description"}
    ).to_dict("records")

    mapping_used = {
        "title_col": resolved_title,
        "description_col": resolved_desc,
        "method": method,
        "total_rows_read": len(df),
        "valid_rows": len(tasks),
        "skipped_rows": len(df) - len(tasks),
    }

    return tasks, mapping_used
