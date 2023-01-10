import httpx

from app import config, store


class UpstreamError(Exception):
    pass


def _get(path: str, params: dict) -> dict:
    cache_key = f"cg:{path}:{sorted(params.items())}"
    cached = store.cache_get(cache_key, config.PRICE_CACHE_TTL)
    if cached is not None:
        return cached

    try:
        resp = httpx.get(f"{config.COINGECKO_BASE_URL}{path}", params=params, timeout=10)
    except httpx.HTTPError as exc:
        stale = store.cache_get_stale(cache_key)
        if stale is not None:
            return stale
        raise UpstreamError(f"coingecko unreachable: {exc}") from exc

    if resp.status_code == 429:
        stale = store.cache_get_stale(cache_key)
        if stale is not None:
            return stale
        raise UpstreamError("coingecko rate limited and nothing cached yet")

    if resp.status_code != 200:
        raise UpstreamError(f"coingecko returned {resp.status_code}")

    data = resp.json()
    store.cache_put(cache_key, data)
    return data


def simple_price(ids: list[str]) -> dict:
    return _get("/simple/price", {
        "ids": ",".join(sorted(ids)),
        "vs_currencies": "usd",
        "include_24hr_change": "true",
    })


def token_prices(mints: list[str]) -> dict:
    if not mints:
        return {}
    return _get("/simple/token_price/solana", {
        "contract_addresses": ",".join(sorted(mints)),
        "vs_currencies": "usd",
    })
