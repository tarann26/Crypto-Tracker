import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app
from app.services import coingecko

client = TestClient(app)

PRICE_URL = "https://api.coingecko.com/api/v3/simple/price"


@respx.mock
def test_prices_proxies_coingecko():
    respx.get(PRICE_URL).mock(
        return_value=httpx.Response(200, json={"solana": {"usd": 150.0}})
    )
    resp = client.get("/api/prices", params={"ids": "solana"})
    assert resp.status_code == 200
    assert resp.json()["solana"]["usd"] == 150.0


@respx.mock
def test_prices_cached_second_call_no_upstream_hit():
    route = respx.get(PRICE_URL).mock(
        return_value=httpx.Response(200, json={"solana": {"usd": 150.0}})
    )
    client.get("/api/prices", params={"ids": "solana"})
    client.get("/api/prices", params={"ids": "solana"})
    assert route.call_count == 1


@respx.mock
def test_rate_limit_serves_stale_cache():
    route = respx.get(PRICE_URL)
    route.mock(return_value=httpx.Response(200, json={"solana": {"usd": 150.0}}))
    coingecko.simple_price(["solana"])
    from app import store
    store._cache = {k: (0.0, v[1]) for k, v in store._cache.items()}  # force-expire
    route.mock(return_value=httpx.Response(429))
    assert coingecko.simple_price(["solana"]) == {"solana": {"usd": 150.0}}


@respx.mock
def test_upstream_down_is_502():
    respx.get(PRICE_URL).mock(return_value=httpx.Response(500))
    resp = client.get("/api/prices", params={"ids": "solana"})
    assert resp.status_code == 502


@respx.mock
def test_non_json_body_is_502():
    respx.get(PRICE_URL).mock(return_value=httpx.Response(200, text="not json"))
    resp = client.get("/api/prices", params={"ids": "solana"})
    assert resp.status_code == 502


def test_empty_ids_is_400():
    resp = client.get("/api/prices", params={"ids": " , "})
    assert resp.status_code == 400
