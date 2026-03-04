from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import TaskCreate, TaskOut, TaskUpdate, FilePreviewResponse
from app.services import task_service
from app.services.file_parser import preview_columns, extract_tasks
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TaskOut], summary="Lister mes tâches")
def list_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retourne toutes les tâches de l'utilisateur connecté."""
    return task_service.get_tasks_by_user(db, current_user.id)


@router.post("/", response_model=TaskOut, status_code=201, summary="Créer une tâche")
def create_task(task_data: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return task_service.create_task(db, task_data, current_user.id)


@router.get("/{task_id}", response_model=TaskOut, summary="Détail d'une tâche")
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = task_service.get_task_by_id(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return task


@router.put("/{task_id}", response_model=TaskOut, summary="Modifier une tâche")
def update_task(task_id: int, update_data: TaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = task_service.update_task(db, task_id, current_user.id, update_data)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return task


@router.delete("/{task_id}", status_code=204, summary="Supprimer une tâche")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not task_service.delete_task(db, task_id, current_user.id):
        raise HTTPException(status_code=404, detail="Tâche non trouvée")


@router.post("/files/preview", response_model=FilePreviewResponse,
             summary="Prévisualiser les colonnes d'un fichier")
def preview_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Lit un fichier CSV/Excel et retourne :
    - la liste de toutes les colonnes disponibles
    - la détection automatique des colonnes titre/description
    - un échantillon des 3 premières lignes
    - si un mapping manuel est nécessaire

    **Utilisez cet endpoint avant d'importer** pour vérifier la détection automatique
    ou pour obtenir la liste des colonnes et choisir manuellement.
    """
    content = file.file.read()
    try:
        info = preview_columns(content, file.filename)
        return FilePreviewResponse(**info)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import/file", summary="Importer des tâches depuis CSV ou Excel")
def import_tasks(
    file: UploadFile = File(...),
    title_col: Optional[str] = Form(None, description="Nom de la colonne titre (optionnel si détection auto)"),
    description_col: Optional[str] = Form(None, description="Nom de la colonne description (optionnel si détection auto)"),
    combine_remaining: bool = Form(False, description="Concaténer toutes les autres colonnes dans la description"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Importe des tâches depuis un fichier **CSV ou Excel**.

    ### Détection automatique des colonnes
    Le parser reconnaît automatiquement les colonnes selon leurs noms :
    - **Titre** : `title`, `titre`, `nom`, `name`, `intitule`, `libelle`, `sujet`, `task`…
    - **Description** : `description`, `desc`, `detail`, `content`, `contenu`, `texte`, `resume`…

    ### Mapping manuel (optionnel)
    Si votre fichier a des colonnes avec des noms non standards, précisez :
    - `title_col` : nom exact de la colonne titre
    - `description_col` : nom exact de la colonne description

    ### Fallback automatique
    Si aucune colonne reconnue n'est trouvée, le parser utilise la 1ère colonne
    comme titre et la 2ème comme description.
    """
    content = file.file.read()
    try:
        tasks_data, mapping = extract_tasks(
            content, file.filename,
            title_col=title_col,
            description_col=description_col,
            combine_remaining=combine_remaining,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not tasks_data:
        raise HTTPException(status_code=422, detail="Aucune donnée valide trouvée dans le fichier")

    created = task_service.create_tasks_bulk(db, tasks_data, current_user.id)
    return {
        "imported": len(created),
        "message": f"{len(created)} tâche(s) importée(s) avec succès",
        "column_mapping": mapping,
    }
