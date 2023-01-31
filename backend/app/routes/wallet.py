from fastapi import APIRouter, HTTPException

from app.services import coingecko, solana

router = APIRouter()

_BASE58_ALPHABET = set('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz')


def _validate(address: str) -> None:
    if not (32 <= len(address) <= 44) or not set(address) <= _BASE58_ALPHABET:
        raise HTTPException(status_code=400, detail='not a valid solana address')


@router.get("/api/wallet/{address}/balances")
def balances(address: str):
    _validate(address)

    try:
        lamports = solana.get_sol_balance(address)
        tokens = solana.get_token_accounts(address)
    except solana.RpcError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    sol_amount = lamports / 1e9
    sol_usd = None
    token_usd = {}
    try:
        sol_usd = coingecko.simple_price(["solana"]).get("solana", {}).get("usd")
        token_usd = coingecko.token_prices([t["mint"] for t in tokens])
    except coingecko.UpstreamError:
        pass  # balances are still useful without usd values

    for t in tokens:
        price = token_usd.get(t["mint"]) or token_usd.get(t["mint"].lower()) or {}
        t["usd"] = round(t["amount"] * price["usd"], 2) if "usd" in price else None

    return {
        "sol": {
            "lamports": lamports,
            "amount": sol_amount,
            "usd": round(sol_amount * sol_usd, 2) if sol_usd else None,
        },
        "tokens": tokens,
    }
