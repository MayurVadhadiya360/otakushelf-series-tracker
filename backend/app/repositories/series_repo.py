from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from pymongo.database import Database

SORT_MAP = {
    "updated_desc": [("updated_at", DESCENDING)],
    "updated_asc": [("updated_at", ASCENDING)],
    "title_asc": [("title", ASCENDING)],
    "title_desc": [("title", DESCENDING)],
    "rating_desc": [("rating", DESCENDING)],
    "created_desc": [("created_at", DESCENDING)],
}


class SeriesRepository:
    def __init__(self, db: Database):
        self.collection = db["series"]

    def create(self, owner_id: str, data: dict) -> dict:
        now = datetime.utcnow()
        doc = {
            "owner_id": ObjectId(owner_id),
            "title": data["title"],
            "series_type": data.get("series_type", "other"),
            "status": data.get("status", "planning"),
            "current_progress": data.get("current_progress", 0),
            "total_progress": data.get("total_progress"),
            "rating": data.get("rating"),
            "notes": data.get("notes"),
            "cover_url": data.get("cover_url"),
            "genre_ids": [ObjectId(g) for g in data.get("genre_ids", [])],
            "sources": data.get("sources", []),
            "created_at": now,
            "updated_at": now,
        }
        result = self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    def list_by_user(
        self,
        owner_id: str,
        series_type: Optional[str] = None,
        status: Optional[str] = None,
        genre_id: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "updated_desc",
    ) -> List[dict]:
        query: dict = {"owner_id": ObjectId(owner_id)}
        if series_type:
            query["series_type"] = series_type
        if status:
            query["status"] = status
        if genre_id:
            query["genre_ids"] = ObjectId(genre_id)
        if search:
            query["title"] = {"$regex": _escape_regex(search), "$options": "i"}

        sort_order = SORT_MAP.get(sort, SORT_MAP["updated_desc"])
        return list(self.collection.find(query).sort(sort_order))

    def get_by_id(self, owner_id: str, series_id: str) -> Optional[dict]:
        return self.collection.find_one(
            {"_id": ObjectId(series_id), "owner_id": ObjectId(owner_id)}
        )

    def update(self, owner_id: str, series_id: str, update_fields: dict) -> Optional[dict]:
        fields = dict(update_fields)
        if "genre_ids" in fields and fields["genre_ids"] is not None:
            fields["genre_ids"] = [ObjectId(g) for g in fields["genre_ids"]]
        if "sources" in fields and fields["sources"] is not None:
            fields["sources"] = fields["sources"]
        fields["updated_at"] = datetime.utcnow()

        return self.collection.find_one_and_update(
            {"_id": ObjectId(series_id), "owner_id": ObjectId(owner_id)},
            {"$set": fields},
            return_document=True,
        )

    def delete(self, owner_id: str, series_id: str) -> bool:
        result = self.collection.delete_one(
            {"_id": ObjectId(series_id), "owner_id": ObjectId(owner_id)}
        )
        return result.deleted_count > 0

    def get_stats(self, owner_id: str) -> dict:
        pipeline = [
            {"$match": {"owner_id": ObjectId(owner_id)}},
            {
                "$facet": {
                    "total": [{"$count": "count"}],
                    "by_status": [
                        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                    ],
                    "by_type": [
                        {"$group": {"_id": "$series_type", "count": {"$sum": 1}}}
                    ],
                }
            },
        ]
        result = list(self.collection.aggregate(pipeline))
        if not result:
            return {"total": 0, "by_status": {}, "by_type": {}}

        r = result[0]
        return {
            "total": r["total"][0]["count"] if r["total"] else 0,
            "by_status": {i["_id"]: i["count"] for i in r["by_status"] if i["_id"]},
            "by_type": {i["_id"]: i["count"] for i in r["by_type"] if i["_id"]},
        }

    def list_all_by_user_raw(self, owner_id: str) -> List[dict]:
        """Full, unfiltered dump — used for JSON export."""
        return list(self.collection.find({"owner_id": ObjectId(owner_id)}))

    def title_exists(self, owner_id: str, title: str, series_type: str) -> bool:
        return (
            self.collection.count_documents(
                {
                    "owner_id": ObjectId(owner_id),
                    "title": {"$regex": f"^{_escape_regex(title)}$", "$options": "i"},
                    "series_type": series_type,
                },
                limit=1,
            )
            > 0
        )

    def remove_genre_reference(self, owner_id: str, genre_id: str) -> None:
        """Pulls a deleted genre's id out of every series that referenced it,
        so deleting a genre never leaves dangling references behind."""
        self.collection.update_many(
            {"owner_id": ObjectId(owner_id)},
            {"$pull": {"genre_ids": ObjectId(genre_id)}},
        )


def _escape_regex(text: str) -> str:
    import re

    return re.escape(text)
