import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

WSOL = "So11111111111111111111111111111111111111112"
USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote"


def jup_quote(out_amount: str):
    return httpx.Response(200, json={
        "inputMint": WSOL,
        "inAmount": "1000000000",
        "outputMint": USDC,
        "outAmount": out_amount,
        "priceImpactPct": "0",
        "routePlan": [],
    })


@respx.mock
def test_paper_trade_records_fill():
    respx.get(QUOTE_URL).mock(return_value=jup_quote("150000000"))
    resp = client.post("/api/trade/paper", json={
        "session_id": "s1", "input_mint": WSOL, "symbol": "SOL", "amount": 1.0,
    })
    assert resp.status_code == 200
    trade = resp.json()["trade"]
    assert trade["quote_usdc"] == 150.0
    assert trade["price_at_fill"] == 150.0
    assert trade["symbol"] == "SOL"


@respx.mock
def test_ledger_computes_pnl_against_live_quote():
    respx.get(QUOTE_URL).mock(return_value=jup_quote("150000000"))
    client.post("/api/trade/paper", json={
        "session_id": "s1", "input_mint": WSOL, "amount": 1.0,
    })
    respx.get(QUOTE_URL).mock(return_value=jup_quote("120000000"))  # price dropped
    resp = client.get("/api/trade/paper", params={"session_id": "s1"})
    data = resp.json()
    assert data["trades"][0]["current_usdc"] == 120.0
    assert data["trades"][0]["pnl_usdc"] == 30.0
    assert data["total_pnl_usdc"] == 30.0


def test_ledger_empty_for_fresh_session():
    resp = client.get("/api/trade/paper", params={"session_id": "nope"})
    assert resp.json()["trades"] == []


def test_paper_trade_rejects_bad_amount():
    resp = client.post("/api/trade/paper", json={
        "session_id": "s1", "input_mint": WSOL, "amount": -3,
    })
    assert resp.status_code == 422
