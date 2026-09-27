from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from .. import schemas
from ..deps import get_current_user, get_db
from ..logging_config import get_logger
from ..repositories.genre_repo import GenreLimitError, GenreRepository
from ..repositories.series_repo import SeriesRepository
from ..serializers import doc_to_genre_out

router = APIRouter(prefix="/api/genres", tags=["genres"])
logger = get_logger()


@router.get("", response_model=list[schemas.GenreOut])
def list_genres(
    current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)
):
    repo = GenreRepository(db)
    genres = repo.list_by_user(str(current_user["_id"]))
    return [doc_to_genre_out(g) for g in genres]


@router.post("", response_model=schemas.GenreOut, status_code=status.HTTP_201_CREATED)
def create_genre(
    genre_in: schemas.GenreCreate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = GenreRepository(db)
    try:
        genre, created = repo.create(
            str(current_user["_id"]), genre_in.name.strip(), genre_in.color
        )
    except GenreLimitError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if created:
        logger.info(f"Genre created by {current_user['username']}: {genre_in.name}")
    return doc_to_genre_out(genre)


@router.put("/{genre_id}", response_model=schemas.GenreOut)
def update_genre(
    genre_id: str,
    genre_in: schemas.GenreUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = GenreRepository(db)
    existing = repo.get_by_id(str(current_user["_id"]), genre_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Genre not found")

    updated = repo.update(
        str(current_user["_id"]), genre_id, genre_in.name, genre_in.color
    )
    logger.info(f"Genre updated by {current_user['username']}: {genre_id}")
    return doc_to_genre_out(updated)


@router.delete("/{genre_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_genre(
    genre_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    repo = GenreRepository(db)
    series_repo = SeriesRepository(db)

    if not repo.delete(str(current_user["_id"]), genre_id):
        raise HTTPException(status_code=404, detail="Genre not found")

    series_repo.remove_genre_reference(str(current_user["_id"]), genre_id)

    logger.info(f"Genre deleted by {current_user['username']}: {genre_id}")
    return None
