import pytest

from app.services import coingecko, jupiter

WSOL = "So11111111111111111111111111111111111111112"

pytestmark = pytest.mark.live


def test_live_coingecko_sol_price():
    price = coingecko.simple_price(["solana"])["solana"]["usd"]
    assert price > 0


def test_live_jupiter_quote_sol_to_usdc():
    q = jupiter.get_quote(WSOL, 0.1)
    assert q["out_amount_ui"] > 0
    assert q["quote"]["outputMint"] == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
