from fastapi.testclient import TestClient

from app import store
from app.main import app

client = TestClient(app)


def test_create_session_returns_id():
    resp = client.post("/api/session")
    assert resp.status_code == 200
    sid = resp.json()["session_id"]
    assert len(sid) == 32


def test_sessions_are_distinct():
    a = client.post("/api/session").json()["session_id"]
    b = client.post("/api/session").json()["session_id"]
    assert a != b


def test_get_or_create_returns_same_session():
    s = store.get_or_create_session("abc")
    s.paper_trades.append(
        store.PaperTrade("m", None, 1.0, 2.0, 2.0, 0.0)
    )
    again = store.get_or_create_session("abc")
    assert len(again.paper_trades) == 1


def test_cache_ttl_and_stale():
    store.cache_put("k", {"v": 1})
    assert store.cache_get("k", ttl=60) == {"v": 1}
    assert store.cache_get("k", ttl=-1) is None
    assert store.cache_get_stale("k") == {"v": 1}
