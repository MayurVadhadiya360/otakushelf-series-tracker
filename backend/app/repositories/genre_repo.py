from datetime import datetime
from typing import List, Optional, Tuple

from bson import ObjectId
from pymongo import ASCENDING
from pymongo.database import Database

MAX_GENRES_PER_USER = 200


class GenreLimitError(Exception):
    """Raised when a user tries to exceed MAX_GENRES_PER_USER."""


class GenreRepository:
    def __init__(self, db: Database):
        self.collection = db["genres"]

    def create_many(self, user_id: str, names: List[str]) -> None:
        """Bulk-insert the default genre set for a brand-new account."""
        now = datetime.utcnow()
        docs = [
            {
                "user_id": ObjectId(user_id),
                "name": name,
                "color": None,
                "created_at": now,
                "usage_count": 0,
            }
            for name in names
        ]
        if docs:
            self.collection.insert_many(docs)

    def create(
        self, user_id: str, name: str, color: Optional[str] = None
    ) -> Tuple[dict, bool]:
        """Returns (genre_doc, created). If a genre with the same name
        (case-insensitive) already exists, returns it instead of duplicating."""
        existing = self.collection.find_one(
            {
                "user_id": ObjectId(user_id),
                "name": {"$regex": f"^{_escape_regex(name)}$", "$options": "i"},
            }
        )
        if existing:
            return existing, False

        count = self.collection.count_documents({"user_id": ObjectId(user_id)})
        if count >= MAX_GENRES_PER_USER:
            raise GenreLimitError(
                f"You've reached the maximum of {MAX_GENRES_PER_USER} genres."
            )

        doc = {
            "user_id": ObjectId(user_id),
            "name": name,
            "color": color,
            "created_at": datetime.utcnow(),
            "usage_count": 0,
        }
        result = self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc, True

    def list_by_user(self, user_id: str) -> List[dict]:
        return list(
            self.collection.find({"user_id": ObjectId(user_id)}).sort(
                "name", ASCENDING
            )
        )

    def get_by_id(self, user_id: str, genre_id: str) -> Optional[dict]:
        return self.collection.find_one(
            {"_id": ObjectId(genre_id), "user_id": ObjectId(user_id)}
        )

    def update(
        self,
        user_id: str,
        genre_id: str,
        name: Optional[str] = None,
        color: Optional[str] = None,
    ) -> Optional[dict]:
        update_fields = {}
        if name is not None:
            update_fields["name"] = name
        if color is not None:
            update_fields["color"] = color
        if not update_fields:
            return self.get_by_id(user_id, genre_id)

        return self.collection.find_one_and_update(
            {"_id": ObjectId(genre_id), "user_id": ObjectId(user_id)},
            {"$set": update_fields},
            return_document=True,
        )

    def delete(self, user_id: str, genre_id: str) -> bool:
        result = self.collection.delete_one(
            {"_id": ObjectId(genre_id), "user_id": ObjectId(user_id)}
        )
        return result.deleted_count > 0

    def increment_usage(self, genre_ids: List[str], amount: int = 1) -> None:
        if not genre_ids:
            return
        oids = [ObjectId(g) for g in genre_ids]
        self.collection.update_many(
            {"_id": {"$in": oids}}, {"$inc": {"usage_count": amount}}
        )


def _escape_regex(text: str) -> str:
    import re

    return re.escape(text)
