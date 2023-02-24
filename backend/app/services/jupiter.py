import httpx

from app import config
from app.services.solana import get_mint_decimals


class QuoteError(Exception):
    pass


def get_quote(input_mint: str, amount_ui: float, slippage_bps: int = 50) -> dict:
    decimals = get_mint_decimals(input_mint)
    raw_amount = int(round(amount_ui * 10 ** decimals))
    if raw_amount <= 0:
        raise QuoteError("amount too small")

    try:
        resp = httpx.get(f"{config.JUPITER_BASE_URL}/quote", params={
            "inputMint": input_mint,
            "outputMint": config.USDC_MINT,
            "amount": str(raw_amount),
            "slippageBps": str(slippage_bps),
        }, timeout=10)
    except httpx.HTTPError as exc:
        raise QuoteError(f"jupiter unreachable: {exc}") from exc

    if resp.status_code != 200:
        raise QuoteError(f"jupiter quote failed ({resp.status_code}): {resp.text[:200]}")

    quote = resp.json()
    return {
        "input_mint": input_mint,
        "output_mint": config.USDC_MINT,
        "in_amount": quote["inAmount"],
        "out_amount": quote["outAmount"],
        "out_amount_ui": int(quote["outAmount"]) / 10 ** 6,
        "price_impact_pct": float(quote.get("priceImpactPct") or 0),
        "quote": quote,
    }


def build_swap_transaction(quote: dict, user_public_key: str) -> str:
    try:
        resp = httpx.post(f"{config.JUPITER_BASE_URL}/swap", json={
            "quoteResponse": quote,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": True,
        }, timeout=15)
    except httpx.HTTPError as exc:
        raise QuoteError(f"jupiter unreachable: {exc}") from exc

    if resp.status_code != 200:
        raise QuoteError(f"jupiter swap build failed ({resp.status_code}): {resp.text[:200]}")

    return resp.json()["swapTransaction"]
