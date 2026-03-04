from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.task import Task
from app.schemas.schemas import TaskCreate, TaskUpdate


def get_tasks_by_user(db: Session, user_id: int) -> List[Task]:
    return db.query(Task).filter(Task.owner_id == user_id).all()


def get_task_by_id(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id, Task.owner_id == user_id).first()


def create_task(db: Session, task_data: TaskCreate, user_id: int) -> Task:
    task = Task(
        title=task_data.title,
        description=task_data.description,
        owner_id=user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def create_tasks_bulk(db: Session, tasks_data: List[dict], user_id: int) -> List[Task]:
    tasks = [
        Task(title=t["title"], description=t["description"], owner_id=user_id)
        for t in tasks_data
    ]
    db.add_all(tasks)
    db.commit()
    for t in tasks:
        db.refresh(t)
    return tasks


def update_task(db: Session, task_id: int, user_id: int, update_data: TaskUpdate) -> Optional[Task]:
    task = get_task_by_id(db, task_id, user_id)
    if not task:
        return None
    if update_data.title is not None:
        task.title = update_data.title
    if update_data.description is not None:
        task.description = update_data.description
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int, user_id: int) -> bool:
    task = get_task_by_id(db, task_id, user_id)
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True


def get_all_tasks_as_corpus(db: Session, user_id: int) -> List[dict]:
    """Retourne toutes les tâches de l'utilisateur formatées pour le moteur ML."""
    tasks = get_tasks_by_user(db, user_id)
    return [{"id": t.id, "title": t.title, "description": t.description} for t in tasks]
