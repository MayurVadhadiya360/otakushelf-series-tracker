from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.database import Database

from .. import schemas
from ..default_genres import DEFAULT_GENRES
from ..deps import get_current_user, get_db
from ..logging_config import get_logger
from ..repositories.genre_repo import GenreRepository
from ..repositories.user_repo import UserRepository
from ..security import create_access_token, hash_password, verify_password
from ..serializers import doc_to_user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = get_logger()


@router.post(
    "/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED
)
def register(user_in: schemas.UserRegister, db: Database = Depends(get_db)):
    user_repo = UserRepository(db)
    genre_repo = GenreRepository(db)

    existing = user_repo.find_existing(user_in.username, user_in.email)
    if existing:
        logger.warning(
            f"Registration rejected — username/email already in use: {user_in.username}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with that username or email already exists.",
        )

    user = user_repo.create(
        user_in.username, user_in.email, hash_password(user_in.password)
    )

    # Seed the account with the standard genre list; the user can rename,
    # delete, or add to these later from Settings.
    genre_repo.create_many(str(user["_id"]), DEFAULT_GENRES)

    logger.info(f"New user registered: {user_in.username}")
    return doc_to_user_out(user)


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.find_by_username_or_email(form_data.username)

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user["_id"])})
    logger.info(f"User logged in: {user['username']}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: dict = Depends(get_current_user)):
    return doc_to_user_out(current_user)
