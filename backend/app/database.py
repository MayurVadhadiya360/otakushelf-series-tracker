"""
MongoDB connection management using PyMongo (direct driver, no ORM).
"""

from pymongo import MongoClient
from pymongo.database import Database

from .config import get_config
from .logging_config import get_logger

_client: MongoClient = None
_db: Database = None


def get_database() -> Database:
    global _client, _db
    if _db is None:
        config = get_config()
        logger = get_logger()
        try:
            _client = MongoClient(config.mongodb_url, serverSelectionTimeoutMS=10000)
            _client.admin.command("ping")
            _db = _client[config.mongodb_database_name]
            logger.info(
                f"Connected to MongoDB database '{config.mongodb_database_name}'"
            )
            _ensure_indexes(_db)
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}", exc_info=True)
            raise
    return _db


def _ensure_indexes(db: Database) -> None:
    """Create indexes used for uniqueness and query performance. Safe to
    call every startup — create_index is a no-op if the index exists."""
    logger = get_logger()
    try:
        db["users"].create_index("username", unique=True)
        db["users"].create_index("email", unique=True)

        db["series"].create_index([("owner_id", 1), ("updated_at", -1)])
        db["series"].create_index([("owner_id", 1), ("series_type", 1)])
        db["series"].create_index([("owner_id", 1), ("status", 1)])
        db["series"].create_index([("owner_id", 1), ("genre_ids", 1)])
        db["series"].create_index([("owner_id", 1), ("title", 1)])

        db["genres"].create_index([("user_id", 1), ("name", 1)])
        logger.info("MongoDB indexes ensured")
    except Exception as e:
        logger.warning(f"Could not ensure all indexes: {e}")


def close_database() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
