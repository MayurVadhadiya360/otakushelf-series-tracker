from fastapi import APIRouter, Depends
from pymongo.database import Database

from .. import schemas
from ..deps import get_current_user, get_db
from ..logging_config import get_logger
from ..repositories.user_repo import UserRepository
from ..serializers import doc_to_user_out

router = APIRouter(prefix="/api/users", tags=["users"])
logger = get_logger()

VALID_THEMES = schemas.VALID_THEMES
DEFAULT_THEME = "indigo_dark"


@router.put("/me/theme", response_model=schemas.UserOut)
def update_theme(
    payload: schemas.ThemeUpdate,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    theme = payload.theme_preference if payload.theme_preference in VALID_THEMES else DEFAULT_THEME

    user_repo = UserRepository(db)
    updated = user_repo.update_theme(str(current_user["_id"]), theme)
    logger.info(f"User {current_user['username']} switched theme to {theme}")
    return doc_to_user_out(updated)
