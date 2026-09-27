from datetime import datetime

from fastapi import APIRouter, Depends
from pymongo.database import Database

from .. import schemas
from ..deps import get_current_user, get_db
from ..logging_config import get_logger
from ..repositories.genre_repo import GenreRepository
from ..repositories.series_repo import SeriesRepository

router = APIRouter(prefix="/api", tags=["data"])
logger = get_logger()


@router.get("/export", response_model=schemas.ExportData)
def export_data(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)
):
    series_repo = SeriesRepository(db)
    genre_repo = GenreRepository(db)
    user_id = str(current_user["_id"])

    genres = genre_repo.list_by_user(user_id)
    genre_map = {str(g["_id"]): g["name"] for g in genres}

    series_list = series_repo.list_all_by_user_raw(user_id)
    export_series = []
    for s in series_list:
        export_series.append(
            {
                "title": s["title"],
                "series_type": s.get("series_type", "other"),
                "status": s.get("status", "planning"),
                "current_progress": s.get("current_progress", 0),
                "total_progress": s.get("total_progress"),
                "rating": s.get("rating"),
                "notes": s.get("notes"),
                "cover_url": s.get("cover_url"),
                "genres": [
                    genre_map[str(gid)]
                    for gid in s.get("genre_ids", [])
                    if str(gid) in genre_map
                ],
                "sources": s.get("sources", []),
                "created_at": s.get("created_at"),
            }
        )

    logger.info(
        f"Data exported by {current_user['username']}: {len(export_series)} series, "
        f"{len(genres)} genres"
    )

    return {
        "version": "2.0",
        "exported_at": datetime.utcnow(),
        "user": {"username": current_user["username"], "email": current_user["email"]},
        "genres": [g["name"] for g in genres],
        "series": export_series,
    }


@router.post("/import", response_model=schemas.ImportResult)
def import_data(
    payload: schemas.ExportData,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    series_repo = SeriesRepository(db)
    genre_repo = GenreRepository(db)
    user_id = str(current_user["_id"])

    existing_genres = genre_repo.list_by_user(user_id)
    genre_name_to_id = {g["name"].lower(): str(g["_id"]) for g in existing_genres}

    genres_created = 0
    all_genre_names = set(payload.genres) | {
        g for s in payload.series for g in s.genres
    }
    for name in all_genre_names:
        if not name or name.lower() in genre_name_to_id:
            continue
        try:
            new_genre, created = genre_repo.create(user_id, name)
            genre_name_to_id[name.lower()] = str(new_genre["_id"])
            if created:
                genres_created += 1
        except Exception as e:
            logger.warning(f"Skipped genre during import ('{name}'): {e}")

    imported = 0
    skipped = 0

    for s in payload.series:
        if series_repo.title_exists(user_id, s.title, s.series_type):
            skipped += 1
            continue

        genre_ids = [
            genre_name_to_id[g.lower()]
            for g in s.genres
            if g.lower() in genre_name_to_id
        ]

        series_data = {
            "title": s.title,
            "series_type": s.series_type,
            "status": s.status,
            "current_progress": s.current_progress,
            "total_progress": s.total_progress,
            "rating": s.rating,
            "notes": s.notes,
            "cover_url": s.cover_url,
            "genre_ids": genre_ids,
            "sources": [src.model_dump() for src in s.sources],
        }
        series_repo.create(user_id, series_data)
        if genre_ids:
            genre_repo.increment_usage(genre_ids)
        imported += 1

    logger.info(
        f"Data imported by {current_user['username']}: {imported} imported, "
        f"{skipped} skipped, {genres_created} genres created"
    )

    return {"imported": imported, "skipped": skipped, "genres_created": genres_created}
