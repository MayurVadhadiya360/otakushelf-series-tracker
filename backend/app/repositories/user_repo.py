from datetime import datetime
from typing import Optional

from bson import ObjectId
from pymongo.database import Database

DEFAULT_THEME = "indigo_dark"


class UserRepository:
    def __init__(self, db: Database):
        self.collection = db["users"]

    def create(self, username: str, email: str, hashed_password: str) -> dict:
        now = datetime.utcnow()
        doc = {
            "username": username,
            "email": email,
            "hashed_password": hashed_password,
            "theme_preference": DEFAULT_THEME,
            "created_at": now,
            "updated_at": now,
        }
        result = self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    def find_existing(self, username: str, email: str) -> Optional[dict]:
        """Used at registration to check for a clash on either field."""
        return self.collection.find_one(
            {"$or": [{"username": username}, {"email": email}]}
        )

    def find_by_username_or_email(self, identifier: str) -> Optional[dict]:
        return self.collection.find_one(
            {"$or": [{"username": identifier}, {"email": identifier}]}
        )

    def find_by_id(self, user_id: str) -> Optional[dict]:
        return self.collection.find_one({"_id": ObjectId(user_id)})

    def update_theme(self, user_id: str, theme: str) -> Optional[dict]:
        return self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": {"theme_preference": theme, "updated_at": datetime.utcnow()}},
            return_document=True,
        )
