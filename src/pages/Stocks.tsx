import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetchTopStocks = async () => {
  // hardcoded for now, haven't wired up the Alpha Vantage API yet
  const mockStocks = [
    { symbol: "AAPL", name: "Apple Inc.", price: 189.25, change: 2.15, changePercent: 1.15, volume: 45234567 },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.90, change: -1.45, changePercent: -0.38, volume: 28456789 },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.78, change: 3.22, changePercent: 2.31, volume: 31567890 },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 156.43, change: 4.67, changePercent: 3.08, volume: 39876543 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 248.91, change: -8.34, changePercent: -3.24, volume: 67543210 },
    { symbol: "META", name: "Meta Platforms Inc.", price: 485.32, change: 12.45, changePercent: 2.63, volume: 25678901 },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.43, change: 18.76, changePercent: 2.19, volume: 42345678 },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 187.65, change: 1.23, changePercent: 0.66, volume: 18765432 },
  ];
  
  return mockStocks;
};

const fetchTrendingStocks = async () => {
  const mockTrending = [
    { symbol: "PLTR", name: "Palantir Technologies", price: 45.67, change: 8.34, changePercent: 22.34, volume: 87654321 },
    { symbol: "SOFI", name: "SoFi Technologies", price: 12.89, change: 2.14, changePercent: 19.95, volume: 45678912 },
    { symbol: "RIVN", name: "Rivian Automotive", price: 18.45, change: 2.87, changePercent: 18.41, volume: 34567890 },
    { symbol: "HOOD", name: "Robinhood Markets", price: 21.34, change: 2.45, changePercent: 12.98, volume: 23456789 },
  ];
  
  return mockTrending;
};

const Stocks = () => {
  const { data: topStocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['topStocks'],
    queryFn: fetchTopStocks,
    refetchInterval: 30000,
  });

  const { data: trendingStocks, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trendingStocks'],
    queryFn: fetchTrendingStocks,
    refetchInterval: 30000,
  });

  if (isLoadingStocks || isLoadingTrending) {
    return (
      <div className="glass-card rounded-lg p-6 animate-pulse">Loading stocks...</div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stock Market</h1>
        <p className="text-muted-foreground">Real-time stock prices and market trends</p>
      </header>

      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="top">Top Stocks</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        
          
          <TabsContent value="top" className="mt-6">
            <div className="glass-card rounded-lg p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUpIcon className="w-6 h-6 text-success" />
                <h2 className="text-xl font-semibold">Top Performing Stocks</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-4">Symbol</th>
                      <th className="pb-4">Company</th>
                      <th className="pb-4">Price</th>
                      <th className="pb-4">Change</th>
                      <th className="pb-4">% Change</th>
                      <th className="pb-4">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStocks?.map((stock) => (
                      <tr key={stock.symbol} className="border-t border-secondary">
                        <td className="py-4 font-bold text-primary">{stock.symbol}</td>
                        <td className="py-4">{stock.name}</td>
                        <td className="py-4 font-medium">${stock.price.toFixed(2)}</td>
                        <td className="py-4">
                          <span className={stock.change >= 0 ? "text-success" : "text-warning"}>
                            ${stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`flex items-center gap-1 ${
                              stock.changePercent >= 0 ? "text-success" : "text-warning"
                            }`}
                          >
                            {stock.changePercent >= 0 ? (
                              <ArrowUpIcon className="w-3 h-3" />
                            ) : (
                              <ArrowDownIcon className="w-3 h-3" />
                            )}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4">{(stock.volume / 1e6).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="glass-card rounded-lg p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔥</span>
                <h2 className="text-xl font-semibold">Trending Stocks</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendingStocks?.map((stock) => (
                  <div key={stock.symbol} className="glass-card p-4 rounded-lg bg-secondary bg-opacity-30">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-primary text-lg">{stock.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${stock.price.toFixed(2)}</p>
                        <span
                          className={`flex items-center gap-1 justify-end ${
                            stock.changePercent >= 0 ? "text-success" : "text-warning"
                          }`}
                        >
                          {stock.changePercent >= 0 ? (
                            <ArrowUpIcon className="w-3 h-3" />
                          ) : (
                            <ArrowDownIcon className="w-3 h-3" />
                          )}
                          {Math.abs(stock.changePercent).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Change:</span>
                        <span className={`text-sm font-medium ${stock.change >= 0 ? "text-success" : "text-warning"}`}>
                          ${stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Volume:</span>
                        <span className="text-sm">{(stock.volume / 1e6).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        
      </Tabs>
    </div>
  );
};

export default Stocks;
