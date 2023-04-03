import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

WSOL = "So11111111111111111111111111111111111111112"
USER = "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"
QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote"
SWAP_URL = "https://lite-api.jup.ag/swap/v1/swap"
RPC = "https://api.mainnet-beta.solana.com"

JUP_QUOTE = {
    "inputMint": WSOL, "inAmount": "1000000000",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "outAmount": "150000000", "priceImpactPct": "0", "routePlan": [],
}


@respx.mock
def test_swap_returns_transaction_for_signing():
    respx.get(QUOTE_URL).mock(return_value=httpx.Response(200, json=JUP_QUOTE))

    def swap_handler(request):
        import json
        body = json.loads(request.read())
        assert body["userPublicKey"] == USER
        assert body["quoteResponse"] == JUP_QUOTE
        assert body["wrapAndUnwrapSol"] is True
        return httpx.Response(200, json={"swapTransaction": "b64txbytes=="})

    respx.post(SWAP_URL).mock(side_effect=swap_handler)
    resp = client.post("/api/trade/swap", json={
        "user_public_key": USER, "input_mint": WSOL, "amount": 1.0,
    })
    assert resp.status_code == 200
    assert resp.json()["swap_transaction"] == "b64txbytes=="


@respx.mock
def test_execute_broadcasts_and_confirms():
    calls = {"n": 0}

    def rpc_handler(request):
        body = request.read().decode()
        if "sendTransaction" in body:
            return httpx.Response(200, json={
                "jsonrpc": "2.0", "id": 1, "result": "thesig",
            })
        calls["n"] += 1
        status = None if calls["n"] == 1 else {
            "err": None, "confirmationStatus": "confirmed",
        }
        return httpx.Response(200, json={
            "jsonrpc": "2.0", "id": 1, "result": {"value": [status]},
        })

    respx.post(RPC).mock(side_effect=rpc_handler)
    resp = client.post("/api/trade/execute", json={"signed_transaction": "c2lnbmVk"})
    assert resp.status_code == 200
    assert resp.json() == {"signature": "thesig", "status": "confirmed", "error": None}


@respx.mock
def test_execute_reports_onchain_failure():
    def rpc_handler(request):
        body = request.read().decode()
        if "sendTransaction" in body:
            return httpx.Response(200, json={
                "jsonrpc": "2.0", "id": 1, "result": "badsig",
            })
        return httpx.Response(200, json={
            "jsonrpc": "2.0", "id": 1,
            "result": {"value": [{"err": {"InstructionError": [0, "Custom"]},
                                  "confirmationStatus": "confirmed"}]},
        })

    respx.post(RPC).mock(side_effect=rpc_handler)
    resp = client.post("/api/trade/execute", json={"signed_transaction": "c2lnbmVk"})
    assert resp.json()["status"] == "failed"
