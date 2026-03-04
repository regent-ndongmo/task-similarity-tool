"""
Moteur d'analyse de similarité basé sur le Machine Learning.

Algorithmes utilisés :
- TF-IDF (Term Frequency-Inverse Document Frequency) : vectorisation du texte
- Cosine Similarity : mesure de distance entre vecteurs
- Stopwords multilingues (FR + EN) : filtrage des mots non significatifs
"""
import re
import unicodedata
from typing import List, Tuple, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Stopwords français + anglais
STOPWORDS_FR_EN = {
    # Français
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "au", "aux",
    "ce", "se", "sa", "son", "ses", "mon", "ma", "mes", "ton", "ta", "tes",
    "il", "elle", "ils", "elles", "on", "nous", "vous", "je", "tu", "que",
    "qui", "quoi", "dont", "où", "par", "pour", "sur", "sous", "dans", "avec",
    "sans", "entre", "vers", "lors", "ainsi", "mais", "ou", "ni", "car",
    "est", "sont", "être", "avoir", "faire", "cette", "tout", "plus", "aussi",
    "comme", "si", "bien", "très", "leur", "leurs", "même", "pas", "ne",
    # Anglais
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "we", "you", "he", "she", "they", "i", "my", "your", "our", "their",
}


def normalize_text(text: str) -> str:
    """Normalise le texte : minuscules, suppression accents, ponctuation."""
    text = text.lower()
    # Suppression des accents
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    # Suppression de la ponctuation et caractères spéciaux
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_keywords(text: str) -> List[str]:
    """Extrait les mots-clés significatifs d'un texte."""
    normalized = normalize_text(text)
    words = normalized.split()
    keywords = [w for w in words if w not in STOPWORDS_FR_EN and len(w) > 2]
    return list(dict.fromkeys(keywords))  # Déduplique en préservant l'ordre


def find_common_keywords(text1: str, text2: str) -> List[str]:
    """Trouve les mots-clés communs entre deux textes."""
    kw1 = set(extract_keywords(text1))
    kw2 = set(extract_keywords(text2))
    common = kw1.intersection(kw2)
    return sorted(list(common))[:10]  # Top 10 mots communs


def get_similarity_level(score: float) -> str:
    """Catégorise le niveau de similarité."""
    if score >= 0.90:
        return "doublon"
    elif score >= 0.70:
        return "forte"
    elif score >= 0.50:
        return "modérée"
    else:
        return "faible"


class SimilarityEngine:
    """
    Moteur de similarité textuelle basé sur TF-IDF + Cosine Similarity.
    
    L'analyse combine le titre (pondération x2) et la description
    pour produire un score de similarité composite.
    """

    def __init__(self, threshold: float = 0.70):
        self.threshold = threshold
        self.vectorizer = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),  # Unigrammes + bigrammes
            min_df=1,
            max_features=10000,
            sublinear_tf=True,  # Lissage logarithmique TF
        )

    def _prepare_text(self, title: str, description: str) -> str:
        """
        Combine titre et description avec pondération du titre (répété 2x).
        Le titre est plus discriminant → on le pondère.
        """
        title_norm = normalize_text(title)
        desc_norm = normalize_text(description)
        # Le titre est répété 2 fois pour lui donner plus de poids
        return f"{title_norm} {title_norm} {desc_norm}"

    def compute_similarity(
        self,
        query_title: str,
        query_description: str,
        corpus: List[Dict],
    ) -> List[Dict]:
        """
        Calcule la similarité entre une tâche requête et un corpus de tâches.

        Args:
            query_title: Titre de la tâche soumise
            query_description: Description de la tâche soumise
            corpus: Liste de tâches existantes [{id, title, description}]

        Returns:
            Liste de correspondances triées par score décroissant
        """
        if not corpus:
            return []

        query_text = self._prepare_text(query_title, query_description)
        corpus_texts = [
            self._prepare_text(t["title"], t["description"]) for t in corpus
        ]

        # Vectorisation TF-IDF sur l'ensemble [requête + corpus]
        all_texts = [query_text] + corpus_texts
        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        except ValueError:
            return []

        # Calcul de la similarité cosinus entre la requête et chaque doc du corpus
        query_vector = tfidf_matrix[0]
        corpus_matrix = tfidf_matrix[1:]
        similarities = cosine_similarity(query_vector, corpus_matrix).flatten()

        results = []
        for idx, score in enumerate(similarities):
            score_float = float(score)
            if score_float >= self.threshold:
                task = corpus[idx]
                common_kw = find_common_keywords(
                    f"{query_title} {query_description}",
                    f"{task['title']} {task['description']}",
                )
                results.append(
                    {
                        "task_id": task["id"],
                        "title": task["title"],
                        "description": task["description"],
                        "similarity_score": round(score_float, 4),
                        "common_keywords": common_kw,
                        "level": get_similarity_level(score_float),
                    }
                )

        # Trier par score décroissant
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results

    def compute_bulk_similarity(
        self,
        submitted: List[Dict],
        corpus: List[Dict],
    ) -> List[Dict]:
        """
        Analyse en masse : compare chaque tâche soumise contre le corpus.

        Args:
            submitted: Liste de tâches soumises [{title, description}]
            corpus: Liste de tâches existantes en base

        Returns:
            Liste de résultats par tâche soumise
        """
        results = []
        for item in submitted:
            matches = self.compute_similarity(
                item["title"], item["description"], corpus
            )
            results.append(
                {
                    "title": item["title"],
                    "description": item["description"],
                    "matches": matches,
                }
            )
        return results


# Instance globale du moteur
similarity_engine = SimilarityEngine()
