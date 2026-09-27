from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pymongo.database import Database

from .database import get_database
from .repositories.user_repo import UserRepository
from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


def get_db() -> Database:
    return get_database()


def get_user_repo(db: Database = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repo),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user = user_repo.find_by_id(user_id)
    except InvalidId:
        raise credentials_exception

    if user is None:
        raise credentials_exception

    return user
