from fastapi import APIRouter

from app import store

router = APIRouter()


@router.post("/api/session")
def create_session():
    return {"session_id": store.create_session().id}
