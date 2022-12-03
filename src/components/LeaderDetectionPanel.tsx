
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { useTransactionAnalysis } from '@/hooks/useTransactionAnalysis';
import { useLeaderDetection } from '@/hooks/useLeaderDetection';
import { MonitoredWallet } from '@/hooks/useWalletMonitoring';

interface LeaderDetectionPanelProps {
  monitoredWallets: MonitoredWallet[];
  connection: any;
}

const LeaderDetectionPanel = ({ monitoredWallets, connection }: LeaderDetectionPanelProps) => {
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);
  
  const { 
    isAnalyzing, 
    analysisProgress, 
    transactionPatterns, 
    walletCorrelations,
    analyzeWalletPatterns 
  } = useTransactionAnalysis(connection);

  const { 
    detectedLeaders, 
    followerClusters, 
    topLeaders,
    detectLeaders 
  } = useLeaderDetection();

  const handleStartAnalysis = async () => {
    const walletAddresses = monitoredWallets.map(w => w.address);
    if (walletAddresses.length === 0) return;
    
    await analyzeWalletPatterns(walletAddresses);
    detectLeaders(walletCorrelations, transactionPatterns, walletAddresses);
  };

  const formatLeadTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getScoreColor = (score: number) => {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Leader Detection Analysis
          </h3>
          <Button 
            onClick={handleStartAnalysis}
            disabled={isAnalyzing || monitoredWallets.length === 0}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
        
        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={analysisProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Analyzing {monitoredWallets.length} wallets... {Math.round(analysisProgress)}%
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{transactionPatterns.length}</div>
            <div className="text-sm text-muted-foreground">Patterns Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{walletCorrelations.length}</div>
            <div className="text-sm text-muted-foreground">Correlations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{detectedLeaders.length}</div>
            <div className="text-sm text-muted-foreground">Leaders Found</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Leaders */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Leader Wallets
          </h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {topLeaders.map((leader) => (
                <div key={leader.address} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="text-xs">
                      Leader Score: {leader.leaderScore.toFixed(3)}
                    </Badge>
                    <Badge variant="outline" className={getScoreColor(leader.leaderScore)}>
                      {leader.successRate.toFixed(1)}% Success
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    {leader.address}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {leader.followerCount} followers
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLeadTime(leader.avgLeadTime)} lead
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {leader.totalTransactions} txns
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {(leader.confidence * 100).toFixed(0)}% conf
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => {
                      if (selectedLeaders.includes(leader.address)) {
                        setSelectedLeaders(prev => prev.filter(a => a !== leader.address));
                      } else {
                        setSelectedLeaders(prev => [...prev, leader.address]);
                      }
                    }}
                  >
                    {selectedLeaders.includes(leader.address) ? 'Remove from Watch' : 'Add to Watch'}
                  </Button>
                </div>
              ))}
              {topLeaders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No leader wallets detected yet. Run analysis first.
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Follower Clusters */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Follower Clusters
          </h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {followerClusters.map((cluster, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      Cluster {index + 1}
                    </Badge>
                    <Badge variant="outline">
                      Strength: {cluster.clusterStrength.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-2">
                    Leader: {cluster.leader.slice(0, 16)}...
                  </p>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span>{cluster.followers.length} followers</span>
                    <span>Avg lead: {formatLeadTime(cluster.avgLeadTime)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="max-h-16 overflow-y-auto">
                      {cluster.followers.slice(0, 3).map((follower, i) => (
                        <div key={i} className="font-mono">
                          {follower.slice(0, 12)}...
                        </div>
                      ))}
                      {cluster.followers.length > 3 && (
                        <div>+{cluster.followers.length - 3} more...</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {followerClusters.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No follower clusters detected yet.
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default LeaderDetectionPanel;
