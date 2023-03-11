import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

WSOL = "So11111111111111111111111111111111111111112"
USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote"

JUP_QUOTE = {
    "inputMint": WSOL,
    "inAmount": "1500000000",
    "outputMint": USDC,
    "outAmount": "225000000",
    "priceImpactPct": "0.001",
    "routePlan": [],
}


@respx.mock
def test_quote_converts_ui_amount_and_usdc_decimals():
    def handler(request):
        assert request.url.params["inputMint"] == WSOL
        assert request.url.params["outputMint"] == USDC
        assert request.url.params["amount"] == "1500000000"  # 1.5 sol, 9 decimals
        assert request.url.params["slippageBps"] == "50"
        return httpx.Response(200, json=JUP_QUOTE)

    respx.get(QUOTE_URL).mock(side_effect=handler)
    resp = client.get("/api/trade/quote",
                      params={"input_mint": WSOL, "amount": 1.5})
    assert resp.status_code == 200
    data = resp.json()
    assert data["out_amount_ui"] == 225.0
    assert data["price_impact_pct"] == 0.001
    assert "quoted_at" in data
    assert data["quote"] == JUP_QUOTE


@respx.mock
def test_jupiter_error_is_502():
    respx.get(QUOTE_URL).mock(return_value=httpx.Response(400, text="no route"))
    resp = client.get("/api/trade/quote",
                      params={"input_mint": WSOL, "amount": 1.5})
    assert resp.status_code == 502


def test_zero_amount_is_400():
    resp = client.get("/api/trade/quote",
                      params={"input_mint": WSOL, "amount": 0})
    assert resp.status_code == 400
