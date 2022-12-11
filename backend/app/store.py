import time
import uuid
from dataclasses import dataclass, field


@dataclass
class PaperTrade:
    mint: str
    symbol: str | None
    amount: float
    quote_usdc: float
    price_at_fill: float
    timestamp: float


@dataclass
class Session:
    id: str
    created_at: float
    paper_trades: list[PaperTrade] = field(default_factory=list)


# TODO: everything below lives in process memory only. restart the server
# and it's gone. fine for now, needs a real db eventually.
_sessions: dict[str, Session] = {}
_cache: dict[str, tuple[float, object]] = {}


def create_session() -> Session:
    s = Session(id=uuid.uuid4().hex, created_at=time.time())
    _sessions[s.id] = s
    return s


def get_or_create_session(session_id: str) -> Session:
    s = _sessions.get(session_id)
    if s is None:
        s = Session(id=session_id, created_at=time.time())
        _sessions[session_id] = s
    return s


def cache_get(key: str, ttl: float):
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    return None


def cache_get_stale(key: str):
    hit = _cache.get(key)
    return hit[1] if hit else None


def cache_put(key: str, value) -> None:
    _cache[key] = (time.time(), value)


def reset() -> None:
    _sessions.clear()
    _cache.clear()
