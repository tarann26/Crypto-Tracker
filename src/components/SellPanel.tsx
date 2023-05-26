import { useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const API = "http://localhost:8000";
const WSOL = "So11111111111111111111111111111111111111112";

interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  usd: number | null;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

async function getSessionId(): Promise<string> {
  const existing = localStorage.getItem("ct_session");
  if (existing) return existing;
  const res = await fetch(`${API}/api/session`, { method: "POST" });
  const { session_id } = await res.json();
  localStorage.setItem("ct_session", session_id);
  return session_id;
}

const shortMint = (mint: string) => `${mint.slice(0, 4)}…${mint.slice(-4)}`;

const SellPanel = () => {
  const [wallet, setWallet] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [selectedMint, setSelectedMint] = useState(WSOL);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<{ out_amount_ui: number; price_impact_pct: number } | null>(null);
  const [paperMode, setPaperMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const connect = async () => {
    const provider = (window as any).solana;
    if (!provider?.isPhantom) {
      setStatus("phantom not found, install the extension first");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const resp = await provider.connect();
      const address = resp.publicKey.toString();
      setWallet(address);

      const res = await fetch(`${API}/api/wallet/${address}/balances`);
      if (!res.ok) throw new Error("could not load balances");
      const data = await res.json();
      setSolBalance(data.sol.amount);
      setTokens(data.tokens);
    } catch (e: any) {
      setStatus(e.message ?? "connect failed");
    } finally {
      setBusy(false);
    }
  };

  const fetchQuote = async () => {
    if (!amount || Number(amount) <= 0) return;

    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/api/trade/quote?input_mint=${selectedMint}&amount=${amount}`);
      if (!res.ok) throw new Error((await res.json()).detail);
      setQuote(await res.json());
    } catch (e: any) {
      setStatus(e.message ?? "quote failed");
      setQuote(null);
    } finally {
      setBusy(false);
    }
  };

  const sell = async () => {
    if (!wallet || !amount || Number(amount) <= 0) return;

    setBusy(true);
    setStatus(null);
    try {
      if (paperMode) {
        const session_id = await getSessionId();
        const res = await fetch(`${API}/api/trade/paper`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id,
            input_mint: selectedMint,
            symbol: selectedMint === WSOL ? "SOL" : null,
            amount: Number(amount),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).detail);
        const { trade } = await res.json();
        setStatus(`paper fill recorded: ${trade.quote_usdc.toFixed(2)} usdc`);
      } else {
        const res = await fetch(`${API}/api/trade/swap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_public_key: wallet,
            input_mint: selectedMint,
            amount: Number(amount),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).detail);
        const { swap_transaction } = await res.json();

        const tx = VersionedTransaction.deserialize(b64ToBytes(swap_transaction));
        const signed = await (window as any).solana.signTransaction(tx);

        const exec = await fetch(`${API}/api/trade/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signed_transaction: bytesToB64(signed.serialize()) }),
        });
        const result = await exec.json();
        setStatus(
          result.status === "confirmed"
            ? `confirmed — solscan.io/tx/${result.signature}`
            : `${result.status}: ${result.error ?? result.signature ?? "unknown"}`
        );
      }
    } catch (e: any) {
      setStatus(e.message ?? "sell failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Sell to USDC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!wallet ? (
          <Button onClick={connect} disabled={busy}>
            Connect Phantom
          </Button>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {wallet.slice(0, 4)}…{wallet.slice(-4)}
              {solBalance !== null && ` · ${solBalance.toFixed(4)} SOL`}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMint === WSOL ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMint(WSOL)}
              >
                SOL
              </Button>
              {tokens.map((t) => (
                <Button
                  key={t.mint}
                  variant={selectedMint === t.mint ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMint(t.mint)}
                >
                  {shortMint(t.mint)} ({t.amount})
                </Button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="sell-amount">Amount</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchQuote} disabled={busy}>
                Quote
              </Button>
            </div>

            {quote && (
              <p className="text-sm">
                ≈ {quote.out_amount_ui.toFixed(2)} USDC
                {quote.price_impact_pct > 0 && ` (impact ${(quote.price_impact_pct * 100).toFixed(2)}%)`}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Switch id="paper-mode" checked={paperMode} onCheckedChange={setPaperMode} />
              <Label htmlFor="paper-mode">{paperMode ? "Paper mode" : "Real swap"}</Label>
            </div>

            <Button onClick={sell} disabled={busy || !amount}>
              {paperMode ? "Paper sell" : "Sell for real"}
            </Button>
          </>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
};

export default SellPanel;
