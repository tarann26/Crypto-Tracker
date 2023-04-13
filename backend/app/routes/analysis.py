from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import leaders, solana

router = APIRouter()


class LeaderRequest(BaseModel):
    wallets: list[str] = Field(min_length=2, max_length=10)
    tx_limit: int = Field(default=50, ge=10, le=200)


@router.post("/api/analysis/leaders")
def analyze(req: LeaderRequest):
    histories = {}
    for w in req.wallets:
        try:
            histories[w] = solana.get_signatures(w, limit=req.tx_limit)
        except solana.RpcError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    return leaders.detect_leaders(histories)
