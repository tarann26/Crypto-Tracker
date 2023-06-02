
import { PlusIcon, TrendingUpIcon, DollarSignIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import SellPanel from "@/components/SellPanel";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  type: 'crypto' | 'stock';
}

const Portfolio = () => {
  const [holdings, setHoldings] = useState<Holding[]>([
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.5,
      avgPrice: 45000,
      currentPrice: 47500,
      type: 'crypto'
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 2.3,
      avgPrice: 2800,
      currentPrice: 3100,
      type: 'crypto'
    },
    {
      id: '3',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 10,
      avgPrice: 175,
      currentPrice: 189.25,
      type: 'stock'
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      quantity: 5,
      avgPrice: 220,
      currentPrice: 248.91,
      type: 'stock'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    name: '',
    quantity: '',
    avgPrice: '',
    currentPrice: '',
    type: 'crypto' as 'crypto' | 'stock'
  });

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.currentPrice), 0);
  const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.avgPrice), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = ((totalGainLoss / totalCost) * 100);

  const handleAddHolding = () => {
    if (newHolding.symbol && newHolding.name && newHolding.quantity && newHolding.avgPrice && newHolding.currentPrice) {
      const holding: Holding = {
        id: Date.now().toString(),
        symbol: newHolding.symbol.toUpperCase(),
        name: newHolding.name,
        quantity: parseFloat(newHolding.quantity),
        avgPrice: parseFloat(newHolding.avgPrice),
        currentPrice: parseFloat(newHolding.currentPrice),
        type: newHolding.type
      };
      
      setHoldings([...holdings, holding]);
      setNewHolding({
        symbol: '',
        name: '',
        quantity: '',
        avgPrice: '',
        currentPrice: '',
        type: 'crypto'
      });
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Tracker</h1>
          <p className="text-muted-foreground">Track your crypto and stock investments</p>
        </header>

        <Navigation />
        <SellPanel />

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-warning'}`}>
                ${totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString()}
              </div>
              <p className={`text-xs ${totalGainLossPercent >= 0 ? 'text-success' : 'text-warning'}`}>
                {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holdings</CardTitle>
              <span className="text-2xl">{holdings.length}</span>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Add Holding Form */}
        {showAddForm && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Add New Holding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="BTC, AAPL, etc."
                    value={newHolding.symbol}
                    onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Bitcoin, Apple Inc., etc."
                    value={newHolding.name}
                    onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="0.5"
                    value={newHolding.quantity}
                    onChange={(e) => setNewHolding({...newHolding, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgPrice">Average Price</Label>
                  <Input
                    id="avgPrice"
                    type="number"
                    step="0.01"
                    placeholder="45000"
                    value={newHolding.avgPrice}
                    onChange={(e) => setNewHolding({...newHolding, avgPrice: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Current Price</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    placeholder="47500"
                    value={newHolding.currentPrice}
                    onChange={(e) => setNewHolding({...newHolding, currentPrice: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newHolding.type}
                    onChange={(e) => setNewHolding({...newHolding, type: e.target.value as 'crypto' | 'stock'})}
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddHolding}>Add Holding</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Holdings List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-4">Asset</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4">Quantity</th>
                    <th className="pb-4">Avg Price</th>
                    <th className="pb-4">Current Price</th>
                    <th className="pb-4">Value</th>
                    <th className="pb-4">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => {
                    const value = holding.quantity * holding.currentPrice;
                    const cost = holding.quantity * holding.avgPrice;
                    const gainLoss = value - cost;
                    const gainLossPercent = ((gainLoss / cost) * 100);

                    return (
                      <tr key={holding.id} className="border-t border-secondary">
                        <td className="py-4">
                          <div>
                            <p className="font-bold text-primary">{holding.symbol}</p>
                            <p className="text-sm text-muted-foreground">{holding.name}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            holding.type === 'crypto' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {holding.type}
                          </span>
                        </td>
                        <td className="py-4">{holding.quantity}</td>
                        <td className="py-4">${holding.avgPrice.toLocaleString()}</td>
                        <td className="py-4">${holding.currentPrice.toLocaleString()}</td>
                        <td className="py-4 font-medium">${value.toLocaleString()}</td>
                        <td className="py-4">
                          <div className={gainLoss >= 0 ? 'text-success' : 'text-warning'}>
                            <p className="font-medium">
                              ${gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString()}
                            </p>
                            <p className="text-xs">
                              {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portfolio;
