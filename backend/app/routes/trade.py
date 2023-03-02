import time

from fastapi import APIRouter, HTTPException

from app import store
from app.services import jupiter, solana

router = APIRouter()


@router.post("/api/session")
def create_session():
    return {"session_id": store.create_session().id}


@router.get("/api/trade/quote")
def quote(input_mint: str, amount: float, slippage_bps: int = 50):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    try:
        q = jupiter.get_quote(input_mint, amount, slippage_bps)
    except (jupiter.QuoteError, solana.RpcError) as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    q["quoted_at"] = time.time()
    return q
