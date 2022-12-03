
import WalletMonitoringDashboard from "@/components/WalletMonitoringDashboard";

const Recommendations = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Solana Wallet Pattern Analysis & Trading Bot</h1>
        <p className="text-muted-foreground">Real-time wallet monitoring and leader-follower pattern detection</p>
      </header>

      <WalletMonitoringDashboard />
    </div>
  );
};

export default Recommendations;
