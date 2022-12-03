
import { useState, useCallback, useMemo } from 'react';
import { WalletCorrelation, TransactionPattern } from './useTransactionAnalysis';

export interface LeaderWallet {
  address: string;
  label: string;
  leaderScore: number;
  followerCount: number;
  avgLeadTime: number;
  confidence: number;
  totalTransactions: number;
  successRate: number;
}

export interface FollowerCluster {
  leader: string;
  followers: string[];
  avgLeadTime: number;
  clusterStrength: number;
}

export const useLeaderDetection = () => {
  const [detectedLeaders, setDetectedLeaders] = useState<LeaderWallet[]>([]);
  const [followerClusters, setFollowerClusters] = useState<FollowerCluster[]>([]);

  const calculateLeaderScore = useCallback((
    walletAddress: string,
    correlations: WalletCorrelation[],
    patterns: TransactionPattern[]
  ): LeaderWallet | null => {
    // Find all correlations where this wallet leads
    const leadingCorrelations = correlations.filter(c => 
      (c.wallet1 === walletAddress && c.leadLagSeconds > 0) ||
      (c.wallet2 === walletAddress && c.leadLagSeconds < 0)
    );

    if (leadingCorrelations.length === 0) return null;

    const walletPatterns = patterns.filter(p => p.wallet === walletAddress);
    
    // Calculate metrics
    const followerCount = leadingCorrelations.length;
    const avgCorrelation = leadingCorrelations.reduce((sum, c) => sum + c.correlation, 0) / followerCount;
    const avgLeadTime = leadingCorrelations.reduce((sum, c) => sum + Math.abs(c.leadLagSeconds), 0) / followerCount;
    const avgConfidence = leadingCorrelations.reduce((sum, c) => sum + c.confidence, 0) / followerCount;
    
    // Leader score calculation
    const volumeScore = Math.min(walletPatterns.length / 100, 1); // Normalize transaction count
    const correlationScore = avgCorrelation;
    const consistencyScore = avgConfidence;
    const timingScore = avgLeadTime > 0 && avgLeadTime < 3600 ? 1 : 0.5; // Prefer 1-hour lead times
    
    const leaderScore = (volumeScore * 0.3 + correlationScore * 0.4 + consistencyScore * 0.2 + timingScore * 0.1);
    
    return {
      address: walletAddress,
      label: `Leader ${walletAddress.slice(0, 8)}...`,
      leaderScore,
      followerCount,
      avgLeadTime,
      confidence: avgConfidence,
      totalTransactions: walletPatterns.length,
      successRate: correlationScore * 100 // Convert to percentage
    };
  }, []);

  const detectLeaders = useCallback((
    correlations: WalletCorrelation[],
    patterns: TransactionPattern[],
    monitoredWallets: string[]
  ) => {
    const leaders: LeaderWallet[] = [];
    const clusters: FollowerCluster[] = [];

    // Get all unique wallet addresses
    const allWallets = new Set([
      ...correlations.map(c => c.wallet1),
      ...correlations.map(c => c.wallet2),
      ...monitoredWallets
    ]);

    // Calculate leader scores for each wallet
    for (const wallet of allWallets) {
      const leaderData = calculateLeaderScore(wallet, correlations, patterns);
      if (leaderData && leaderData.leaderScore > 0.3) { // Minimum threshold
        leaders.push(leaderData);
      }
    }

    // Sort by leader score
    leaders.sort((a, b) => b.leaderScore - a.leaderScore);

    // Build follower clusters
    for (const leader of leaders.slice(0, 10)) { // Top 10 leaders
      const followers = correlations
        .filter(c => 
          (c.wallet1 === leader.address && c.leadLagSeconds > 0) ||
          (c.wallet2 === leader.address && c.leadLagSeconds < 0)
        )
        .map(c => c.wallet1 === leader.address ? c.wallet2 : c.wallet1);

      if (followers.length > 0) {
        const avgLeadTime = correlations
          .filter(c => 
            (c.wallet1 === leader.address && c.leadLagSeconds > 0) ||
            (c.wallet2 === leader.address && c.leadLagSeconds < 0)
          )
          .reduce((sum, c) => sum + Math.abs(c.leadLagSeconds), 0) / followers.length;

        const clusterStrength = correlations
          .filter(c => 
            (c.wallet1 === leader.address && c.leadLagSeconds > 0) ||
            (c.wallet2 === leader.address && c.leadLagSeconds < 0)
          )
          .reduce((sum, c) => sum + c.correlation, 0) / followers.length;

        clusters.push({
          leader: leader.address,
          followers: [...new Set(followers)], // Remove duplicates
          avgLeadTime,
          clusterStrength
        });
      }
    }

    setDetectedLeaders(leaders);
    setFollowerClusters(clusters);

    console.log(`🎯 Detected ${leaders.length} potential leaders with ${clusters.length} clusters`);
    
    return { leaders, clusters };
  }, [calculateLeaderScore]);

  // Get top leaders for monitoring
  const topLeaders = useMemo(() => {
    return detectedLeaders
      .filter(leader => leader.leaderScore > 0.5 && leader.followerCount >= 2)
      .slice(0, 5);
  }, [detectedLeaders]);

  return {
    detectedLeaders,
    followerClusters,
    topLeaders,
    detectLeaders
  };
};
