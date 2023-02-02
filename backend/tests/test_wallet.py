import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADDR = "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"
MINT = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
RPC = "https://api.mainnet-beta.solana.com"
RPC2 = "https://solana-rpc.publicnode.com"


def rpc_response(result):
    return httpx.Response(200, json={"jsonrpc": "2.0", "id": 1, "result": result})


def balances_handler(request):
    body = request.read().decode()
    if "getBalance" in body:
        return rpc_response({"context": {}, "value": 2_500_000_000})
    if "getTokenAccountsByOwner" in body:
        return rpc_response({"value": [{
            "account": {"data": {"parsed": {"info": {
                "mint": MINT,
                "tokenAmount": {"uiAmountString": "12.5", "decimals": 6},
            }}}},
        }, {
            "account": {"data": {"parsed": {"info": {
                "mint": "zerozerozerozerozerozerozerozero11111111111",
                "tokenAmount": {"uiAmountString": "0", "decimals": 6},
            }}}},
        }]})
    raise AssertionError(f"unexpected rpc call: {body[:80]}")


@respx.mock
def test_balances_happy_path():
    respx.post(RPC).mock(side_effect=balances_handler)
    respx.get("https://api.coingecko.com/api/v3/simple/price").mock(
        return_value=httpx.Response(200, json={"solana": {"usd": 100.0}})
    )
    respx.get("https://api.coingecko.com/api/v3/simple/token_price/solana").mock(
        return_value=httpx.Response(200, json={MINT: {"usd": 2.0}})
    )
    resp = client.get(f"/api/wallet/{ADDR}/balances")
    assert resp.status_code == 200
    data = resp.json()
    assert data["sol"] == {"lamports": 2_500_000_000, "amount": 2.5, "usd": 250.0}
    assert data["tokens"] == [
        {"mint": MINT, "amount": 12.5, "decimals": 6, "usd": 25.0}
    ]  # zero-balance account filtered out


@respx.mock
def test_balances_without_prices_still_works():
    respx.post(RPC).mock(side_effect=balances_handler)
    respx.get("https://api.coingecko.com/api/v3/simple/price").mock(
        return_value=httpx.Response(500)
    )
    respx.get("https://api.coingecko.com/api/v3/simple/token_price/solana").mock(
        return_value=httpx.Response(500)
    )
    resp = client.get(f"/api/wallet/{ADDR}/balances")
    assert resp.status_code == 200
    assert resp.json()["sol"]["usd"] is None
    assert resp.json()["tokens"][0]["usd"] is None


@respx.mock
def test_rpc_failover_to_second_endpoint():
    respx.post(RPC).mock(return_value=httpx.Response(500))
    respx.post(RPC2).mock(side_effect=balances_handler)
    respx.get("https://api.coingecko.com/api/v3/simple/price").mock(
        return_value=httpx.Response(500)
    )
    respx.get("https://api.coingecko.com/api/v3/simple/token_price/solana").mock(
        return_value=httpx.Response(500)
    )
    resp = client.get(f"/api/wallet/{ADDR}/balances")
    assert resp.status_code == 200


@respx.mock
def test_all_rpcs_down_is_502():
    respx.post(RPC).mock(return_value=httpx.Response(500))
    respx.post(RPC2).mock(return_value=httpx.Response(500))
    resp = client.get(f"/api/wallet/{ADDR}/balances")
    assert resp.status_code == 502


def test_bad_address_is_400():
    resp = client.get("/api/wallet/not-an-address!/balances")
    assert resp.status_code == 400
