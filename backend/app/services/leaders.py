import numpy as np
import pandas as pd

BIN_SECONDS = 300
MAX_LAG_BINS = 6
MIN_CORRELATION = 0.2
LEADER_THRESHOLD = 0.3


def _binned_counts(txs: list[dict], start: int, n_bins: int) -> np.ndarray:
    counts = np.zeros(n_bins)
    for tx in txs:
        t = tx.get("blockTime")
        if t is None:
            continue
        idx = int((t - start) // BIN_SECONDS)
        if 0 <= idx < n_bins:
            counts[idx] += 1
    return counts


def _best_lag_correlation(a: np.ndarray, b: np.ndarray) -> tuple[float, int]:
    """Best Pearson correlation over lags; positive lag means `a` leads `b`."""
    best_corr, best_lag = 0.0, 0
    for lag in range(-MAX_LAG_BINS, MAX_LAG_BINS + 1):
        if lag > 0:
            x, y = a[:-lag], b[lag:]
        elif lag < 0:
            x, y = a[-lag:], b[:lag]
        else:
            x, y = a, b

        if len(x) < 3 or x.std() == 0 or y.std() == 0:
            continue

        corr = pd.Series(x).corr(pd.Series(y))
        if pd.notna(corr) and abs(corr) > abs(best_corr):
            best_corr, best_lag = float(corr), lag

    return best_corr, best_lag * BIN_SECONDS


def _pairwise_correlations(series: dict[str, np.ndarray], histories: dict[str, list[dict]]) -> list[dict]:
    wallets = sorted(series)
    pairs = []
    for i, w1 in enumerate(wallets):
        for w2 in wallets[i + 1:]:
            corr, lag = _best_lag_correlation(series[w1], series[w2])
            if abs(corr) <= MIN_CORRELATION:
                continue
            pairs.append({
                "wallet1": w1,
                "wallet2": w2,
                "correlation": abs(corr),
                "lead_lag_seconds": lag,
                "confidence": min(len(histories[w1]) + len(histories[w2]), 40) / 40,
            })
    return pairs


def _score_wallet(wallet: str, correlations: list[dict], histories: dict[str, list[dict]]) -> dict | None:
    leading = [c for c in correlations
               if (c["wallet1"] == wallet and c["lead_lag_seconds"] > 0)
               or (c["wallet2"] == wallet and c["lead_lag_seconds"] < 0)]
    if not leading:
        return None

    n = len(leading)
    avg_corr = sum(c["correlation"] for c in leading) / n
    avg_lead = sum(abs(c["lead_lag_seconds"]) for c in leading) / n
    avg_conf = sum(c["confidence"] for c in leading) / n

    volume_score = min(len(histories[wallet]) / 100, 1)
    timing_score = 1.0 if 0 < avg_lead < 3600 else 0.5
    score = volume_score * 0.3 + avg_corr * 0.4 + avg_conf * 0.2 + timing_score * 0.1
    if score <= LEADER_THRESHOLD:
        return None

    followers = sorted({c["wallet2"] if c["wallet1"] == wallet else c["wallet1"] for c in leading})
    return {
        "wallet": wallet,
        "score": round(score, 4),
        "follower_count": n,
        "avg_lead_seconds": avg_lead,
        "correlation": round(avg_corr, 4),
        "followers": followers,
    }


def detect_leaders(histories: dict[str, list[dict]]) -> dict:
    times = [tx["blockTime"] for txs in histories.values() for tx in txs if tx.get("blockTime")]
    if len(histories) < 2 or len(times) < 2:
        return {"leaders": [], "analyzed": len(histories)}

    start = min(times)
    n_bins = int((max(times) - start) // BIN_SECONDS) + 1
    series = {w: _binned_counts(txs, start, n_bins) for w, txs in histories.items()}
    correlations = _pairwise_correlations(series, histories)

    results = [r for w in sorted(series) if (r := _score_wallet(w, correlations, histories))]
    results.sort(key=lambda r: r["score"], reverse=True)
    return {"leaders": results, "analyzed": len(histories)}
