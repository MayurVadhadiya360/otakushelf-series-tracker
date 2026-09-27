"""
Converts raw PyMongo documents (with ObjectId fields) into plain dicts
that match our Pydantic *Out schemas (string ids, no ObjectId leaking out).
"""


def doc_to_user_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "email": doc["email"],
        "theme_preference": doc.get("theme_preference", "indigo_dark"),
        "created_at": doc["created_at"],
    }


def doc_to_genre_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "color": doc.get("color"),
        "usage_count": doc.get("usage_count", 0),
        "created_at": doc["created_at"],
    }


def doc_to_series_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "series_type": doc.get("series_type", "other"),
        "status": doc.get("status", "planning"),
        "current_progress": doc.get("current_progress", 0),
        "total_progress": doc.get("total_progress"),
        "rating": doc.get("rating"),
        "notes": doc.get("notes"),
        "cover_url": doc.get("cover_url"),
        "genre_ids": [str(g) for g in doc.get("genre_ids", [])],
        "sources": doc.get("sources", []),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
    }
