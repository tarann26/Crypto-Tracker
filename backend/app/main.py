from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import prices, trade

app = FastAPI(title="crypto-tracker backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prices.router)
app.include_router(trade.router)
