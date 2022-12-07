import os

SOLANA_RPC_URLS = [u.strip() for u in os.environ.get(
    "SOLANA_RPC_URLS",
    "https://api.mainnet-beta.solana.com,https://solana-rpc.publicnode.com",
).split(",") if u.strip()]

JUPITER_BASE_URL = os.environ.get("JUPITER_BASE_URL", "https://lite-api.jup.ag/swap/v1")
COINGECKO_BASE_URL = os.environ.get("COINGECKO_BASE_URL", "https://api.coingecko.com/api/v3")

USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
WSOL_MINT = "So11111111111111111111111111111111111111112"
TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

PRICE_CACHE_TTL = 60.0
CONFIRM_TIMEOUT = 60.0
