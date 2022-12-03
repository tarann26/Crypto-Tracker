
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Plus, 
  Trash2, 
  Activity, 
  Wallet, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useSolanaConnection } from '@/hooks/useSolanaConnection';
import { useWalletMonitoring } from '@/hooks/useWalletMonitoring';
import LeaderDetectionPanel from './LeaderDetectionPanel';

const WalletMonitoringDashboard = () => {
  const { 
    connection, 
    isConnected, 
    error, 
    retryConnection, 
    switchToNextEndpoint,
    currentEndpoint,
    availableEndpoints 
  } = useSolanaConnection();
  
  const { 
    monitoredWallets, 
    realtimeActivity, 
    isMonitoring,
    addWalletToMonitor, 
    removeWalletFromMonitor,
    startMonitoring,
    stopMonitoring 
  } = useWalletMonitoring(connection);

  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [isLeader, setIsLeader] = useState(false);

  const handleAddWallet = async () => {
    if (!newWalletAddress.trim() || !newWalletLabel.trim()) return;
    
    await addWalletToMonitor(newWalletAddress.trim(), newWalletLabel.trim(), isLeader);
    setNewWalletAddress('');
    setNewWalletLabel('');
    setIsLeader(false);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transfer': return <TrendingUp className="w-4 h-4" />;
      case 'swap': return <Activity className="w-4 h-4" />;
      case 'token_change': return <Wallet className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="font-medium">
              Solana RPC Connection: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Active' : 'Inactive'}
            </Badge>
            {!isConnected && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={retryConnection}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={switchToNextEndpoint}
                  className="flex items-center gap-1"
                >
                  <Wifi className="w-3 h-3" />
                  Switch RPC
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Current endpoint: {currentEndpoint}
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Connection Error:</strong> {error}
            <br />
            <span className="text-xs">Try clicking "Switch RPC" to use a different endpoint</span>
          </div>
        )}
      </Card>

      {/* Add New Wallet */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Wallet to Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Wallet Address"
            value={newWalletAddress}
            onChange={(e) => setNewWalletAddress(e.target.value)}
            className="md:col-span-2"
          />
          <Input
            placeholder="Label"
            value={newWalletLabel}
            onChange={(e) => setNewWalletLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant={isLeader ? 'default' : 'outline'}
              onClick={() => setIsLeader(!isLeader)}
              className="flex-1"
            >
              {isLeader ? 'Leader' : 'Follower'}
            </Button>
            <Button onClick={handleAddWallet} disabled={!isConnected}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="leaders">Leader Detection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitoring" className="space-y-4">
          {/* Monitoring Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Real-time Monitoring
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  variant={isMonitoring ? 'destructive' : 'default'}
                  disabled={!isConnected || monitoredWallets.length === 0}
                >
                  {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Monitored Wallets: {monitoredWallets.length}</span>
              <span>Recent Activities: {realtimeActivity.length}</span>
              <span>Status: {isMonitoring ? 'Active' : 'Inactive'}</span>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monitored Wallets */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Monitored Wallets ({monitoredWallets.length})
              </h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {monitoredWallets.map((wallet) => (
                    <div key={wallet.address} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={wallet.isLeader ? 'default' : 'secondary'}>
                            {wallet.isLeader ? 'Leader' : 'Follower'}
                          </Badge>
                          <span className="font-medium">{wallet.label}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeWalletFromMonitor(wallet.address)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {wallet.address}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Transactions: {wallet.totalTransactions}</span>
                        <span>Last: {formatTimestamp(wallet.lastActivity)}</span>
                      </div>
                    </div>
                  ))}
                  {monitoredWallets.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No wallets being monitored
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* Real-time Activity Feed */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Activity Feed
              </h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {realtimeActivity.map((activity, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-sm font-medium capitalize">
                            {activity.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {activity.wallet}
                      </p>
                      {activity.amount && (
                        <p className="text-sm mt-1">
                          Amount: {activity.amount} {activity.token || 'SOL'}
                        </p>
                      )}
                    </div>
                  ))}
                  {realtimeActivity.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="leaders">
          <LeaderDetectionPanel 
            monitoredWallets={monitoredWallets}
            connection={connection}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletMonitoringDashboard;
