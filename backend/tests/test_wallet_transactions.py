import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADDR = "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"
RPC = "https://api.mainnet-beta.solana.com"


@respx.mock
def test_transactions_listed():
    respx.post(RPC).mock(return_value=httpx.Response(200, json={
        "jsonrpc": "2.0", "id": 1, "result": [
            {"signature": "sigA", "blockTime": 1700000000, "err": None},
            {"signature": "sigB", "blockTime": None, "err": {"InstructionError": []}},
        ],
    }))
    resp = client.get(f"/api/wallet/{ADDR}/transactions")
    assert resp.status_code == 200
    assert resp.json()["transactions"] == [
        {"signature": "sigA", "block_time": 1700000000, "status": "ok"},
        {"signature": "sigB", "block_time": None, "status": "failed"},
    ]


@respx.mock
def test_limit_is_capped_at_50():
    def handler(request):
        assert b'"limit": 50' in request.read() or b'"limit":50' in request.read()
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": 1, "result": []})
    respx.post(RPC).mock(side_effect=handler)
    resp = client.get(f"/api/wallet/{ADDR}/transactions", params={"limit": 999})
    assert resp.status_code == 200
