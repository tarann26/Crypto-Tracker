# Crypto-Tracker

A sophisticated cryptocurrency and stock market dashboard with advanced Solana blockchain analysis capabilities. Track portfolios, monitor wallets in real-time, and detect trading patterns using leader-follower analysis algorithms.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

### Dashboard
- Real-time market statistics (Market Cap, 24h Volume, BTC Dominance)
- Interactive cryptocurrency charts with price visualization
- Top cryptocurrencies with live data from CoinGecko API
- Portfolio overview with gain/loss tracking

### Portfolio Management
- Track cryptocurrency and stock holdings
- Calculate average price vs current price
- Automatic gain/loss calculations with percentage returns
- Dynamic portfolio updates

### Wallet Monitoring (Solana)
- Real-time Solana wallet monitoring with multiple RPC endpoints
- Automatic failover between RPC connections
- Live activity feed showing transfers, swaps, and token changes
- Account change subscriptions for instant updates

### Leader Detection Analysis
- Transaction pattern analysis across multiple wallets
- Wallet correlation detection algorithms
- Lead-lag time calculations to identify market movers
- Follower cluster identification with strength metrics

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool with React SWC compiler
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **TanStack Query** - Server state management

### Blockchain
- **Solana Web3.js** - Blockchain interaction
- **@solana/spl-token** - SPL token handling

### Backend (Data Processing)
- **Python 3.11+**
- **FastAPI** - REST API framework
- **Celery** - Distributed task queue
- **Redis** - Message broker & caching

### Data Analysis
- **pandas** - Data manipulation
- **NumPy** - Numerical computing
- **scikit-learn** - ML algorithms for pattern detection
- **scipy** - Statistical analysis

### Database
- **Supabase** - PostgreSQL database & authentication
- **SQLAlchemy** - Python ORM

## Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- Redis server
- Supabase project

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/crypto-tracker.git
cd crypto-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start Redis (required for Celery)
redis-server

# Run Celery worker
celery -A app.celery worker --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost/crypto_tracker
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# API Keys
COINGECKO_API_KEY=your_api_key
```

## Project Structure

```
/src
├── /pages                    # Main page components
│   ├── Index.tsx            # Dashboard home
│   ├── Portfolio.tsx        # Portfolio management
│   ├── Stocks.tsx           # Stock market data
│   └── Recommendations.tsx  # Wallet monitoring
│
├── /components              # Reusable UI components
│   ├── WalletMonitoringDashboard.tsx
│   ├── LeaderDetectionPanel.tsx
│   └── /ui                  # shadcn/ui components
│
├── /hooks                   # Custom React hooks
│   ├── useWalletMonitoring.ts
│   ├── useTransactionAnalysis.ts
│   ├── useLeaderDetection.ts
│   └── useSolanaConnection.ts
│
└── /lib                     # Utility functions

/backend
├── /app
│   ├── main.py              # FastAPI application
│   ├── celery.py            # Celery configuration
│   └── /services
│       ├── analysis.py      # Transaction analysis
│       └── blockchain.py    # Solana data fetching
│
├── /ml
│   ├── correlation.py       # Wallet correlation models
│   └── clustering.py        # Follower clustering
│
└── requirements.txt
```

## Leader Detection Algorithm

The leader detection system uses a weighted scoring algorithm:

```
Leader Score = (Volume × 0.3) + (Correlation × 0.4) + (Consistency × 0.2) + (Timing × 0.1)
```

- **Volume Weight (30%)**: Transaction volume relative to monitored wallets
- **Correlation Weight (40%)**: Strength of pattern correlation with followers
- **Consistency Weight (20%)**: Confidence level of detected patterns
- **Timing Weight (10%)**: Optimal lead time (1 minute to 1 hour preferred)

Minimum threshold for leader classification: 0.3 (30%)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallets` | GET | List monitored wallets |
| `/api/wallets/{address}` | GET | Get wallet details |
| `/api/analysis/correlations` | POST | Run correlation analysis |
| `/api/analysis/leaders` | GET | Get detected leaders |
| `/api/transactions/{address}` | GET | Get wallet transactions |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CoinGecko API](https://www.coingecko.com/en/api) for cryptocurrency data
- [Solana](https://solana.com/) for blockchain infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for UI components
