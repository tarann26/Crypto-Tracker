import time

import httpx

from app import config, store


class RpcError(Exception):
    pass


def _rpc(method: str, params: list):
    last_err: Exception | None = None
    for url in config.SOLANA_RPC_URLS:
        try:
            resp = httpx.post(
                url,
                json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
                timeout=15,
            )
        except httpx.HTTPError as exc:
            last_err = exc
            continue

        if resp.status_code != 200:
            last_err = RpcError(f"{url} returned {resp.status_code}")
            continue

        try:
            body = resp.json()
        except ValueError as exc:
            raise RpcError(f"{url} returned non-json body") from exc

        if "error" in body:
            raise RpcError(f"rpc error: {body['error'].get('message')}")
        return body["result"]

    raise RpcError(f"all rpc endpoints failed: {last_err}")


def get_sol_balance(address: str) -> int:
    return _rpc("getBalance", [address])["value"]


def get_token_accounts(address: str) -> list[dict]:
    result = _rpc("getTokenAccountsByOwner", [
        address,
        {"programId": config.TOKEN_PROGRAM_ID},
        {"encoding": "jsonParsed"},
    ])

    out = []
    for acc in result["value"]:
        info = acc["account"]["data"]["parsed"]["info"]
        amt = info["tokenAmount"]
        if float(amt["uiAmountString"]) == 0:
            continue
        out.append({
            "mint": info["mint"],
            "amount": float(amt["uiAmountString"]),
            "decimals": amt["decimals"],
        })
    return out


def get_mint_decimals(mint: str) -> int:
    if mint == config.WSOL_MINT:
        return 9

    key = f"decimals:{mint}"
    cached = store.cache_get(key, ttl=86400)
    if cached is not None:
        return cached

    decimals = _rpc("getTokenSupply", [mint])["value"]["decimals"]
    store.cache_put(key, decimals)
    return decimals


def get_signatures(address: str, limit: int = 20) -> list[dict]:
    return _rpc("getSignaturesForAddress", [address, {"limit": limit}])


def send_transaction(signed_b64: str) -> str:
    return _rpc("sendTransaction", [signed_b64, {"encoding": "base64"}])


def wait_for_confirmation(signature: str, timeout: float = config.CONFIRM_TIMEOUT) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        status = _rpc("getSignatureStatuses", [[signature]])["value"][0]
        if status is not None:
            if status.get("err") is not None:
                return {"signature": signature, "status": "failed", "error": str(status["err"])}
            if status.get("confirmationStatus") in ("confirmed", "finalized"):
                return {"signature": signature, "status": "confirmed", "error": None}
        time.sleep(2)

    return {"signature": signature, "status": "timeout", "error": f"no confirmation within {int(timeout)}s"}
