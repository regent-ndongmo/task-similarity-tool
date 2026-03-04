from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io

from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import TaskCreate, TaskOut, TaskUpdate
from app.services import task_service
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TaskOut], summary="Lister mes tâches")
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne toutes les tâches de l'utilisateur connecté."""
    return task_service.get_tasks_by_user(db, current_user.id)


@router.post("/", response_model=TaskOut, status_code=201, summary="Créer une tâche")
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crée une nouvelle tâche dans la base de données.
    - **title**: Titre de la tâche (obligatoire)
    - **description**: Description détaillée (obligatoire)
    """
    return task_service.create_task(db, task_data, current_user.id)


@router.get("/{task_id}", response_model=TaskOut, summary="Détail d'une tâche")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.get_task_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return task


@router.put("/{task_id}", response_model=TaskOut, summary="Modifier une tâche")
def update_task(
    task_id: int,
    update_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_service.update_task(db, task_id, current_user.id, update_data)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return task


@router.delete("/{task_id}", status_code=204, summary="Supprimer une tâche")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not task_service.delete_task(db, task_id, current_user.id):
        raise HTTPException(status_code=404, detail="Tâche non trouvée")


@router.post("/import/file", summary="Importer des tâches depuis CSV ou Excel")
def import_tasks(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Importe des tâches depuis un fichier CSV ou Excel.

    **Colonnes requises** : `title` (ou `titre`) et `description`
    
    Retourne le nombre de tâches importées.
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
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier : {str(e)}")

    # Normalisation des colonnes
    df.columns = df.columns.str.lower().str.strip()
    if "titre" in df.columns:
        df.rename(columns={"titre": "title"}, inplace=True)

    if "title" not in df.columns or "description" not in df.columns:
        raise HTTPException(
            status_code=422,
            detail="Le fichier doit contenir les colonnes 'title' (ou 'titre') et 'description'",
        )

    df = df[["title", "description"]].dropna()
    if df.empty:
        raise HTTPException(status_code=422, detail="Aucune donnée valide trouvée dans le fichier")

    tasks_data = df.to_dict("records")
    created = task_service.create_tasks_bulk(db, tasks_data, current_user.id)
    return {"imported": len(created), "message": f"{len(created)} tâche(s) importée(s) avec succès"}
