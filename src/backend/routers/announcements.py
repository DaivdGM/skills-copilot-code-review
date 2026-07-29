"""
Announcement endpoints for the High School Management System API
"""

from datetime import date
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


class AnnouncementPayload(BaseModel):
    """Payload for creating and updating announcements."""

    message: str = Field(min_length=1, max_length=500)
    expiration_date: str
    start_date: Optional[str] = None


def _parse_iso_date(value: str, field_name: str) -> date:
    """Parse YYYY-MM-DD date strings and raise a 400 for invalid values."""
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a valid YYYY-MM-DD date"
        ) from exc


def _require_authenticated_teacher(teacher_username: Optional[str]) -> Dict[str, Any]:
    """Ensure the requester is an authenticated teacher account."""
    if not teacher_username:
        raise HTTPException(status_code=401, detail="Authentication required")

    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid teacher credentials")

    return teacher


def _serialize_announcement(announcement: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Mongo document to API-safe payload."""
    return {
        "id": str(announcement["_id"]),
        "message": announcement["message"],
        "start_date": announcement.get("start_date"),
        "expiration_date": announcement["expiration_date"],
        "created_by": announcement.get("created_by")
    }


@router.get("/active", response_model=List[Dict[str, Any]])
def get_active_announcements() -> List[Dict[str, Any]]:
    """List all active announcements visible to everyone."""
    today = date.today().isoformat()
    query = {
        "expiration_date": {"$gte": today},
        "$or": [
            {"start_date": None},
            {"start_date": {"$exists": False}},
            {"start_date": {"$lte": today}}
        ]
    }

    active = announcements_collection.find(query).sort(
        [("expiration_date", 1), ("_id", -1)]
    )
    return [_serialize_announcement(item) for item in active]


@router.get("", response_model=List[Dict[str, Any]])
def get_all_announcements(teacher_username: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    """List all announcements for signed-in users."""
    _require_authenticated_teacher(teacher_username)

    announcements = announcements_collection.find().sort(
        [("expiration_date", 1), ("_id", -1)]
    )
    return [_serialize_announcement(item) for item in announcements]


@router.post("", response_model=Dict[str, Any])
def create_announcement(
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Create a new announcement. Expiration date is required."""
    teacher = _require_authenticated_teacher(teacher_username)

    expiration = _parse_iso_date(payload.expiration_date, "expiration_date")
    start_date = None
    if payload.start_date:
        start_date = _parse_iso_date(payload.start_date, "start_date")
        if start_date > expiration:
            raise HTTPException(
                status_code=400,
                detail="start_date cannot be after expiration_date"
            )

    doc = {
        "message": payload.message.strip(),
        "start_date": start_date.isoformat() if start_date else None,
        "expiration_date": expiration.isoformat(),
        "created_by": teacher["username"]
    }

    result = announcements_collection.insert_one(doc)
    created = announcements_collection.find_one({"_id": result.inserted_id})
    return _serialize_announcement(created)


@router.put("/{announcement_id}", response_model=Dict[str, Any])
def update_announcement(
    announcement_id: str,
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Update an existing announcement by id."""
    _require_authenticated_teacher(teacher_username)

    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement id")

    expiration = _parse_iso_date(payload.expiration_date, "expiration_date")
    start_date = None
    if payload.start_date:
        start_date = _parse_iso_date(payload.start_date, "start_date")
        if start_date > expiration:
            raise HTTPException(
                status_code=400,
                detail="start_date cannot be after expiration_date"
            )

    updated_doc = {
        "message": payload.message.strip(),
        "start_date": start_date.isoformat() if start_date else None,
        "expiration_date": expiration.isoformat()
    }

    result = announcements_collection.update_one(
        {"_id": ObjectId(announcement_id)},
        {"$set": updated_doc}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    announcement = announcements_collection.find_one({"_id": ObjectId(announcement_id)})
    return _serialize_announcement(announcement)


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, str]:
    """Delete an announcement by id."""
    _require_authenticated_teacher(teacher_username)

    if not ObjectId.is_valid(announcement_id):
        raise HTTPException(status_code=400, detail="Invalid announcement id")

    result = announcements_collection.delete_one({"_id": ObjectId(announcement_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted"}
