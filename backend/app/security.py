import datetime
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict, expires_delta: Optional[datetime.timedelta] = None
) -> str:
    config = get_config()
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (
        expires_delta
        or datetime.timedelta(minutes=config.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, config.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    config = get_config()
    try:
        return jwt.decode(token, config.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
