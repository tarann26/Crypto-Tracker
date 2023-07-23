import httpx
import respx
from fastapi.testclient import TestClient

from app.main import app
from app.services import leaders

client = TestClient(app)


def txs(times):
    return [{"signature": f"s{t}", "blockTime": t} for t in times]


def burst_pattern(start):
    # bins 0,2,4,6 hold 3,2,5,4 txs (bin = 300s)
    times = []
    for bin_idx, count in [(0, 3), (2, 2), (4, 5), (6, 4)]:
        base = start + bin_idx * 300
        times += [base + i for i in range(count)]
    return times


def test_shifted_copy_is_detected_as_follower():
    t0 = 1_700_000_000
    histories = {
        "leaderWallet": txs(burst_pattern(t0)),
        "followerWallet": txs(burst_pattern(t0 + 600)),  # same moves, 2 bins later
    }
    result = leaders.detect_leaders(histories)
    assert result["analyzed"] == 2
    assert len(result["leaders"]) >= 1
    top = result["leaders"][0]
    assert top["wallet"] == "leaderWallet"
    assert top["followers"] == ["followerWallet"]
    assert top["avg_lead_seconds"] == 600
    assert top["score"] > 0.3


def test_uncorrelated_wallets_yield_no_leaders():
    t0 = 1_700_000_000
    histories = {
        "a": txs([t0, t0 + 1]),
        "b": txs([t0 + 5000]),
    }
    result = leaders.detect_leaders(histories)
    assert result["leaders"] == []


def test_fewer_than_two_wallets_is_empty():
    assert leaders.detect_leaders({"a": txs([1, 2])})["leaders"] == []
    assert leaders.detect_leaders({})["analyzed"] == 0


@respx.mock
def test_leaders_endpoint_fetches_histories():
    def handler(request):
        return httpx.Response(200, json={
            "jsonrpc": "2.0", "id": 1,
            "result": [{"signature": "s", "blockTime": 1_700_000_000}],
        })
    respx.post("https://api.mainnet-beta.solana.com").mock(side_effect=handler)
    resp = client.post("/api/analysis/leaders", json={
        "wallets": ["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T",
                    "7cVfgArCheMR6Cs4t6vz5rfnqd56vZq4ndaBrY5xkxXy"],
    })
    assert resp.status_code == 200
    assert resp.json()["analyzed"] == 2


@respx.mock
def test_leaders_endpoint_502_when_rpc_fails():
    respx.post("https://api.mainnet-beta.solana.com").mock(return_value=httpx.Response(500))
    respx.post("https://solana-rpc.publicnode.com").mock(return_value=httpx.Response(500))
    resp = client.post("/api/analysis/leaders", json={
        "wallets": ["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T",
                    "7cVfgArCheMR6Cs4t6vz5rfnqd56vZq4ndaBrY5xkxXy"],
    })
    assert resp.status_code == 502
