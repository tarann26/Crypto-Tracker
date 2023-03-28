import time
from dataclasses import asdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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


class PaperTradeRequest(BaseModel):
    session_id: str
    input_mint: str
    symbol: str | None = None
    amount: float = Field(gt=0)


@router.post("/api/trade/paper")
def paper_trade(req: PaperTradeRequest):
    session = store.get_or_create_session(req.session_id)
    try:
        q = jupiter.get_quote(req.input_mint, req.amount)
    except (jupiter.QuoteError, solana.RpcError) as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    trade = store.PaperTrade(
        mint=req.input_mint,
        symbol=req.symbol,
        amount=req.amount,
        quote_usdc=q["out_amount_ui"],
        price_at_fill=q["out_amount_ui"] / req.amount,
        timestamp=time.time(),
    )
    session.paper_trades.append(trade)
    return {"trade": asdict(trade) | {"note": "paper fill recorded, nothing sent on chain"}}


class SwapRequest(BaseModel):
    user_public_key: str
    input_mint: str
    amount: float = Field(gt=0)
    slippage_bps: int = Field(default=50, ge=1, le=1000)


@router.post("/api/trade/swap")
def build_swap(req: SwapRequest):
    try:
        q = jupiter.get_quote(req.input_mint, req.amount, req.slippage_bps)
        tx = jupiter.build_swap_transaction(q["quote"], req.user_public_key)
    except (jupiter.QuoteError, solana.RpcError) as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {"swap_transaction": tx, "quote": q}


class ExecuteRequest(BaseModel):
    signed_transaction: str


@router.post("/api/trade/execute")
def execute(req: ExecuteRequest):
    try:
        signature = solana.send_transaction(req.signed_transaction)
    except solana.RpcError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return solana.wait_for_confirmation(signature)


@router.get("/api/trade/paper")
def paper_ledger(session_id: str):
    session = store.get_or_create_session(session_id)
    trades = []
    total_pnl = 0.0

    for t in session.paper_trades:
        current_usdc = None
        pnl = None
        try:
            live = jupiter.get_quote(t.mint, t.amount)
            current_usdc = live["out_amount_ui"]
            pnl = round(t.quote_usdc - current_usdc, 2)
            total_pnl += pnl
        except (jupiter.QuoteError, solana.RpcError):
            pass
        trades.append(asdict(t) | {"current_usdc": current_usdc, "pnl_usdc": pnl})

    return {
        "trades": trades,
        "total_pnl_usdc": round(total_pnl, 2),
        "note": "pnl is what the sell locked in versus holding to now",
    }
