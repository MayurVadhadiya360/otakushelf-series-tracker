from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from .. import schemas
from ..deps import get_current_user, get_db
from ..logging_config import get_logger
from ..repositories.genre_repo import GenreRepository
from ..repositories.series_repo import SeriesRepository
from ..serializers import doc_to_series_out

router = APIRouter(prefix="/api/series", tags=["series"])
logger = get_logger()


@router.get("", response_model=list[schemas.SeriesOut])
def list_series(
    series_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    genre_id: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = "updated_desc",
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = SeriesRepository(db)
    items = repo.list_by_user(
        str(current_user["_id"]),
        series_type=series_type,
        status=status_filter,
        genre_id=genre_id,
        search=search,
        sort=sort,
    )
    return [doc_to_series_out(i) for i in items]


@router.get("/stats", response_model=schemas.SeriesStats)
def series_stats(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)
):
    repo = SeriesRepository(db)
    return repo.get_stats(str(current_user["_id"]))


@router.post("", response_model=schemas.SeriesOut, status_code=status.HTTP_201_CREATED)
def create_series(
    series_in: schemas.SeriesCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = SeriesRepository(db)
    genre_repo = GenreRepository(db)

    data = series_in.model_dump()
    for src in data.get("sources", []):
        if not src.get("date_added"):
            src["date_added"] = datetime.utcnow()

    series = repo.create(str(current_user["_id"]), data)
    if data.get("genre_ids"):
        genre_repo.increment_usage(data["genre_ids"])

    logger.info(f"Series created by {current_user['username']}: {series_in.title}")
    return doc_to_series_out(series)


@router.get("/{series_id}", response_model=schemas.SeriesOut)
def get_series(
    series_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = SeriesRepository(db)
    series = repo.get_by_id(str(current_user["_id"]), series_id)
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return doc_to_series_out(series)


@router.put("/{series_id}", response_model=schemas.SeriesOut)
def update_series(
    series_id: str,
    series_in: schemas.SeriesUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = SeriesRepository(db)
    genre_repo = GenreRepository(db)

    existing = repo.get_by_id(str(current_user["_id"]), series_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Series not found")

    update_data = series_in.model_dump(exclude_unset=True)

    if "sources" in update_data and update_data["sources"] is not None:
        for src in update_data["sources"]:
            if not src.get("date_added"):
                src["date_added"] = datetime.utcnow()

    updated = repo.update(str(current_user["_id"]), series_id, update_data)

    # Track usage counts for any newly-added genres.
    if "genre_ids" in update_data and update_data["genre_ids"]:
        old_ids = {str(g) for g in existing.get("genre_ids", [])}
        new_ids = [g for g in update_data["genre_ids"] if g not in old_ids]
        if new_ids:
            genre_repo.increment_usage(new_ids)

    logger.info(f"Series updated by {current_user['username']}: {series_id}")
    return doc_to_series_out(updated)


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_series(
    series_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = SeriesRepository(db)
    if not repo.delete(str(current_user["_id"]), series_id):
        raise HTTPException(status_code=404, detail="Series not found")
    logger.info(f"Series deleted by {current_user['username']}: {series_id}")
    return None
